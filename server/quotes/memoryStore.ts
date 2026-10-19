import { createMemoryWorkspace } from '../workspace/memory.js'
import { randomBytes, randomUUID } from 'node:crypto'
import type { AdminInvite, AdminMessage, AdminProduct, AuditEntry, ProductActivity } from '../../src/features/admin/types.js'
import type { CatalogProduct } from '../../src/data/catalog.js'
import type { ProductData } from '../../src/features/catalog/productSchema.js'
import { builtInCategoryNames, categoryNameFromSlug, type AdminCategory } from '../../src/features/catalog/categorySchema.js'
import type { QuoteDetail, QuoteEvent, QuoteSummary } from '../../src/features/quotes/schema.js'
import type { ProductCoverage } from '../../src/features/resources/types.js'
import type { DataStore, InsertedQuote, NewContactMessage, NewQuote, StoredResource } from './store.js'

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
  categoryName: data.categoryName,
  images: data.images,
  stockQuantity: data.stockQuantity,
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
  archived: false,
  sortOrder: data.sortOrder,
  updatedAt,
})

/** In-memory store for unit tests and opt-in local development only. Never used in production. */
export function createMemoryStore(options: { products?: CatalogProduct[]; admins?: string[]; superAdmins?: string[]; now?: () => number } = {}) {
  const clock = options.now ?? Date.now
  const rows: Row[] = []
  const hits = new Map<string, number>()
  const wishlists = new Map<string, string[]>()
  const messages: MessageRow[] = []
  const audit: AuditEntry[] = []
  const viewDaily = new Map<string, number>()
  const resources: StoredResource[] = []
  const coverage = new Map<string, ProductCoverage>()
  const viewDedup = new Set<string>()
  const admins = new Map((options.admins ?? []).map((id) => [id, { superAdmin: options.superAdmins?.includes(id) ?? false, note: null as string | null, createdAt: new Date().toISOString() }]))
  type Invite = AdminInvite & { acceptedAt: string | null; revokedAt: string | null }
  const invites: Invite[] = []
  const isOpen = (i: Invite) => !i.acceptedAt && !i.revokedAt
  const products: AdminProduct[] = (options.products ?? []).map((p, i) => ({ ...p, published: true, archived: false, sortOrder: i, updatedAt: new Date().toISOString() }))
  type CategoryRow = Omit<AdminCategory, 'productCount'>
  const categories: CategoryRow[] = Object.entries(builtInCategoryNames).map(([slug, name], i) => ({ slug, name, description: null, image: null, visible: true, sortOrder: i + 1, updatedAt: new Date().toISOString() }))
  /** Mirrors the products_sync_category trigger: unknown slugs create a category; names come from the category. */
  const syncCategory = (product: AdminProduct) => {
    let category = categories.find((c) => c.slug === product.categorySlug)
    if (!category) {
      category = { slug: product.categorySlug, name: product.categoryName || categoryNameFromSlug(product.categorySlug), description: null, image: null, visible: true, sortOrder: Math.max(0, ...categories.map((c) => c.sortOrder)) + 1, updatedAt: new Date().toISOString() }
      categories.push(category)
    }
    product.categoryName = category.name
  }
  products.forEach(syncCategory)

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
    workspace: createMemoryWorkspace(id => admins.has(id)),
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
    async hasOpenAdminInvites() {
      return invites.some((i) => isOpen(i) && Date.parse(i.expiresAt) > clock())
    },
    async acceptAdminInvite(clerkUserId, verifiedEmails) {
      const emails = new Set(verifiedEmails.map((e) => e.toLowerCase()))
      const invite = invites.find((i) => isOpen(i) && emails.has(i.email) && Date.parse(i.expiresAt) > clock())
      if (!invite) return false
      if (!admins.has(clerkUserId)) admins.set(clerkUserId, { superAdmin: false, note: invite.email, createdAt: new Date().toISOString() })
      invite.acceptedAt = new Date().toISOString()
      log(clerkUserId, 'admin.invite.accept', 'admin_invitation', invite.id)
      return true
    },
    async createAdminInvite(actor, email) {
      if (!admins.has(actor)) throw new Error('not an admin')
      const expiresAt = new Date(clock() + 7 * 86_400_000).toISOString()
      let invite = invites.find((i) => isOpen(i) && i.email === email.toLowerCase())
      if (invite) Object.assign(invite, { expiresAt, invitedBy: actor })
      else invites.unshift((invite = { id: randomUUID(), email: email.toLowerCase(), invitedBy: actor, createdAt: new Date().toISOString(), expiresAt, acceptedAt: null, revokedAt: null }))
      log(actor, 'admin.invite', 'admin_invitation', invite.id)
      return invite.id
    },
    async revokeAdminInvite(actor, id) {
      const invite = invites.find((i) => i.id === id && isOpen(i))
      if (!invite) return false
      invite.revokedAt = new Date().toISOString()
      log(actor, 'admin.invite.revoke', 'admin_invitation', id)
      return true
    },
    async removeAdmin(actor, clerkUserId) {
      if (admins.get(clerkUserId)?.superAdmin) return 'protected'
      if (actor === clerkUserId) return 'self'
      if (!admins.has(clerkUserId)) return 'not_found'
      if (admins.size <= 1) return 'last_admin'
      admins.delete(clerkUserId)
      log(actor, 'admin.remove', 'admin_member', clerkUserId)
      return 'ok'
    },
    async listAdminTeam() {
      return {
        members: [...admins].map(([clerkUserId, m]) => ({ clerkUserId, ...m })),
        invites: invites.filter(isOpen).map(({ acceptedAt: _a, revokedAt: _r, ...i }) => i),
      }
    },
    async saveProduct(actor, slug, data, create) {
      const index = products.findIndex((p) => p.slug === slug)
      if (create && index >= 0) return 'conflict'
      if (!create && index < 0) return 'not_found'
      const product = productFromData({ ...data, slug })
      // Mirrors the database trigger: publishing un-archives; otherwise archive state is kept.
      if (!create && !product.published) product.archived = products[index].archived
      syncCategory(product)
      if (create) products.push(product)
      else products[index] = product
      log(actor, create ? 'product.create' : 'product.update', 'product', slug)
      return 'ok'
    },
    async setProductStatus(actor, slug, status) {
      const product = products.find((p) => p.slug === slug)
      if (!product) return false
      product.published = status === 'published'
      product.archived = status === 'archived'
      product.updatedAt = new Date().toISOString()
      log(actor, 'product.status', 'product', slug)
      return true
    },
    async deleteProduct(actor, slug) {
      const index = products.findIndex((p) => p.slug === slug)
      if (index < 0) return 'not_found'
      if (rows.some((r) => !['closed', 'cancelled'].includes(r.status) && r.items.some((i) => i.productSlug === slug))) return 'in_use'
      products.splice(index, 1)
      coverage.delete(slug)
      for (const [user, slugs] of wishlists) wishlists.set(user, slugs.filter((s) => s !== slug))
      for (const key of [...viewDaily.keys()]) if (key.startsWith(`${slug}|`)) viewDaily.delete(key)
      log(actor, 'product.delete', 'product', slug)
      return 'ok'
    },
    async listCategories() {
      return [...categories]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ ...c, productCount: products.filter((p) => p.categorySlug === c.slug).length }))
    },
    async saveCategory(actor, slug, data, create) {
      const existing = categories.find((c) => c.slug === slug)
      if (create && existing) return 'conflict'
      if (!create && !existing) return 'not_found'
      const updatedAt = new Date().toISOString()
      if (existing) Object.assign(existing, { name: data.name, description: data.description, image: data.image, visible: data.visible, updatedAt })
      else categories.push({ slug, name: data.name, description: data.description, image: data.image, visible: data.visible, sortOrder: Math.max(0, ...categories.map((c) => c.sortOrder)) + 1, updatedAt })
      for (const p of products) if (p.categorySlug === slug) p.categoryName = data.name
      log(actor, create ? 'category.create' : 'category.update', 'category', slug)
      return 'ok'
    },
    async reorderCategories(actor, slugs) {
      slugs.forEach((slug, i) => {
        const c = categories.find((x) => x.slug === slug)
        if (c) c.sortOrder = i + 1
      })
      log(actor, 'category.reorder', 'category', 'all')
    },
    async deleteCategory(actor, slug, moveTo) {
      const index = categories.findIndex((c) => c.slug === slug)
      if (index < 0) return 'not_found'
      const used = products.filter((p) => p.categorySlug === slug)
      if (moveTo !== null) {
        const target = categories.find((c) => c.slug === moveTo)
        if (!target || moveTo === slug) return 'invalid_target'
        for (const p of used) Object.assign(p, { categorySlug: target.slug, categoryName: target.name })
      } else if (used.length) return 'in_use'
      categories.splice(index, 1)
      log(actor, 'category.delete', 'category', slug)
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

    async recordProductView(slug, visitorKey) {
      if (!products.some((p) => p.slug === slug && p.published)) return false
      const day = new Date().toISOString().slice(0, 10)
      const dedupKey = `${visitorKey}|${slug}|${day}`
      if (viewDedup.has(dedupKey)) return false
      viewDedup.add(dedupKey)
      viewDaily.set(`${slug}|${day}`, (viewDaily.get(`${slug}|${day}`) ?? 0) + 1)
      return true
    },
    async productActivity(since) {
      const views = [...viewDaily].map(([key, n]) => {
        const [slug, day] = key.split('|')
        return { slug, day, n }
      })
      const totals = new Map<string, number>()
      for (const v of views) totals.set(v.slug, (totals.get(v.slug) ?? 0) + v.n)
      const quotes = new Map<string, ProductActivity['quotes'][number]>()
      for (const r of rows) {
        const day = r.createdAt.slice(0, 10)
        if (since && day < since) continue
        for (const item of r.items) {
          const key = `${item.productSlug}|${day}|${item.quantityUnit ?? ''}`
          const q = quotes.get(key) ?? { slug: item.productSlug, day, unit: item.quantityUnit, requests: 0, quantity: null }
          q.requests += 1
          if (item.quantity !== null) q.quantity = (q.quantity ?? 0) + item.quantity
          quotes.set(key, q)
        }
      }
      return {
        views: views.filter((v) => !since || v.day >= since),
        quotes: [...quotes.values()],
        viewTotals: [...totals].map(([slug, n]) => ({ slug, n })),
      }
    },

    async listResources({ includeUnpublished }) {
      return resources.filter((r) => includeUnpublished || r.published).map((r) => ({ ...r }))
    },
    async getResource(id) {
      const r = resources.find((x) => x.id === id)
      return r ? { ...r } : null
    },
    async saveResource(actor, id, record) {
      const now = new Date(clock()).toISOString()
      if (id) {
        const r = resources.find((x) => x.id === id)
        if (!r) return null
        Object.assign(r, record, { updatedAt: now })
        log(actor, 'resource.update', 'resource', id)
        return { ...r }
      }
      if (resources.some((r) => r.storagePath === record.storagePath)) throw new Error('duplicate storage path')
      const r: StoredResource = { id: randomUUID(), ...record, createdAt: now, updatedAt: now }
      resources.unshift(r)
      log(actor, 'resource.create', 'resource', r.id)
      return { ...r }
    },
    async deleteResource(actor, id) {
      const i = resources.findIndex((x) => x.id === id)
      if (i < 0) return null
      const [r] = resources.splice(i, 1)
      for (const c of coverage.values()) if (c.sourceResourceId === id) c.sourceResourceId = null
      log(actor, 'resource.delete', 'resource', id)
      return r
    },
    async listCoverage() {
      return [...coverage.values()].map((c) => ({ ...c }))
    },
    async saveCoverage(actor, slug, c) {
      if (!products.some((p) => p.slug === slug)) return false
      coverage.set(slug, { productSlug: slug, ...c, note: c.note ?? null, updatedAt: new Date(clock()).toISOString() })
      log(actor, 'coverage.update', 'product', slug)
      return true
    },
    async deleteCoverage(actor, slug) {
      if (!coverage.delete(slug)) return false
      log(actor, 'coverage.delete', 'product', slug)
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
