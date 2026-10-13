import { messageStatusSchema, productInputSchema, quoteStatusUpdateSchema } from '../../src/features/catalog/productSchema.js'
import { quoteReferencePattern, quoteStatuses, type QuoteStatus } from '../../src/features/quotes/schema.js'
import { apiError, HttpError, json, readJson } from '../http.js'
import type { DataStore } from '../quotes/store.js'

interface AdminContext {
  store: DataStore | null
  requireUser: (request: Request) => Promise<{ userId: string } | Response>
  allow: (userId: string) => Promise<boolean>
  onCatalogChange?: () => void
  notConfigured: () => Response
  rateLimited: () => Response
  serverError: (scope: string, error: unknown) => Response
}

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
    const [resource, id] = adminPath(request)
    const method = request.method

    try {
      if (!(await ctx.allow(user.userId))) return ctx.rateLimited()
      const isAdmin = await store.isAdmin(user.userId)
      if (resource === 'me' && method === 'GET') return json({ isAdmin })
      if (!isAdmin) return apiError(403, 'forbidden', 'You don’t have access to this area.')
      const actor = user.userId

      if (resource === 'overview' && method === 'GET') return json(await store.adminOverview())

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
      if (error instanceof HttpError) return apiError(error.status, error.code, error.message)
      return ctx.serverError('admin', error)
    }
  }
}
