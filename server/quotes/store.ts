import type { AdminCustomer, AdminMessage, AdminOverview, AdminProduct, AdminQuoteDetail, AdminQuoteRow, MessageStatus } from '../../src/features/admin/types.js'
import type { ProductData } from '../../src/features/catalog/productSchema.js'
import type { QuoteDetail, QuoteItemSummary, QuoteStatus, QuoteSummary } from '../../src/features/quotes/schema.js'

export interface NewQuote {
  clerkUserId: string | null
  guestTokenHash: string | null
  fullName: string
  email: string
  phone: string
  company: string | null
  items: QuoteItemSummary[]
  projectType: string | null
  city: string
  deliveryLocation: string | null
  description: string
  consentAt: string
}

export interface InsertedQuote {
  reference: string
  status: QuoteStatus
  createdAt: string
}

export interface NewContactMessage {
  clerkUserId: string | null
  fullName: string
  email: string
  phone: string | null
  topic: string
  message: string
  consentAt: string
}

/** Persistence boundary. Implementations run only on the server. */
export interface DataStore {
  insert(quote: NewQuote): Promise<InsertedQuote>
  listByUser(clerkUserId: string, limit: number): Promise<QuoteSummary[]>
  findGuestQuote(reference: string, guestTokenHash: string): Promise<QuoteSummary | null>
  /** Owner-scoped: returns null for other users' references. */
  findUserQuote(clerkUserId: string, reference: string): Promise<QuoteDetail | null>
  insertContactMessage(message: NewContactMessage): Promise<void>
  getWishlist(clerkUserId: string): Promise<string[]>
  replaceWishlist(clerkUserId: string, slugs: string[]): Promise<string[]>
  // Catalogue & admin
  listProducts(options: { includeUnpublished: boolean }): Promise<AdminProduct[]>
  isAdmin(clerkUserId: string): Promise<boolean>
  saveProduct(actor: string, slug: string, data: ProductData, create: boolean): Promise<'ok' | 'not_found' | 'conflict'>
  adminListQuotes(filter: { status?: QuoteStatus; search?: string; limit: number; offset: number }): Promise<{ rows: AdminQuoteRow[]; total: number }>
  adminGetQuote(reference: string): Promise<AdminQuoteDetail | null>
  adminUpdateQuote(reference: string, actor: string, status: QuoteStatus, note: string | null, internalNotes: string | null): Promise<boolean>
  adminOverview(): Promise<AdminOverview>
  adminCustomers(): Promise<AdminCustomer[]>
  adminListMessages(status?: MessageStatus): Promise<AdminMessage[]>
  adminUpdateMessage(id: string, actor: string, status: MessageStatus): Promise<boolean>
  /** Returns true when the request is within the limit. */
  hitRateLimit(key: string, windowSeconds: number, max: number): Promise<boolean>
}
