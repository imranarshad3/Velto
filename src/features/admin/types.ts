import type { CatalogProduct } from '../../data/catalog.ts'
import type { QuoteDetail, QuoteStatus } from '../quotes/schema.ts'

/** Admin API shapes (type-only module; safe for serverless imports). */
export const productStatuses = ['published', 'draft', 'archived'] as const
export type ProductStatus = (typeof productStatuses)[number]
export const productStatusOf = (p: { published: boolean; archived: boolean }): ProductStatus => (p.published ? 'published' : p.archived ? 'archived' : 'draft')

export interface AdminProduct extends CatalogProduct {
  published: boolean
  /** Retired product (never published). Draft = neither published nor archived. */
  archived: boolean
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

export const analyticsRanges = ['7d', '30d', '90d', 'all'] as const
export type AnalyticsRange = (typeof analyticsRanges)[number]

/** Raw daily activity returned by the store; aggregated on the server into ProductAnalytics. */
export interface ProductActivity {
  views: { slug: string; day: string; n: number }[]
  /** Quote demand per product, day and unit. `requests` counts quote requests, never sales. */
  quotes: { slug: string; day: string; unit: string | null; requests: number; quantity: number | null }[]
  viewTotals: { slug: string; n: number }[]
}

export interface ProductAnalyticsRow {
  slug: string
  name: string
  categorySlug: string
  published: boolean
  views: number
  viewsAllTime: number
  quoteRequests: number
  /** Requested quantity per unit (bags, kg, …) across quote requests in the range. */
  requestedQuantity: Record<string, number>
  /** Null until a verified sales source exists. */
  unitsSold: number | null
  /** Quote requests per view in the range, or null with no views. */
  quoteRate: number | null
  /** Views + quote requests in the last 7 days vs the 7 days before. */
  trend: { current: number; previous: number; change: number | null }
}

export interface ProductAnalytics {
  range: AnalyticsRange
  from: string | null
  to: string
  generatedAt: string
  /** False while no verified sales records exist; the UI must show "No sales data". */
  salesTracked: boolean
  totals: { views: number; quoteRequests: number; productsViewed: number; unitsSold: number | null }
  previousTotals: { views: number; quoteRequests: number } | null
  series: { day: string; views: number; quoteRequests: number }[]
  products: ProductAnalyticsRow[]
}

export interface AdminInvite {
  id: string
  email: string
  invitedBy: string
  createdAt: string
  expiresAt: string
}

export interface AdminMemberRow {
  clerkUserId: string
  /** Email the member was invited with, if any. */
  note: string | null
  createdAt: string
}

export interface AdminTeam {
  members: (AdminMemberRow & { name: string | null; email: string | null; you: boolean })[]
  /** Open (not accepted, not revoked) invitations, newest first; expired ones are flagged by `expiresAt`. */
  invites: AdminInvite[]
}
