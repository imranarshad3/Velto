import type { ContactInput } from '../contact/schema.ts'
import type { ApiError, QuoteDetail, QuoteRequestInput, QuoteSummary, SubmitQuoteResponse } from './schema.ts'

export class QuoteApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors?: Record<string, string>
  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export async function call<T>(path: string, init: RequestInit, token?: string | null): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    })
  } catch {
    throw new QuoteApiError(0, 'network', 'We couldn’t reach the quote service. Check your connection and try again.')
  }
  const data = (await response.json().catch(() => null)) as (T & Partial<ApiError>) | null
  if (!response.ok || !data) {
    throw new QuoteApiError(
      response.status,
      data?.error ?? 'unavailable',
      data?.message ?? 'The quote service is unavailable right now. Please try again later.',
      data?.fieldErrors,
    )
  }
  return data
}

export const submitQuote = (payload: QuoteRequestInput, token?: string | null) =>
  call<SubmitQuoteResponse>('/api/quotes', { method: 'POST', body: JSON.stringify(payload) }, token)

export const fetchMyQuotes = (token: string) => call<{ quotes: QuoteSummary[] }>('/api/my/quotes', { method: 'GET' }, token)

export const lookupGuestQuote = (reference: string, token: string) =>
  call<{ quote: QuoteSummary }>('/api/quotes/status', { method: 'POST', body: JSON.stringify({ reference, token }) })

export const fetchMyQuote = (reference: string, token: string) =>
  call<{ quote: QuoteDetail }>(`/api/my/quotes/${encodeURIComponent(reference)}`, { method: 'GET' }, token)

export const fetchWishlist = (token: string) => call<{ slugs: string[] }>('/api/my/wishlist', { method: 'GET' }, token)

export const saveWishlist = (slugs: string[], token: string) =>
  call<{ slugs: string[] }>('/api/my/wishlist', { method: 'PUT', body: JSON.stringify({ slugs }) }, token)

export const sendContactMessage = (payload: ContactInput, token?: string | null) =>
  call<{ ok: true }>('/api/contact', { method: 'POST', body: JSON.stringify(payload) }, token)
