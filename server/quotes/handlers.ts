import type { GenerateProduct } from '../admin/aiProduct.js'
import {
  guestStatusSchema,
  quoteReferencePattern,
  quoteRequestSchema,
  wishlistSchema,
  type QuoteSummary,
  type SubmitQuoteResponse,
} from '../../src/features/quotes/schema.js'
import { contactSchema } from '../../src/features/contact/schema.js'
import { apiError, bearerToken, clientIp, HttpError, json, readJson } from '../http.js'
import type { AuthFailureReason, AuthVerifier } from './auth.js'
import { hmac, newGuestToken } from './crypto.js'
import type { DataStore } from './store.js'
import type { HumanCheck } from './turnstile.js'
import type { UserDirectory } from './directory.js'
import type { FileStorage } from './fileStorage.js'
import type { ResourceCatalog } from '../../src/features/resources/types.js'
import { createAdminHandler } from '../admin/handlers.js'

export interface ApiHandlerDeps {
  generateProduct?: GenerateProduct
  /** Null when the database is not configured: endpoints answer 503 instead of pretending to work. */
  store: DataStore | null
  verifyAuth: AuthVerifier
  hashSecret: string
  /** Slugs customers may reference (published catalogue). */
  knownProducts: () => Promise<Set<string>>
  /** Called after admin catalogue changes (cache invalidation). */
  onCatalogChange?: () => void
  humanCheck?: HumanCheck
  /** Private document storage for the Resource Center; null disables uploads/downloads. */
  files?: FileStorage | null
  /** Clerk user lookups for admin invitations; null/undefined disables invitation acceptance. */
  directory?: UserDirectory | null
  /** Exact origins allowed to call the API from a browser. Empty = same-origin deployments only rely on CORS defaults. */
  allowedOrigins: string[]
  now?: () => number
  /** Minimum ms between opening the form and submitting (bot timing signal). */
  minFillMs?: number
}

const MAX_BODY_BYTES = 16 * 1024
const WINDOW_SECONDS = 600
export const LIMITS = { submitPerIp: 8, submitPerUser: 8, listPerUser: 300, guestLookupPerIp: 10, wishlistPerUser: 300, contactPerIp: 5, adminPerUser: 600, catalogPerIp: 600, viewsPerIp: 120, invitesPerAdmin: 20, resourcesPerIp: 600, downloadsPerIp: 120 }

const notConfigured = () => apiError(503, 'not_configured', 'The quote service is not available yet. Please try again later.')
const rateLimited = () =>
  apiError(429, 'rate_limited', 'Too many requests. Please wait a few minutes and try again.', {}, { 'retry-after': String(WINDOW_SECONDS) })
/** Only a genuinely expired token is reported as an expired session; other failures get their own codes. */
const sessionInvalid = (reason?: AuthFailureReason) => {
  if (reason === 'unconfigured' || reason === 'unavailable')
    return apiError(503, 'auth_unavailable', 'We can’t verify sign-ins right now. Please try again in a few minutes.')
  if (reason === 'rejected')
    return apiError(401, 'session_rejected', 'We couldn’t verify your sign-in for this site. Please sign out and sign in again.')
  return apiError(401, 'session_invalid', 'Your sign-in session has expired. Sign in again, or sign out to continue as a guest.')
}

/** Origin the API is served from (same origin as the storefront); an acceptable token `azp`. */
const requestOrigin = (request: Request) => {
  try {
    return new URL(request.url).origin
  } catch {
    return undefined
  }
}

function serverError(scope: string, error: unknown) {
  // Log a code only: never the payload, contact details or tokens.
  console.error(`[quotes] ${scope}:`, error instanceof Error ? error.message : 'unknown error')
  return apiError(500, 'server_error', 'Something went wrong on our side. Your request was not saved; please try again.')
}

/** Crawlers, previews, headless browsers and scripted clients are never counted as product views. */
const BOT_UA = /bot|crawl|spider|slurp|scrape|fetch|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|httpclient|http-client|okhttp|axios|node-fetch|undici|go-http|java\/|libwww|phantom|selenium|playwright|puppeteer|facebookexternalhit|embedly|whatsapp|telegram|discord|slack/i
export const isLikelyBot = (request: Request) => {
  const ua = request.headers.get('user-agent') ?? ''
  if (ua.length < 20 || BOT_UA.test(ua)) return true
  // Real browsers send fetch metadata or an Origin on a scripted POST; reject cross-site beacons.
  const site = request.headers.get('sec-fetch-site')
  if (site === 'cross-site') return true
  return !site && !request.headers.get('origin')
}
const accepted = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })

const nullable = <T>(value: T | undefined): T | null => (value === undefined ? null : value)

export function createApiHandlers(deps: ApiHandlerDeps) {
  const now = deps.now ?? Date.now
  const minFillMs = deps.minFillMs ?? 3000
  const limitKey = (kind: string, id: string) => hmac(deps.hashSecret, `${kind}:${id}`)

  const originAllowed = (request: Request) => {
    const origin = request.headers.get('origin')
    return !origin || deps.allowedOrigins.length === 0 || deps.allowedOrigins.includes(origin)
  }

  async function submit(request: Request): Promise<Response> {
    if (!originAllowed(request)) return apiError(403, 'forbidden_origin', 'Requests from this origin are not allowed.')
    if (!deps.store) return notConfigured()
    const store = deps.store

    try {
      const body = await readJson(request, MAX_BODY_BYTES)
      const auth = await deps.verifyAuth(bearerToken(request), requestOrigin(request))
      if (auth.kind === 'invalid') return sessionInvalid(auth.reason)

      const parsed = quoteRequestSchema.safeParse(body)
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
          if (issue.path[0] === 'website') return apiError(400, 'rejected', 'This request could not be accepted.')
          const field = issue.path.length ? issue.path.join('.') : 'form'
          fieldErrors[field] ??= issue.message
        }
        return apiError(422, 'validation_failed', 'Please correct the highlighted fields.', { fieldErrors })
      }
      const quote = parsed.data

      const known = await deps.knownProducts()
      const unknownItems = quote.items.flatMap((item, i) => (known.has(item.productSlug) ? [] : [i]))
      if (unknownItems.length) {
        return apiError(422, 'validation_failed', 'Please correct the highlighted fields.', {
          fieldErrors: Object.fromEntries(
            unknownItems.map((i) => [`items.${i}.productSlug`, 'This product is not in our catalogue. Choose one from the list.']),
          ),
        })
      }
      if (quote.startedAt !== undefined && now() - quote.startedAt < minFillMs) {
        return apiError(400, 'rejected', 'This request could not be accepted. Please try again.')
      }

      const ip = clientIp(request)
      if (deps.humanCheck && !(await deps.humanCheck(quote.turnstileToken, ip))) {
        return apiError(400, 'verification_failed', 'Please complete the verification check and try again.')
      }

      const allowed =
        (await store.hitRateLimit(limitKey('submit-ip', ip), WINDOW_SECONDS, LIMITS.submitPerIp)) &&
        (auth.kind !== 'user' || (await store.hitRateLimit(limitKey('submit-user', auth.userId), WINDOW_SECONDS, LIMITS.submitPerUser)))
      if (!allowed) return rateLimited()

      // Ownership is set ONLY from the verified session; guests get a one-time secret token.
      const guestToken = auth.kind === 'user' ? undefined : newGuestToken()
      const inserted = await store.insert({
        clerkUserId: auth.kind === 'user' ? auth.userId : null,
        guestTokenHash: guestToken ? hmac(deps.hashSecret, `guest:${guestToken}`) : null,
        fullName: quote.fullName,
        email: quote.email,
        phone: quote.phone,
        company: nullable(quote.company),
        items: quote.items.map((item) => ({
          productSlug: item.productSlug,
          quantity: nullable(item.quantity),
          quantityUnit: nullable(item.quantityUnit),
        })),
        projectType: nullable(quote.projectType),
        city: quote.city,
        deliveryLocation: nullable(quote.deliveryLocation),
        description: quote.description,
        consentAt: new Date(now()).toISOString(),
      })

      const response: SubmitQuoteResponse = { reference: inserted.reference, status: inserted.status, createdAt: inserted.createdAt }
      if (guestToken) response.guestToken = guestToken
      return json(response, 201)
    } catch (error) {
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return serverError('submit', error)
    }
  }

  async function myQuotes(request: Request): Promise<Response> {
    if (!originAllowed(request)) return apiError(403, 'forbidden_origin', 'Requests from this origin are not allowed.')
    const auth = await deps.verifyAuth(bearerToken(request), requestOrigin(request))
    if (auth.kind === 'guest') return apiError(401, 'sign_in_required', 'Sign in to view your quote requests.')
    if (auth.kind === 'invalid') return sessionInvalid(auth.reason)
    if (!deps.store) return notConfigured()

    try {
      if (!(await deps.store.hitRateLimit(limitKey('list-user', auth.userId), WINDOW_SECONDS, LIMITS.listPerUser))) return rateLimited()
      const quotes: QuoteSummary[] = await deps.store.listByUser(auth.userId, 50)
      return json({ quotes })
    } catch (error) {
      return serverError('list', error)
    }
  }

  async function guestStatus(request: Request): Promise<Response> {
    if (!originAllowed(request)) return apiError(403, 'forbidden_origin', 'Requests from this origin are not allowed.')
    if (!deps.store) return notConfigured()

    try {
      const body = await readJson(request, 1024)
      if (!(await deps.store.hitRateLimit(limitKey('guest-ip', clientIp(request)), WINDOW_SECONDS, LIMITS.guestLookupPerIp))) {
        return rateLimited()
      }
      const parsed = guestStatusSchema.safeParse(body)
      // Same response for malformed and unknown: lookups reveal nothing about other requests.
      const notFound = () => apiError(404, 'not_found', 'No request matches that reference and tracking code.')
      if (!parsed.success) return notFound()
      const quote = await deps.store.findGuestQuote(parsed.data.reference, hmac(deps.hashSecret, `guest:${parsed.data.token}`))
      return quote ? json({ quote }) : notFound()
    } catch (error) {
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return serverError('guest status', error)
    }
  }

  /** Verified signed-in user or an error response. */
  async function requireUser(request: Request): Promise<{ userId: string } | Response> {
    if (!originAllowed(request)) return apiError(403, 'forbidden_origin', 'Requests from this origin are not allowed.')
    const auth = await deps.verifyAuth(bearerToken(request), requestOrigin(request))
    if (auth.kind === 'guest') return apiError(401, 'sign_in_required', 'Please sign in to continue.')
    if (auth.kind === 'invalid') return sessionInvalid(auth.reason)
    return { userId: auth.userId }
  }

  async function myQuoteDetail(request: Request): Promise<Response> {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    if (!deps.store) return notConfigured()
    const reference = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '').toUpperCase()
    const notFound = () => apiError(404, 'not_found', 'We couldn’t find that quote request in your account.')
    if (!quoteReferencePattern.test(reference)) return notFound()
    try {
      if (!(await deps.store.hitRateLimit(limitKey('list-user', user.userId), WINDOW_SECONDS, LIMITS.listPerUser))) return rateLimited()
      const quote = await deps.store.findUserQuote(user.userId, reference)
      return quote ? json({ quote }) : notFound()
    } catch (error) {
      return serverError('detail', error)
    }
  }

  async function wishlist(request: Request): Promise<Response> {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    if (!deps.store) return notConfigured()
    try {
      if (!(await deps.store.hitRateLimit(limitKey('wishlist-user', user.userId), WINDOW_SECONDS, LIMITS.wishlistPerUser))) return rateLimited()
      if (request.method === 'GET') return json({ slugs: await deps.store.getWishlist(user.userId) })

      const parsed = wishlistSchema.safeParse(await readJson(request, 8 * 1024))
      if (!parsed.success) return apiError(422, 'validation_failed', 'The wishlist could not be saved.')
      // Unknown products are dropped rather than stored.
      const known = await deps.knownProducts()
      const slugs = [...new Set(parsed.data.slugs)].filter((slug) => known.has(slug))
      return json({ slugs: await deps.store.replaceWishlist(user.userId, slugs) })
    } catch (error) {
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return serverError('wishlist', error)
    }
  }

  async function contact(request: Request): Promise<Response> {
    if (!originAllowed(request)) return apiError(403, 'forbidden_origin', 'Requests from this origin are not allowed.')
    if (!deps.store) return notConfigured()
    try {
      const body = await readJson(request, 12 * 1024)
      const auth = await deps.verifyAuth(bearerToken(request), requestOrigin(request))
      if (auth.kind === 'invalid') return sessionInvalid(auth.reason)
      const parsed = contactSchema.safeParse(body)
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
          if (issue.path[0] === 'website') return apiError(400, 'rejected', 'This message could not be accepted.')
          fieldErrors[issue.path.join('.') || 'form'] ??= issue.message
        }
        return apiError(422, 'validation_failed', 'Please correct the highlighted fields.', { fieldErrors })
      }
      const msg = parsed.data
      if (msg.startedAt !== undefined && now() - msg.startedAt < minFillMs) return apiError(400, 'rejected', 'This message could not be accepted. Please try again.')
      const ip = clientIp(request)
      if (deps.humanCheck && !(await deps.humanCheck(msg.turnstileToken, ip))) {
        return apiError(400, 'verification_failed', 'Please complete the verification check and try again.')
      }
      if (!(await deps.store.hitRateLimit(limitKey('contact-ip', ip), WINDOW_SECONDS, LIMITS.contactPerIp))) return rateLimited()
      await deps.store.insertContactMessage({
        clerkUserId: auth.kind === 'user' ? auth.userId : null,
        fullName: msg.fullName,
        email: msg.email,
        phone: nullable(msg.phone),
        topic: msg.topic,
        message: msg.message,
        consentAt: new Date(now()).toISOString(),
      })
      return json({ ok: true }, 201)
    } catch (error) {
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return serverError('contact', error)
    }
  }

  /** Public catalogue: published products only, cacheable at the edge. */
  async function catalog(request: Request): Promise<Response> {
    if (!deps.store) return notConfigured()
    try {
      if (!(await deps.store.hitRateLimit(limitKey('catalog-ip', clientIp(request)), WINDOW_SECONDS, LIMITS.catalogPerIp))) return rateLimited()
      const products = (await deps.store.listProducts({ includeUnpublished: false })).map(({ published: _p, archived: _a, sortOrder: _s, updatedAt: _u, price, ...product }) => ({
        ...product,
        // Prices are public only once the product is verified.
        ...(product.verified && price ? { price } : {}),
      }))
      return json({ products }, 200, { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' })
    } catch (error) {
      return serverError('catalog', error)
    }
  }

  /**
   * POST /api/track/view — counts a product detail view. Always answers 204 for well-formed requests so
   * callers cannot probe dedup or bot rules; bots, duplicates and unknown products are silently ignored.
   */
  async function trackView(request: Request): Promise<Response> {
    if (!originAllowed(request)) return apiError(403, 'forbidden_origin', 'Requests from this origin are not allowed.')
    if (!deps.store) return notConfigured()
    try {
      const body = (await readJson(request, 512)) as { slug?: unknown }
      const slug = typeof body?.slug === 'string' ? body.slug : ''
      if (!/^[a-z0-9-]{1,80}$/.test(slug)) return apiError(422, 'validation_failed', 'Unknown product.')
      if (isLikelyBot(request)) return accepted()
      const ip = clientIp(request)
      if (!(await deps.store.hitRateLimit(limitKey('view-ip', ip), WINDOW_SECONDS, LIMITS.viewsPerIp))) return accepted()
      if (!(await deps.knownProducts()).has(slug)) return accepted()
      // Pseudonymous visitor: keyed hash of network + browser signature, never stored raw.
      const visitor = hmac(deps.hashSecret, `view:${ip}|${request.headers.get('user-agent')}|${request.headers.get('accept-language') ?? ''}`)
      await deps.store.recordProductView(slug, visitor)
      return accepted()
    } catch (error) {
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return serverError('track view', error)
    }
  }

  /** GET /api/resources — published documents plus coverage data for verified, published products. */
  async function resources(request: Request): Promise<Response> {
    if (!deps.store) return notConfigured()
    try {
      if (!(await deps.store.hitRateLimit(limitKey('resources-ip', clientIp(request)), WINDOW_SECONDS, LIMITS.resourcesPerIp))) return rateLimited()
      const [docs, coverage, products] = await Promise.all([deps.store.listResources({ includeUnpublished: false }), deps.store.listCoverage(), deps.store.listProducts({ includeUnpublished: false })])
      const visible = new Set(products.map((p) => p.slug))
      const verified = new Set(products.filter((p) => p.verified).map((p) => p.slug))
      const published = new Set(docs.map((d) => d.id))
      const body: ResourceCatalog = {
        resources: docs.map(({ published: _p, storagePath: _s, productSlugs, ...d }) => ({ ...d, productSlugs: productSlugs.filter((s) => visible.has(s)) })),
        coverage: coverage
          .filter((c) => verified.has(c.productSlug))
          .map((c) => ({ ...c, sourceResourceId: c.sourceResourceId && published.has(c.sourceResourceId) ? c.sourceResourceId : null })),
      }
      return json(body, 200, { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' })
    } catch (error) {
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return serverError('resources', error)
    }
  }

  /** GET /api/resources/download?id= — published documents only, via a 60-second signed URL. */
  async function resourceDownload(request: Request): Promise<Response> {
    if (!deps.store || !deps.files) return notConfigured()
    const id = new URL(request.url).searchParams.get('id') ?? ''
    const notFound = () => apiError(404, 'not_found', 'This document is not available.')
    if (!/^[0-9a-f-]{36}$/.test(id)) return notFound()
    try {
      if (!(await deps.store.hitRateLimit(limitKey('download-ip', clientIp(request)), WINDOW_SECONDS, LIMITS.downloadsPerIp))) return rateLimited()
      const doc = await deps.store.getResource(id)
      if (!doc?.published) return notFound()
      const local = deps.files.read?.(doc.storagePath)
      if (local) {
        return new Response(local.body, {
          headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${doc.fileName.replace(/[^\w.-]+/g, '_')}"`, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
        })
      }
      return new Response(null, { status: 302, headers: { location: await deps.files.downloadUrl(doc.storagePath, doc.fileName), 'cache-control': 'no-store' } })
    } catch (error) {
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return serverError('download', error)
    }
  }

  const admin = createAdminHandler({
    store: deps.store,
    generateProduct: deps.generateProduct,
    allowGeneration: async (id) => (await deps.store!.hitRateLimit(limitKey('ai-user', id), 600, 5)) && (await deps.store!.hitRateLimit(limitKey('ai-global', 'products'), 86400, 100)),
    requireUser,
    allow: (userId) => deps.store!.hitRateLimit(limitKey('admin-user', userId), WINDOW_SECONDS, LIMITS.adminPerUser),
    onCatalogChange: deps.onCatalogChange,
    notConfigured,
    rateLimited,
    serverError,
    now,
    directory: deps.directory,
    files: deps.files,
    siteOrigin: (request) => deps.allowedOrigins[0] ?? new URL(request.url).origin,
    allowInvite: (userId) => deps.store!.hitRateLimit(limitKey('invite-admin', userId), WINDOW_SECONDS, LIMITS.invitesPerAdmin),
  })

  async function content(): Promise<Response> {
    if (!deps.store) return json({pages: {}})
    try { return json({pages: await deps.store.workspace.published()}) }
    catch (error) { return serverError('published content', error) }
  }

  return { submit, myQuotes, myQuoteDetail, guestStatus, wishlist, contact, catalog, trackView, resources, resourceDownload, admin, content }
}
