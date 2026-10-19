import type { ProductInput } from '../catalog/productSchema.ts'
import type { AdminCategory, CategoryInput } from '../catalog/categorySchema.ts'
import type { CoverageInput, ResourceInput } from '../resources/schema.ts'
import type { ProductCoverage, TechnicalResource } from '../resources/types.ts'
import { call, QuoteApiError } from '../quotes/api.ts'
import type { QuoteStatus } from '../quotes/schema.ts'
import type { AdminCustomer, AdminMessage, AdminOverview, AdminProduct, AdminQuoteDetail, AdminQuoteRow, AdminTeam, AnalyticsRange, MessageStatus, ProductAnalytics, ProductStatus } from './types.ts'

/** Admin API client. Every call is authorised on the server; hiding UI is not a security boundary. */
const admin = <T>(path: string, token: string, init: RequestInit = { method: 'GET' }) => call<T>(`/api/admin/${path}`, init, token)

export const adminApi = {
  me: (t: string) => admin<{ isAdmin: boolean }>('me', t),
  overview: (t: string) => admin<AdminOverview>('overview', t),
  analytics: (t: string, range: AnalyticsRange) => admin<ProductAnalytics>(`analytics?range=${range}`, t),
  quotes: (t: string, params: { status?: string; q?: string; page?: number }) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    return admin<{ rows: AdminQuoteRow[]; total: number; page: number; pageSize: number }>(`quotes?${query}`, t)
  },
  quote: (t: string, ref: string) => admin<{ quote: AdminQuoteDetail }>(`quotes/${encodeURIComponent(ref)}`, t),
  updateQuote: (t: string, ref: string, body: { status: QuoteStatus; note?: string; internalNotes?: string }) =>
    admin<{ quote: AdminQuoteDetail }>(`quotes/${encodeURIComponent(ref)}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  products: (t: string) => admin<{ products: AdminProduct[] }>('products', t),
  createProduct: (t: string, body: ProductInput) => admin<{ product: AdminProduct }>('products', t, { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (t: string, slug: string, body: ProductInput) =>
    admin<{ product: AdminProduct }>(`products/${encodeURIComponent(slug)}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  setProductStatus: (t: string, slug: string, status: ProductStatus) =>
    admin<{ product: AdminProduct }>(`product-status/${encodeURIComponent(slug)}`, t, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteProduct: (t: string, slug: string) => admin<{ ok: true }>(`products/${encodeURIComponent(slug)}`, t, { method: 'DELETE' }),
  categories: (t: string) => admin<{ categories: AdminCategory[] }>('categories', t),
  saveCategory: (t: string, slug: string | null, body: CategoryInput) =>
    admin<{ category: AdminCategory }>(slug ? `categories/${encodeURIComponent(slug)}` : 'categories', t, { method: slug ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
  reorderCategories: (t: string, slugs: string[]) => admin<{ categories: AdminCategory[] }>('categories/order', t, { method: 'PUT', body: JSON.stringify({ slugs }) }),
  deleteCategory: (t: string, slug: string, moveTo?: string) =>
    admin<{ ok: true }>(`categories/${encodeURIComponent(slug)}${moveTo ? `?moveTo=${encodeURIComponent(moveTo)}` : ''}`, t, { method: 'DELETE' }),
  team: (t: string) => admin<AdminTeam>('team', t),
  inviteAdmin: (t: string, email: string) =>
    admin<{ id: string; email: string; delivery: 'sent' | 'existing_user' | 'not_sent'; link: string }>('team/invites', t, { method: 'POST', body: JSON.stringify({ email }) }),
  revokeInvite: (t: string, id: string) => admin<{ ok: true }>(`team/invites/${encodeURIComponent(id)}`, t, { method: 'DELETE' }),
  removeAdmin: (t: string, userId: string) => admin<{ ok: true }>(`team/members/${encodeURIComponent(userId)}`, t, { method: 'DELETE' }),
  resources: (t: string) => admin<{ resources: TechnicalResource[] }>('resources', t),
  saveResource: (t: string, id: string | null, body: ResourceInput) =>
    admin<{ resource: TechnicalResource }>(id ? `resources/${id}` : 'resources', t, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
  deleteResource: (t: string, id: string) => admin<{ ok: true }>(`resources/${id}`, t, { method: 'DELETE' }),
  /** Uploads a PDF via a one-time URL issued by the server; returns the storage path to save with the resource. */
  uploadResourceFile: async (t: string, file: File) => {
    const ticket = await admin<{ storagePath: string; url: string; headers: Record<string, string> }>('resources/uploads', t, {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, size: file.size, contentType: file.type || 'application/pdf' }),
    })
    // Same-origin sink (local dev) needs the session; external signed URLs must never receive it.
    const headers = { ...ticket.headers, ...(ticket.url.startsWith('/') ? { authorization: `Bearer ${t}` } : {}) }
    const res = await fetch(ticket.url, { method: 'PUT', headers, body: file }).catch(() => null)
    if (!res?.ok) throw new QuoteApiError(res?.status ?? 0, 'upload_failed', 'The file could not be uploaded. Check your connection and try again.')
    return ticket.storagePath
  },
  coverage: (t: string) => admin<{ coverage: ProductCoverage[] }>('coverage', t),
  saveCoverage: (t: string, slug: string, body: CoverageInput) => admin<{ coverage: ProductCoverage }>(`coverage/${encodeURIComponent(slug)}`, t, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoverage: (t: string, slug: string) => admin<{ ok: true }>(`coverage/${encodeURIComponent(slug)}`, t, { method: 'DELETE' }),
  customers: (t: string) => admin<{ customers: AdminCustomer[] }>('customers', t),
  messages: (t: string, status?: MessageStatus) => admin<{ messages: AdminMessage[] }>(`messages${status ? `?status=${status}` : ''}`, t),
  updateMessage: (t: string, id: string, status: MessageStatus) => admin<{ ok: true }>(`messages/${id}`, t, { method: 'PATCH', body: JSON.stringify({ status }) }),
}
