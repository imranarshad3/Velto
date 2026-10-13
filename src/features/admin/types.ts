import type { CatalogProduct } from '../../data/catalog.ts'
import type { QuoteDetail, QuoteStatus } from '../quotes/schema.ts'

/** Admin API shapes (type-only module; safe for serverless imports). */
export interface AdminProduct extends CatalogProduct {
  published: boolean
  sortOrder: number
  updatedAt: string
}

export interface AdminQuoteRow {
  reference: string
  status: QuoteStatus
  fullName: string
  email: string
  company: string | null
  city: string
  itemCount: number
  owner: 'account' | 'guest'
  createdAt: string
}

export interface AdminQuoteDetail extends QuoteDetail {
  internalNotes: string | null
  owner: 'account' | 'guest'
  clerkUserId: string | null
}

export interface AdminCustomer {
  clerkUserId: string
  fullName: string | null
  email: string | null
  company: string | null
  quotes: number
  lastQuoteAt: string | null
  wishlist: number
}

export type MessageStatus = 'new' | 'read' | 'closed'

export interface AdminMessage {
  id: string
  fullName: string
  email: string
  phone: string | null
  topic: string
  message: string
  status: MessageStatus
  owner: 'account' | 'guest'
  createdAt: string
}

export interface AuditEntry {
  actor: string
  action: string
  entity: string
  entityKey: string
  createdAt: string
}

export interface AdminOverview {
  quotesByStatus: Partial<Record<QuoteStatus, number>>
  quotesLast7Days: number
  newMessages: number
  products: number
  productsVerified: number
  productsPublished: number
  customers: number
  recentAudit: AuditEntry[]
}
