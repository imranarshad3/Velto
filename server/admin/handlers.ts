import { aiProductRequest } from '../../src/features/catalog/aiProduct.js'
import type { GenerateProduct } from './aiProduct.js'
import { canAccess, workspaceHandler } from '../workspace/handlers.js'
import { messageStatusSchema, productInputSchema, quoteStatusUpdateSchema } from '../../src/features/catalog/productSchema.js'
import { analyticsRanges, productStatuses, type AnalyticsRange, type ProductStatus } from '../../src/features/admin/types.js'
import { quoteReferencePattern, quoteStatuses, type QuoteStatus } from '../../src/features/quotes/schema.js'
import { apiError, HttpError, json, readJson } from '../http.js'
import type { UserDirectory } from '../quotes/directory.js'
import { resourcePath, type FileStorage } from '../quotes/fileStorage.js'
import { coverageInputSchema, resourceInputSchema, uploadRequestSchema } from '../../src/features/resources/schema.js'
import { MAX_RESOURCE_BYTES } from '../../src/features/resources/types.js'
import type { DataStore } from '../quotes/store.js'
import { z } from 'zod'
import { activitySince, buildProductAnalytics } from './analytics.js'

interface AdminContext {
  generateProduct?: GenerateProduct
  allowGeneration?: (userId: string) => Promise<boolean>
  store: DataStore | null
  requireUser: (request: Request) => Promise<{ userId: string } | Response>
  allow: (userId: string) => Promise<boolean>
  onCatalogChange?: () => void
  notConfigured: () => Response
  rateLimited: () => Response
  serverError: (scope: string, error: unknown) => Response
  now?: () => number
  /** Clerk user lookups (verified emails, invitation emails); null when Clerk is not configured. */
  directory?: UserDirectory | null
  files?: FileStorage | null
  /** Public site origin for links in invitation emails. */
  siteOrigin: (request: Request) => string
  /** Stricter limit for sending invitations (each may send an email). */
  allowInvite: (userId: string) => Promise<boolean>
}

const inviteSchema = z.object({ email: z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address')) })
const clerkUserIdPattern = /^[A-Za-z0-9_]{1,64}$/

const PAGE_SIZE = 25
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** `/api/admin/<path>` directly, or `/api/admin?path=<path>` after the Vercel rewrite. */
export function adminPath(request: Request): string[] {
  const url = new URL(request.url)
  const raw = url.searchParams.get('path') ?? url.pathname.replace(/^\/api\/admin\/?/, '')
  return raw.split('/').filter(Boolean).map((s) => decodeURIComponent(s))
}

function validationError(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) fieldErrors[issue.path.map(String).join('.') || 'form'] ??= issue.message
  return apiError(422, 'validation_failed', 'Please correct the highlighted fields.', { fieldErrors })
}

/**
 * Single admin entry point. Every route requires a verified session AND membership in admin_members,
 * checked on the server for each request (no client-supplied role is trusted).
 */
export function createAdminHandler(ctx: AdminContext) {
  return async function admin(request: Request): Promise<Response> {
    const user = await ctx.requireUser(request)
    if (user instanceof Response) return user
    if (!ctx.store) return ctx.notConfigured()
    const store = ctx.store
    const [resource, id, key] = adminPath(request)
    const method = request.method

    try {
      if (!(await ctx.allow(user.userId))) return ctx.rateLimited()
      let isAdmin = await store.isAdmin(user.userId)
      // Invitation acceptance: only Clerk-verified addresses (looked up server-side) can match an invite.
      // Best effort: an invitation problem must never break the admin check for everyone else.
      if (!isAdmin && resource === 'me' && ctx.directory) {
        try {
          if (await store.hasOpenAdminInvites()) {
            const emails = await ctx.directory.verifiedEmails(user.userId).catch(() => [])
            isAdmin = await store.acceptAdminInvite(user.userId, emails)
          }
        } catch (error) {
          console.error('[admin] invitation check skipped:', error instanceof Error ? error.message : 'unknown error')
        }
      }
      if (resource === 'me' && method === 'GET') return json({ isAdmin })
      if (!isAdmin) return apiError(403, 'forbidden', 'You don’t have access to this area.')
      const actor = user.userId
      const role = await store.workspace.role(actor)
      if (!role || !canAccess(role, resource)) return apiError(403, 'forbidden', 'Your team role does not permit this action.')
      const workspaceResponse = await workspaceHandler(request, store, actor, role, resource, id, key)
      if (workspaceResponse) return workspaceResponse

      if (resource === 'products' && id === 'ai-generate') {
        if (method !== 'POST' || key) return apiError(405, 'method_not_allowed', 'Use POST for image analysis.')
        if (!ctx.generateProduct) return apiError(503, 'ai_unconfigured', 'AI generation is not configured.')
        if (!ctx.allowGeneration || !(await ctx.allowGeneration(actor))) return apiError(429, 'ai_rate_limited', 'AI request limit reached. Please wait before trying again.')
        const input = aiProductRequest.parse(await readJson(request, 3_500_000))
        return json({ draft: await ctx.generateProduct(input) })
      }

      // Local-only upload sink (memory storage): the token is single-use and maps to one path.
      if (resource === 'uploads' && id && method === 'PUT' && ctx.files?.acceptUpload) {
        const type = request.headers.get('content-type') ?? ''
        const body = await request.arrayBuffer()
        if (type !== 'application/pdf' || body.byteLength > MAX_RESOURCE_BYTES) return apiError(415, 'unsupported_media_type', 'Upload a PDF up to 20 MB.')
        return ctx.files.acceptUpload(id, body, type) ? json({ ok: true }) : apiError(404, 'not_found', 'Upload link expired.')
      }

      if (resource === 'overview' && method === 'GET') return json(await store.adminOverview())

      if (resource === 'analytics' && !id && method === 'GET') {
        const param = new URL(request.url).searchParams.get('range')
        const range: AnalyticsRange = analyticsRanges.includes(param as AnalyticsRange) ? (param as AnalyticsRange) : '30d'
        const now = ctx.now?.() ?? Date.now()
        const [products, activity] = await Promise.all([store.listProducts({ includeUnpublished: true }), store.productActivity(activitySince(range, now))])
        return json(buildProductAnalytics(range, products, activity, now))
      }

      if (resource === 'quotes') {
        if (!id && method === 'GET') {
          const params = new URL(request.url).searchParams
          const status = params.get('status')
          const page = Math.max(1, Math.min(1000, Number.parseInt(params.get('page') ?? '1', 10) || 1))
          const result = await store.adminListQuotes({
            status: quoteStatuses.includes(status as QuoteStatus) ? (status as QuoteStatus) : undefined,
            search: params.get('q')?.slice(0, 80) || undefined,
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
          })
          return json({ ...result, page, pageSize: PAGE_SIZE })
        }
        const reference = id?.toUpperCase() ?? ''
        if (!quoteReferencePattern.test(reference)) return apiError(404, 'not_found', 'Quote not found.')
        if (method === 'GET') {
          const quote = await store.adminGetQuote(reference)
          return quote ? json({ quote }) : apiError(404, 'not_found', 'Quote not found.')
        }
        if (method === 'PATCH') {
          const parsed = quoteStatusUpdateSchema.safeParse(await readJson(request, 16 * 1024))
          if (!parsed.success) return validationError(parsed.error.issues)
          const { status, note, internalNotes } = parsed.data
          const ok = await store.adminUpdateQuote(reference, actor, status, note ?? null, internalNotes ?? null)
          return ok ? json({ quote: await store.adminGetQuote(reference) }) : apiError(404, 'not_found', 'Quote not found.')
        }
      }

      if (resource === 'products') {
        if (!id && method === 'GET') return json({ products: await store.listProducts({ includeUnpublished: true }) })
        if ((!id && method === 'POST') || (id && method === 'PATCH')) {
          const parsed = productInputSchema.safeParse(await readJson(request, 64 * 1024))
          if (!parsed.success) return validationError(parsed.error.issues)
          const create = !id
          const slug = create ? parsed.data.slug : id
          if (!/^[a-z0-9-]{1,80}$/.test(slug)) return apiError(404, 'not_found', 'Product not found.')
          const result = await store.saveProduct(actor, slug, { ...parsed.data, slug }, create)
          if (result === 'conflict') return validationError([{ path: ['slug'], message: 'A product with this slug already exists' }])
          if (result === 'not_found') return apiError(404, 'not_found', 'Product not found.')
          ctx.onCatalogChange?.()
          const product = (await store.listProducts({ includeUnpublished: true })).find((p) => p.slug === slug)
          return json({ product }, create ? 201 : 200)
        }
      }

      if (resource === 'product-status' && id && method === 'PATCH') {
        if (!/^[a-z0-9-]{1,80}$/.test(id)) return apiError(404, 'not_found', 'Product not found.')
        const body = (await readJson(request, 256)) as { status?: unknown }
        if (!productStatuses.includes(body?.status as ProductStatus)) return validationError([{ path: ['status'], message: 'Choose Published, Draft or Archived' }])
        if (!(await store.setProductStatus(actor, id, body.status as ProductStatus))) return apiError(404, 'not_found', 'Product not found.')
        ctx.onCatalogChange?.()
        const product = (await store.listProducts({ includeUnpublished: true })).find((p) => p.slug === id)
        return json({ product })
      }

      if (resource === 'products' && id && method === 'DELETE') {
        if (!/^[a-z0-9-]{1,80}$/.test(id)) return apiError(404, 'not_found', 'Product not found.')
        const result = await store.deleteProduct(actor, id)
        if (result === 'not_found') return apiError(404, 'not_found', 'Product not found.')
        if (result === 'in_use') return apiError(409, 'product_in_use', 'This product appears in quote requests, so it can’t be deleted. Archive it instead.')
        ctx.onCatalogChange?.()
        return json({ ok: true })
      }

      if (resource === 'resources') {
        const files = ctx.files
        if (!id && method === 'GET') {
          return json({ resources: (await store.listResources({ includeUnpublished: true })).map(({ storagePath: _s, ...r }) => r) })
        }
        if (!files) return ctx.notConfigured()
        if (id === 'uploads' && method === 'POST') {
          const parsed = uploadRequestSchema.safeParse(await readJson(request, 1024))
          if (!parsed.success) return validationError(parsed.error.issues)
          const storagePath = resourcePath(parsed.data.fileName)
          return json({ storagePath, ...(await files.createUpload(storagePath, parsed.data.contentType)) }, 201)
        }
        if ((!id && method === 'POST') || (id && method === 'PATCH')) {
          if (id && !uuidPattern.test(id)) return apiError(404, 'not_found', 'Resource not found.')
          const parsed = resourceInputSchema.safeParse(await readJson(request, 16 * 1024))
          if (!parsed.success) return validationError(parsed.error.issues)
          const input = parsed.data
          const existing = id ? await store.getResource(id) : null
          if (id && !existing) return apiError(404, 'not_found', 'Resource not found.')
          if (!id && !input.storagePath) return validationError([{ path: ['file'], message: 'Choose a PDF to upload' }])
          const known = new Set((await store.listProducts({ includeUnpublished: true })).map((p) => p.slug))
          const unknown = input.productSlugs.find((s) => !known.has(s))
          if (unknown) return validationError([{ path: ['productSlugs'], message: `Unknown product: ${unknown}` }])
          // A new file must exist in storage and be a PDF within the size limit; size comes from storage, not the client.
          let file = existing ? { storagePath: existing.storagePath, fileName: existing.fileName, fileSize: existing.fileSize } : null
          if (input.storagePath && input.storagePath !== existing?.storagePath) {
            const stat = await files.stat(input.storagePath)
            if (!stat || stat.contentType !== 'application/pdf' || stat.size <= 0 || stat.size > MAX_RESOURCE_BYTES) {
              return validationError([{ path: ['file'], message: 'The upload did not finish or is not a PDF up to 20 MB. Upload it again.' }])
            }
            file = { storagePath: input.storagePath, fileName: input.fileName ?? input.storagePath.split('/')[1], fileSize: stat.size }
          }
          const saved = await store.saveResource(actor, id ?? null, {
            title: input.title,
            summary: input.summary ?? null,
            kind: input.kind,
            productSlugs: [...new Set(input.productSlugs)],
            published: input.published,
            ...file!,
          })
          if (!saved) return apiError(404, 'not_found', 'Resource not found.')
          if (existing && existing.storagePath !== saved.storagePath) await files.remove(existing.storagePath).catch(() => undefined)
          const { storagePath: _s, ...body } = saved
          return json({ resource: body }, id ? 200 : 201)
        }
        if (id && method === 'DELETE') {
          if (!uuidPattern.test(id)) return apiError(404, 'not_found', 'Resource not found.')
          const removed = await store.deleteResource(actor, id)
          if (!removed) return apiError(404, 'not_found', 'Resource not found.')
          await files.remove(removed.storagePath).catch((error: unknown) => console.error('[admin] file not removed:', error instanceof Error ? error.message : 'unknown'))
          return json({ ok: true })
        }
      }

      if (resource === 'coverage') {
        if (!id && method === 'GET') return json({ coverage: await store.listCoverage() })
        if (id && !/^[a-z0-9-]{1,80}$/.test(id)) return apiError(404, 'not_found', 'Product not found.')
        if (id && method === 'PUT') {
          const parsed = coverageInputSchema.safeParse(await readJson(request, 2048))
          if (!parsed.success) return validationError(parsed.error.issues)
          if (parsed.data.sourceResourceId && !(await store.getResource(parsed.data.sourceResourceId))) return validationError([{ path: ['sourceResourceId'], message: 'Choose an existing document' }])
          if (!(await store.saveCoverage(actor, id, parsed.data))) return apiError(404, 'not_found', 'Product not found.')
          return json({ coverage: (await store.listCoverage()).find((c) => c.productSlug === id) })
        }
        if (id && method === 'DELETE') return (await store.deleteCoverage(actor, id)) ? json({ ok: true }) : apiError(404, 'not_found', 'No coverage data for this product.')
      }

      if (resource === 'team') {
        if (!id && method === 'GET') {
          const team = await store.listAdminTeam()
          const people = (await ctx.directory?.describe(team.members.map((m) => m.clerkUserId)).catch(() => null)) ?? new Map()
          return json({
            members: team.members.map((m) => ({ ...m, name: people.get(m.clerkUserId)?.name ?? null, email: people.get(m.clerkUserId)?.email ?? m.note, you: m.clerkUserId === actor })),
            invites: team.invites,
          })
        }
        if (id === 'invites' && !key && method === 'POST') {
          const parsed = inviteSchema.safeParse(await readJson(request, 1024))
          if (!parsed.success) return validationError(parsed.error.issues)
          const { email } = parsed.data
          const team = await store.listAdminTeam()
          const people = (await ctx.directory?.describe(team.members.map((m) => m.clerkUserId)).catch(() => null)) ?? new Map()
          const known = new Set(team.members.flatMap((m) => [m.note, people.get(m.clerkUserId)?.email].filter(Boolean).map((e) => String(e).toLowerCase())))
          if (known.has(email)) return apiError(409, 'already_admin', 'This person is already an admin.')
          if (!(await ctx.allowInvite(actor))) return ctx.rateLimited()
          const inviteId = await store.createAdminInvite(actor, email)
          const origin = ctx.siteOrigin(request)
          const delivery = ctx.directory ? await ctx.directory.sendInvite(email, `${origin}/sign-up?redirect_url=${encodeURIComponent('/admin')}`) : 'not_sent'
          return json({ id: inviteId, email, delivery, link: `${origin}/admin` }, 201)
        }
        if (id === 'invites' && key && method === 'DELETE') {
          if (!uuidPattern.test(key)) return apiError(404, 'not_found', 'Invitation not found.')
          return (await store.revokeAdminInvite(actor, key)) ? json({ ok: true }) : apiError(404, 'not_found', 'Invitation not found.')
        }
        if (id === 'members' && key && method === 'DELETE') {
          if (!clerkUserIdPattern.test(key)) return apiError(404, 'not_found', 'Admin not found.')
          const result = await store.removeAdmin(actor, key)
          if (result === 'self') return apiError(409, 'cannot_remove_self', 'You can’t remove your own admin access.')
          if (result === 'last_admin') return apiError(409, 'last_admin', 'At least one admin must remain.')
          return result === 'ok' ? json({ ok: true }) : apiError(404, 'not_found', 'Admin not found.')
        }
      }

      if (resource === 'customers' && !id && method === 'GET') return json({ customers: await store.adminCustomers() })

      if (resource === 'messages') {
        if (!id && method === 'GET') {
          const status = messageStatusSchema.shape.status.safeParse(new URL(request.url).searchParams.get('status'))
          return json({ messages: await store.adminListMessages(status.success ? status.data : undefined) })
        }
        if (id && method === 'PATCH') {
          if (!uuidPattern.test(id)) return apiError(404, 'not_found', 'Message not found.')
          const parsed = messageStatusSchema.safeParse(await readJson(request, 1024))
          if (!parsed.success) return validationError(parsed.error.issues)
          const ok = await store.adminUpdateMessage(id, actor, parsed.data.status)
          return ok ? json({ ok: true }) : apiError(404, 'not_found', 'Message not found.')
        }
      }

      return apiError(404, 'not_found', 'Unknown admin endpoint.')
    } catch (error) {
      if (error instanceof z.ZodError) return validationError(error.issues)
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return ctx.serverError('admin', error)
    }
  }
}
