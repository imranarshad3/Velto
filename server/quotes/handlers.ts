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
import type { AuthVerifier } from './auth.js'
import { hmac, newGuestToken } from './crypto.js'
import type { DataStore } from './store.js'
import type { HumanCheck } from './turnstile.js'
import { createAdminHandler } from '../admin/handlers.js'

export interface ApiHandlerDeps {
  /** Null when the database is not configured: endpoints answer 503 instead of pretending to work. */
  store: DataStore | null
  verifyAuth: AuthVerifier
  hashSecret: string
  /** Slugs customers may reference (published catalogue). */
  knownProducts: () => Promise<Set<string>>
  /** Called after admin catalogue changes (cache invalidation). */
  onCatalogChange?: () => void
  humanCheck?: HumanCheck
  /** Exact origins allowed to call the API from a browser. Empty = same-origin deployments only rely on CORS defaults. */
  allowedOrigins: string[]
  now?: () => number
  /** Minimum ms between opening the form and submitting (bot timing signal). */
  minFillMs?: number
}

const MAX_BODY_BYTES = 16 * 1024
const WINDOW_SECONDS = 600
export const LIMITS = { submitPerIp: 8, submitPerUser: 8, listPerUser: 300, guestLookupPerIp: 10, wishlistPerUser: 300, contactPerIp: 5, adminPerUser: 600, catalogPerIp: 600 }

const notConfigured = () => apiError(503, 'not_configured', 'The quote service is not available yet. Please try again later.')
const rateLimited = () =>
  apiError(429, 'rate_limited', 'Too many requests. Please wait a few minutes and try again.', {}, { 'retry-after': String(WINDOW_SECONDS) })
const sessionInvalid = () =>
  apiError(401, 'session_invalid', 'Your sign-in session has expired. Sign in again, or sign out to continue as a guest.')

function serverError(scope: string, error: unknown) {
  // Log a code only: never the payload, contact details or tokens.
  console.error(`[quotes] ${scope}:`, error instanceof Error ? error.message : 'unknown error')
  return apiError(500, 'server_error', 'Something went wrong on our side. Your request was not saved; please try again.')
}

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
      const auth = await deps.verifyAuth(bearerToken(request))
      if (auth.kind === 'invalid') return sessionInvalid()

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
    const auth = await deps.verifyAuth(bearerToken(request))
    if (auth.kind === 'guest') return apiError(401, 'sign_in_required', 'Sign in to view your quote requests.')
    if (auth.kind === 'invalid') return sessionInvalid()
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
    const auth = await deps.verifyAuth(bearerToken(request))
    if (auth.kind === 'guest') return apiError(401, 'sign_in_required', 'Please sign in to continue.')
    if (auth.kind === 'invalid') return sessionInvalid()
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
      const auth = await deps.verifyAuth(bearerToken(request))
      if (auth.kind === 'invalid') return sessionInvalid()
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
      const products = (await deps.store.listProducts({ includeUnpublished: false })).map(({ published: _p, sortOrder: _s, updatedAt: _u, price, ...product }) => ({
        ...product,
        // Prices are public only once the product is verified.
        ...(product.verified && price ? { price } : {}),
      }))
      return json({ products }, 200, { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' })
    } catch (error) {
      return serverError('catalog', error)
    }
  }

  const admin = createAdminHandler({
    store: deps.store,
    requireUser,
    allow: (userId) => deps.store!.hitRateLimit(limitKey('admin-user', userId), WINDOW_SECONDS, LIMITS.adminPerUser),
    onCatalogChange: deps.onCatalogChange,
    notConfigured,
    rateLimited,
    serverError,
  })

  return { submit, myQuotes, myQuoteDetail, guestStatus, wishlist, contact, catalog, admin }
}
