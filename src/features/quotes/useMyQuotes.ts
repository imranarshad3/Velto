import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import { fetchMyQuote, fetchMyQuotes } from './api.ts'
import type { QuoteDetail, QuoteSummary } from './schema.ts'

export type { Remote } from '../../lib/useAuthedRemote.ts'

export const useMyQuotes = () => useAuthedRemote<QuoteSummary[]>(async (token) => (await fetchMyQuotes(token)).quotes, 'list')

export const useMyQuote = (reference: string) =>
  useAuthedRemote<QuoteDetail>(async (token) => (await fetchMyQuote(reference, token)).quote, reference)
