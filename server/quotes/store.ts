import type { WorkspaceStore } from '../workspace/store.js'
import type { AdminCustomer, AdminMessage, AdminOverview, AdminProduct, AdminQuoteDetail, AdminQuoteRow, AdminInvite, AdminMemberRow, MessageStatus, ProductActivity, ProductStatus } from '../../src/features/admin/types.js'
import type { ProductData } from '../../src/features/catalog/productSchema.js'
import type { AdminCategory, CategoryData } from '../../src/features/catalog/categorySchema.js'
import type { CoverageData } from '../../src/features/resources/schema.js'
import type { ProductCoverage, ResourceKind, TechnicalResource } from '../../src/features/resources/types.js'
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

export type StoredResource = TechnicalResource & { storagePath: string }
export interface ResourceRecord {
  title: string
  summary: string | null
  kind: ResourceKind
  productSlugs: string[]
  published: boolean
  storagePath: string
  fileName: string
  fileSize: number
}

/** Persistence boundary. Implementations run only on the server. */
export interface DataStore {
  workspace: WorkspaceStore
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
  // Admin team (membership changes only through invitation rules; see migration M12)
  hasOpenAdminInvites(): Promise<boolean>
  /** Grants admin when an open, unexpired invitation matches one of the user's VERIFIED emails. */
  acceptAdminInvite(clerkUserId: string, verifiedEmails: string[]): Promise<boolean>
  createAdminInvite(actor: string, email: string): Promise<string>
  revokeAdminInvite(actor: string, id: string): Promise<boolean>
  removeAdmin(actor: string, clerkUserId: string): Promise<'ok' | 'not_found' | 'self' | 'last_admin' | 'protected'>
  listAdminTeam(): Promise<{ members: AdminMemberRow[]; invites: AdminInvite[] }>
  saveProduct(actor: string, slug: string, data: ProductData, create: boolean): Promise<'ok' | 'not_found' | 'conflict'>
  setProductStatus(actor: string, slug: string, status: ProductStatus): Promise<boolean>
  /** 'in_use' while open (not closed or cancelled) quote requests reference the product. */
  deleteProduct(actor: string, slug: string): Promise<'ok' | 'not_found' | 'in_use'>
  // Categories (products reference them by slug; saving a product with an unknown slug creates it)
  listCategories(): Promise<AdminCategory[]>
  saveCategory(actor: string, slug: string, data: CategoryData, create: boolean): Promise<'ok' | 'not_found' | 'conflict'>
  reorderCategories(actor: string, slugs: string[]): Promise<void>
  /** With moveTo, products are moved there first; without it, a category that has products is 'in_use'. */
  deleteCategory(actor: string, slug: string, moveTo: string | null): Promise<'ok' | 'not_found' | 'in_use' | 'invalid_target'>
  adminListQuotes(filter: { status?: QuoteStatus; search?: string; limit: number; offset: number }): Promise<{ rows: AdminQuoteRow[]; total: number }>
  adminGetQuote(reference: string): Promise<AdminQuoteDetail | null>
  adminUpdateQuote(reference: string, actor: string, status: QuoteStatus, note: string | null, internalNotes: string | null): Promise<boolean>
  adminOverview(): Promise<AdminOverview>
  adminCustomers(): Promise<AdminCustomer[]>
  adminListMessages(status?: MessageStatus): Promise<AdminMessage[]>
  adminUpdateMessage(id: string, actor: string, status: MessageStatus): Promise<boolean>
  // Product analytics
  /** Counts a view once per visitor key, product and UTC day; false for duplicates or unknown products. */
  recordProductView(slug: string, visitorKey: string): Promise<boolean>
  /** Daily views and quote demand since a UTC day (null = all time). */
  productActivity(since: string | null): Promise<ProductActivity>
  // Resource Center
  listResources(options: { includeUnpublished: boolean }): Promise<StoredResource[]>
  getResource(id: string): Promise<StoredResource | null>
  /** Creates (id null) or updates a resource; null when the id does not exist. */
  saveResource(actor: string, id: string | null, record: ResourceRecord): Promise<StoredResource | null>
  /** Returns the deleted row (so its file can be removed), or null. */
  deleteResource(actor: string, id: string): Promise<StoredResource | null>
  listCoverage(): Promise<ProductCoverage[]>
  saveCoverage(actor: string, slug: string, data: CoverageData): Promise<boolean>
  deleteCoverage(actor: string, slug: string): Promise<boolean>
  /** Returns true when the request is within the limit. */
  hitRateLimit(key: string, windowSeconds: number, max: number): Promise<boolean>
}
