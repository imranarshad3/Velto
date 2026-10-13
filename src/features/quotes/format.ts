import type { QuoteItemSummary } from './schema.ts'

export const formatItemQuantity = (item: Pick<QuoteItemSummary, 'quantity' | 'quantityUnit'>) =>
  item.quantity !== null && item.quantity !== undefined ? `${item.quantity} ${item.quantityUnit ?? ''}`.trim() : null

export const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
export const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
