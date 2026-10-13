import { randomBytes, randomUUID } from 'node:crypto'
import type { AdminMessage, AdminProduct, AuditEntry } from '../../src/features/admin/types.js'
import type { CatalogProduct } from '../../src/data/catalog.js'
import type { ProductData } from '../../src/features/catalog/productSchema.js'
import type { QuoteDetail, QuoteEvent, QuoteSummary } from '../../src/features/quotes/schema.js'
import type { DataStore, InsertedQuote, NewContactMessage, NewQuote } from './store.js'

interface Row extends NewQuote, QuoteSummary {
  events: QuoteEvent[]
  internalNotes: string | null
}

interface MessageRow extends NewContactMessage {
  id: string
  status: AdminMessage['status']
  createdAt: string
}

export const productFromData = (data: ProductData, updatedAt = new Date().toISOString()): AdminProduct => ({
  id: `p-${data.slug}`,
  slug: data.slug,
  name: data.name,
  categorySlug: data.categorySlug,
  usage: data.usage,
  description: data.description,
  applications: data.applications,
  areas: data.areas,
  benefits: data.benefits,
  specifications: data.specifications,
  packSizes: data.packSizes,
  coverage: data.coverage,
  documents: data.documents,
  faq: data.faq,
  image: data.image,
  price: data.price,
  verified: data.verified,
  published: data.published,
  sortOrder: data.sortOrder,
  updatedAt,
})

/** In-memory store for unit tests and opt-in local development only. Never used in production. */
export function createMemoryStore(options: { products?: CatalogProduct[]; admins?: string[] } = {}) {
  const rows: Row[] = []
  const hits = new Map<string, number>()
  const wishlists = new Map<string, string[]>()
  const messages: MessageRow[] = []
  const audit: AuditEntry[] = []
  const admins = new Set(options.admins ?? [])
  const products: AdminProduct[] = (options.products ?? []).map((p, i) => ({ ...p, published: true, sortOrder: i, updatedAt: new Date().toISOString() }))

  const log = (actor: string, action: string, entity: string, entityKey: string) =>
    audit.unshift({ actor, action, entity, entityKey, createdAt: new Date().toISOString() })

  const summary = (row: Row): QuoteSummary => ({
    reference: row.reference,
    status: row.status,
    items: row.items.map((item) => ({ ...item })),
    projectType: row.projectType,
    city: row.city,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })

  const detail = (row: Row): QuoteDetail => ({
    ...summary(row),
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    company: row.company,
    deliveryLocation: row.deliveryLocation,
    description: row.description,
    events: row.events.map((e) => ({ ...e })),
  })

  const store: DataStore & { rows: Row[]; messages: MessageRow[]; audit: AuditEntry[]; products: AdminProduct[] } = {
    rows,
    messages,
    audit,
    products,
    async insert(quote: NewQuote): Promise<InsertedQuote> {
      const now = new Date().toISOString()
      const row: Row = {
        ...quote,
        reference: `NQ-${randomBytes(6).toString('hex').toUpperCase()}`,
        status: 'submitted',
        createdAt: now,
        updatedAt: now,
        internalNotes: null,
        events: [{ status: 'submitted', note: null, actor: 'customer', createdAt: now }],
      }
      rows.push(row)
      return { reference: row.reference, status: row.status, createdAt: row.createdAt }
    },
    async listByUser(clerkUserId, limit) {
      return rows
        .filter((r) => r.clerkUserId === clerkUserId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
        .map(summary)
    },
    async findGuestQuote(reference, guestTokenHash) {
      const row = rows.find((r) => r.reference === reference && r.guestTokenHash === guestTokenHash)
      return row ? summary(row) : null
    },
    async findUserQuote(clerkUserId, reference) {
      const row = rows.find((r) => r.reference === reference && r.clerkUserId === clerkUserId)
      return row ? detail(row) : null
    },
    async insertContactMessage(message) {
      messages.push({ ...message, id: randomUUID(), status: 'new', createdAt: new Date().toISOString() })
    },
    async getWishlist(clerkUserId) {
      return [...(wishlists.get(clerkUserId) ?? [])]
    },
    async replaceWishlist(clerkUserId, slugs) {
      wishlists.set(clerkUserId, [...new Set(slugs)])
      return [...(wishlists.get(clerkUserId) ?? [])]
    },

    async listProducts({ includeUnpublished }) {
      return products.filter((p) => includeUnpublished || p.published).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    },
    async isAdmin(clerkUserId) {
      return admins.has(clerkUserId)
    },
    async saveProduct(actor, slug, data, create) {
      const index = products.findIndex((p) => p.slug === slug)
      if (create && index >= 0) return 'conflict'
      if (!create && index < 0) return 'not_found'
      const product = productFromData({ ...data, slug })
      if (create) products.push(product)
      else products[index] = product
      log(actor, create ? 'product.create' : 'product.update', 'product', slug)
      return 'ok'
    },
    async adminListQuotes({ status, search, limit, offset }) {
      const term = search?.toLowerCase()
      const matched = rows
        .filter((r) => !status || r.status === status)
        .filter((r) => !term || [r.reference, r.email, r.fullName].some((v) => v.toLowerCase().includes(term)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return {
        total: matched.length,
        rows: matched.slice(offset, offset + limit).map((r) => ({
          reference: r.reference,
          status: r.status,
          fullName: r.fullName,
          email: r.email,
          company: r.company,
          city: r.city,
          itemCount: r.items.length,
          owner: r.clerkUserId ? 'account' : 'guest',
          createdAt: r.createdAt,
        })),
      }
    },
    async adminGetQuote(reference) {
      const row = rows.find((r) => r.reference === reference)
      return row ? { ...detail(row), internalNotes: row.internalNotes, owner: row.clerkUserId ? 'account' : 'guest', clerkUserId: row.clerkUserId } : null
    },
    async adminUpdateQuote(reference, actor, status, note, internalNotes) {
      const row = rows.find((r) => r.reference === reference)
      if (!row) return false
      const now = new Date().toISOString()
      if (row.status !== status || note) row.events.push({ status, note, actor: 'staff', createdAt: now })
      row.status = status
      row.updatedAt = now
      if (internalNotes !== null) row.internalNotes = internalNotes
      log(actor, 'quote.update', 'quote', reference)
      return true
    },
    async adminOverview() {
      const quotesByStatus: Record<string, number> = {}
      for (const r of rows) quotesByStatus[r.status] = (quotesByStatus[r.status] ?? 0) + 1
      const customers = new Set([...rows.flatMap((r) => (r.clerkUserId ? [r.clerkUserId] : [])), ...wishlists.keys()])
      return {
        quotesByStatus,
        quotesLast7Days: rows.filter((r) => Date.now() - Date.parse(r.createdAt) < 7 * 86_400_000).length,
        newMessages: messages.filter((m) => m.status === 'new').length,
        products: products.length,
        productsVerified: products.filter((p) => p.verified).length,
        productsPublished: products.filter((p) => p.published).length,
        customers: customers.size,
        recentAudit: audit.slice(0, 10),
      }
    },
    async adminCustomers() {
      const ids = new Set([...rows.flatMap((r) => (r.clerkUserId ? [r.clerkUserId] : [])), ...wishlists.keys()])
      return [...ids].map((id) => {
        const own = rows.filter((r) => r.clerkUserId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        return {
          clerkUserId: id,
          fullName: own[0]?.fullName ?? null,
          email: own[0]?.email ?? null,
          company: own[0]?.company ?? null,
          quotes: own.length,
          lastQuoteAt: own[0]?.createdAt ?? null,
          wishlist: wishlists.get(id)?.length ?? 0,
        }
      })
    },
    async adminListMessages(status) {
      return messages
        .filter((m) => !status || m.status === status)
        .map((m) => ({ id: m.id, fullName: m.fullName, email: m.email, phone: m.phone, topic: m.topic, message: m.message, status: m.status, owner: m.clerkUserId ? 'account' : 'guest', createdAt: m.createdAt }))
    },
    async adminUpdateMessage(id, actor, status) {
      const m = messages.find((x) => x.id === id)
      if (!m) return false
      m.status = status
      log(actor, 'message.update', 'message', id)
      return true
    },

    async hitRateLimit(key, windowSeconds, max) {
      const bucket = `${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`
      const count = (hits.get(bucket) ?? 0) + 1
      hits.set(bucket, count)
      return count <= max
    },
  }
  return store
}
