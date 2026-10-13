import type { ProductInput } from '../catalog/productSchema.ts'
import { call } from '../quotes/api.ts'
import type { QuoteStatus } from '../quotes/schema.ts'
import type { AdminCustomer, AdminMessage, AdminOverview, AdminProduct, AdminQuoteDetail, AdminQuoteRow, MessageStatus } from './types.ts'

/** Admin API client. Every call is authorised on the server; hiding UI is not a security boundary. */
const admin = <T>(path: string, token: string, init: RequestInit = { method: 'GET' }) => call<T>(`/api/admin/${path}`, init, token)

export const adminApi = {
  me: (t: string) => admin<{ isAdmin: boolean }>('me', t),
  overview: (t: string) => admin<AdminOverview>('overview', t),
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
  customers: (t: string) => admin<{ customers: AdminCustomer[] }>('customers', t),
  messages: (t: string, status?: MessageStatus) => admin<{ messages: AdminMessage[] }>(`messages${status ? `?status=${status}` : ''}`, t),
  updateMessage: (t: string, id: string, status: MessageStatus) => admin<{ ok: true }>(`messages/${id}`, t, { method: 'PATCH', body: JSON.stringify({ status }) }),
}
