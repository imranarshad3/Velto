import { createSupabaseWorkspace } from '../workspace/supabase.js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AdminCustomer, AdminMessage, AdminOverview, AdminProduct, AdminQuoteRow, AuditEntry, ProductActivity } from '../../src/features/admin/types.js'
import type { ProductData } from '../../src/features/catalog/productSchema.js'
import type { QuoteDetail, QuoteEvent, QuoteSummary } from '../../src/features/quotes/schema.js'
import { HttpError } from '../http.js'
import type { ProductCoverage } from '../../src/features/resources/types.js'
import type { DataStore, StoredResource } from './store.js'

const SUMMARY_COLUMNS =
  'reference, status, project_type, city, created_at, updated_at, quote_request_items(position, product_slug, quantity, quantity_unit)'

interface SummaryRow {
  reference: string
  status: QuoteSummary['status']
  quote_request_items: { position: number; product_slug: string; quantity: number | string | null; quantity_unit: string | null }[] | null
  project_type: string | null
  city: string
  created_at: string
  updated_at: string
}

const toSummary = (row: SummaryRow): QuoteSummary => ({
  reference: row.reference,
  status: row.status,
  items: [...(row.quote_request_items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      productSlug: item.product_slug,
      quantity: item.quantity === null ? null : Number(item.quantity),
      quantityUnit: item.quantity_unit,
    })),
  projectType: row.project_type,
  city: row.city,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

interface DetailRow extends SummaryRow {
  full_name: string
  email: string
  phone: string
  company: string | null
  delivery_location: string | null
  description: string
  quote_events: { status: QuoteEvent['status']; note: string | null; actor: QuoteEvent['actor']; created_at: string }[] | null
}

const toDetail = (row: DetailRow): QuoteDetail => ({
  ...toSummary(row),
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  company: row.company,
  deliveryLocation: row.delivery_location,
  description: row.description,
  events: [...(row.quote_events ?? [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((e) => ({ status: e.status, note: e.note, actor: e.actor, createdAt: e.created_at })),
})

interface ProductRow {
  id: string
  slug: string
  name: string
  category_slug: string
  category_name: string | null
  images: AdminProduct['images'] | null
  stock_quantity: number | null
  usage: string
  description: string | null
  applications: string[]
  areas: AdminProduct['areas']
  benefits: string[]
  specifications: { label: string; value: string }[]
  pack_sizes: string[]
  coverage: string | null
  documents: { title: string; url: string; fileType: string }[]
  faq: { question: string; answer: string }[]
  image: AdminProduct['image'] | null
  price_amount: number | string | null
  price_currency: string | null
  verified: boolean
  published: boolean
  archived: boolean | null
  sort_order: number
  updated_at: string
}

const toProduct = (r: ProductRow): AdminProduct => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  categorySlug: r.category_slug,
  categoryName: r.category_name ?? undefined,
  images: r.images ?? [],
  stockQuantity: r.stock_quantity ?? null,
  usage: r.usage,
  description: r.description ?? undefined,
  applications: r.applications,
  areas: r.areas,
  benefits: r.benefits,
  specifications: r.specifications,
  packSizes: r.pack_sizes,
  coverage: r.coverage ?? undefined,
  documents: r.documents,
  faq: r.faq,
  image: r.image ?? undefined,
  price: r.price_amount !== null && r.price_currency ? { amount: Number(r.price_amount), currency: r.price_currency } : undefined,
  verified: r.verified,
  published: r.published,
  archived: r.archived ?? false,
  sortOrder: r.sort_order,
  updatedAt: r.updated_at,
})

const productPayload = (d: ProductData) => ({
  name: d.name,
  category_slug: d.categorySlug,
  category_name: d.categoryName ?? null,
  images: d.images,
  stock_quantity: d.stockQuantity,
  usage: d.usage,
  description: d.description ?? null,
  applications: d.applications,
  areas: d.areas,
  benefits: d.benefits,
  specifications: d.specifications,
  pack_sizes: d.packSizes,
  coverage: d.coverage ?? null,
  documents: d.documents,
  faq: d.faq,
  image: d.image ?? null,
  price_amount: d.price?.amount ?? null,
  price_currency: d.price?.currency ?? null,
  verified: d.verified,
  published: d.published,
  sort_order: d.sortOrder,
})

/** Admin search is reduced to a safe character set before it reaches a PostgREST filter expression. */
export const safeSearch = (value: string) => value.replace(/[^A-Za-z0-9@._ +-]/g, '').trim().slice(0, 80)

/** Error codes only: database messages can echo submitted values (PII). */
type ResourceRow = {
  id: string
  title: string
  summary: string | null
  kind: StoredResource['kind']
  product_slugs: string[]
  storage_path: string
  file_name: string
  file_size: number
  published: boolean
  created_at: string
  updated_at: string
}
const toResource = (r: ResourceRow): StoredResource => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  kind: r.kind,
  productSlugs: r.product_slugs,
  storagePath: r.storage_path,
  fileName: r.file_name,
  fileSize: Number(r.file_size),
  published: r.published,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})
type CoverageRow = { product_slug: string; rate: number | string; rate_unit: 'kg' | 'L'; coats: number; pack_amount: number | string; pack_container: ProductCoverage['packContainer']; source_resource_id: string | null; note: string | null; updated_at: string }
const toCoverage = (r: CoverageRow): ProductCoverage => ({
  productSlug: r.product_slug,
  rate: Number(r.rate),
  rateUnit: r.rate_unit,
  coats: r.coats,
  packAmount: Number(r.pack_amount),
  packContainer: r.pack_container,
  sourceResourceId: r.source_resource_id,
  note: r.note,
  updatedAt: r.updated_at,
})

/** Missing table/column/function: the database is behind the code (a migration was not applied). */
const SCHEMA_MISSING = new Set(['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'])

function fail(operation: string, error: { code?: string } | null): never {
  if (error?.code && SCHEMA_MISSING.has(error.code)) {
    console.error(`[db] ${operation}: schema object missing (${error.code}). Apply the pending migrations in supabase/migrations.`)
    throw new HttpError(503, 'migration_required', 'This feature needs a database update. Apply the latest Supabase migrations and reload.')
  }
  throw new Error(`supabase ${operation} failed (${error?.code ?? 'unknown'})`)
}

/** Server-only store using the Supabase secret key (bypasses RLS; never ship to the browser). */
export function createSupabaseStore(url: string, secretKey: string): DataStore {
  const db: SupabaseClient = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return {
    workspace: createSupabaseWorkspace(db),
    async insert(quote) {
      // Quote + items in one transaction (server-only database function).
      const { data, error } = await db
        .rpc('create_quote_request', {
          p_quote: {
            clerk_user_id: quote.clerkUserId,
            guest_token_hash: quote.guestTokenHash,
            full_name: quote.fullName,
            email: quote.email,
            phone: quote.phone,
            company: quote.company,
            project_type: quote.projectType,
            city: quote.city,
            delivery_location: quote.deliveryLocation,
            description: quote.description,
            consent_at: quote.consentAt,
          },
          p_items: quote.items.map((item) => ({
            product_slug: item.productSlug,
            quantity: item.quantity,
            quantity_unit: item.quantityUnit,
          })),
        })
        .single<{ reference: string; status: QuoteSummary['status']; created_at: string }>()
      if (error || !data) fail('insert', error)
      return { reference: data.reference, status: data.status, createdAt: data.created_at }
    },

    async listByUser(clerkUserId, limit) {
      const { data, error } = await db
        .from('quote_requests')
        .select(SUMMARY_COLUMNS)
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) fail('list', error)
      return (data as SummaryRow[]).map(toSummary)
    },

    async findGuestQuote(reference, guestTokenHash) {
      const { data, error } = await db
        .from('quote_requests')
        .select(SUMMARY_COLUMNS)
        .eq('reference', reference)
        .eq('guest_token_hash', guestTokenHash)
        .maybeSingle()
      if (error) fail('guest lookup', error)
      return data ? toSummary(data as SummaryRow) : null
    },

    async findUserQuote(clerkUserId, reference) {
      const { data, error } = await db
        .from('quote_requests')
        .select(`${SUMMARY_COLUMNS}, full_name, email, phone, company, delivery_location, description, quote_events(status, note, actor, created_at)`)
        .eq('reference', reference)
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()
      if (error) fail('quote detail', error)
      return data ? toDetail(data as DetailRow) : null
    },

    async insertContactMessage(message) {
      const { error } = await db.from('contact_messages').insert({
        clerk_user_id: message.clerkUserId,
        full_name: message.fullName,
        email: message.email,
        phone: message.phone,
        topic: message.topic,
        message: message.message,
        consent_at: message.consentAt,
      })
      if (error) fail('contact insert', error)
    },

    async getWishlist(clerkUserId) {
      const { data, error } = await db
        .from('wishlist_items')
        .select('product_slug')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .order('product_slug')
        .limit(100)
      if (error) fail('wishlist', error)
      return (data as { product_slug: string }[]).map((row) => row.product_slug)
    },

    async replaceWishlist(clerkUserId, slugs) {
      const { data, error } = await db.rpc('replace_wishlist', { p_user: clerkUserId, p_slugs: slugs })
      if (error) fail('wishlist replace', error)
      return (data as string[] | null) ?? []
    },

    async listProducts({ includeUnpublished }) {
      let query = db.from('products').select('*').order('sort_order').order('name').limit(1000)
      if (!includeUnpublished) query = query.eq('published', true)
      const { data, error } = await query
      if (error) fail('products', error)
      return (data as ProductRow[]).map(toProduct)
    },

    async isAdmin(clerkUserId) {
      const { data, error } = await db.from('admin_members').select('clerk_user_id').eq('clerk_user_id', clerkUserId).maybeSingle()
      if (error) fail('admin check', error)
      return Boolean(data)
    },

    async hasOpenAdminInvites() {
      const { count, error } = await db.from('admin_invitations').select('id', { count: 'exact', head: true }).is('accepted_at', null).is('revoked_at', null).gt('expires_at', new Date().toISOString())
      if (error) fail('open invites', error)
      return (count ?? 0) > 0
    },

    async acceptAdminInvite(clerkUserId, verifiedEmails) {
      if (!verifiedEmails.length) return false
      const { data, error } = await db.rpc('accept_admin_invitation', { p_user: clerkUserId, p_emails: verifiedEmails })
      if (error) fail('accept invite', error)
      return data === true
    },

    async createAdminInvite(actor, email) {
      const { data, error } = await db.rpc('admin_create_invitation', { p_actor: actor, p_email: email })
      if (error) fail('create invite', error)
      return data as string
    },

    async revokeAdminInvite(actor, id) {
      const { data, error } = await db.rpc('admin_revoke_invitation', { p_actor: actor, p_id: id })
      if (error) fail('revoke invite', error)
      return data === true
    },

    async removeAdmin(actor, clerkUserId) {
      const { data, error } = await db.rpc('admin_remove_member', { p_actor: actor, p_user: clerkUserId })
      if (error) fail('remove admin', error)
      return data === 'ok' || data === 'self' || data === 'last_admin' ? data : 'not_found'
    },

    async listAdminTeam() {
      const [members, invites] = await Promise.all([
        db.from('admin_members').select('clerk_user_id, note, created_at').order('created_at'),
        db.from('admin_invitations').select('id, email, invited_by, created_at, expires_at').is('accepted_at', null).is('revoked_at', null).order('created_at', { ascending: false }).limit(50),
      ])
      if (members.error) fail('admin members', members.error)
      if (invites.error) fail('admin invites', invites.error)
      return {
        members: (members.data as { clerk_user_id: string; note: string | null; created_at: string }[]).map((m) => ({ clerkUserId: m.clerk_user_id, note: m.note, createdAt: m.created_at })),
        invites: (invites.data as { id: string; email: string; invited_by: string; created_at: string; expires_at: string }[]).map((i) => ({
          id: i.id,
          email: i.email,
          invitedBy: i.invited_by,
          createdAt: i.created_at,
          expiresAt: i.expires_at,
        })),
      }
    },

    async saveProduct(actor, slug, data, create) {
      const { data: ok, error } = await db.rpc('admin_save_product', { p_actor: actor, p_slug: slug, p_product: productPayload(data), p_create: create })
      if (error?.code === '23505') return 'conflict'
      if (error) fail('save product', error)
      return ok ? 'ok' : 'not_found'
    },

    async setProductStatus(actor, slug, status) {
      const { data, error } = await db.rpc('admin_set_product_status', { p_actor: actor, p_slug: slug, p_status: status })
      if (error) fail('product status', error)
      return data === true
    },

    async deleteProduct(actor, slug) {
      const { data, error } = await db.rpc('admin_delete_product', { p_actor: actor, p_slug: slug })
      if (error) fail('delete product', error)
      return data === 'ok' || data === 'in_use' ? data : 'not_found'
    },

    async adminListQuotes({ status, search, limit, offset }) {
      let query = db
        .from('quote_requests')
        .select('reference, status, full_name, email, company, city, created_at, clerk_user_id, quote_request_items(count)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (status) query = query.eq('status', status)
      const term = search ? safeSearch(search) : ''
      if (term) query = query.or(`reference.ilike.*${term}*,email.ilike.*${term}*,full_name.ilike.*${term}*`)
      const { data, error, count } = await query
      if (error) fail('admin quotes', error)
      type R = { reference: string; status: AdminQuoteRow['status']; full_name: string; email: string; company: string | null; city: string; created_at: string; clerk_user_id: string | null; quote_request_items: { count: number }[] }
      return {
        total: count ?? 0,
        rows: (data as R[]).map((r) => ({
          reference: r.reference,
          status: r.status,
          fullName: r.full_name,
          email: r.email,
          company: r.company,
          city: r.city,
          itemCount: r.quote_request_items?.[0]?.count ?? 0,
          owner: r.clerk_user_id ? 'account' : 'guest',
          createdAt: r.created_at,
        })),
      }
    },

    async adminGetQuote(reference) {
      const { data, error } = await db
        .from('quote_requests')
        .select(`${SUMMARY_COLUMNS}, full_name, email, phone, company, delivery_location, description, internal_notes, clerk_user_id, quote_events(status, note, actor, created_at)`)
        .eq('reference', reference)
        .maybeSingle()
      if (error) fail('admin quote', error)
      if (!data) return null
      const row = data as DetailRow & { internal_notes: string | null; clerk_user_id: string | null }
      return { ...toDetail(row), internalNotes: row.internal_notes, owner: row.clerk_user_id ? 'account' : 'guest', clerkUserId: row.clerk_user_id }
    },

    async adminUpdateQuote(reference, actor, status, note, internalNotes) {
      const { data, error } = await db.rpc('admin_update_quote', { p_reference: reference, p_actor: actor, p_status: status, p_note: note, p_internal_notes: internalNotes })
      if (error) fail('admin update quote', error)
      return data === true
    },

    async adminOverview() {
      const [{ data, error }, audit] = await Promise.all([
        db.rpc('admin_overview'),
        db.from('admin_audit_log').select('actor, action, entity, entity_key, created_at').order('created_at', { ascending: false }).limit(10),
      ])
      if (error) fail('overview', error)
      if (audit.error) fail('audit', audit.error)
      const recentAudit: AuditEntry[] = (audit.data as { actor: string; action: string; entity: string; entity_key: string; created_at: string }[]).map((a) => ({
        actor: a.actor,
        action: a.action,
        entity: a.entity,
        entityKey: a.entity_key,
        createdAt: a.created_at,
      }))
      return { ...(data as Omit<AdminOverview, 'recentAudit'>), recentAudit }
    },

    async adminCustomers() {
      const { data, error } = await db.rpc('admin_customers')
      if (error) fail('customers', error)
      type R = { clerk_user_id: string; full_name: string | null; email: string | null; company: string | null; quotes: number; last_quote_at: string | null; wishlist: number }
      return (data as R[]).map(
        (r): AdminCustomer => ({
          clerkUserId: r.clerk_user_id,
          fullName: r.full_name,
          email: r.email,
          company: r.company,
          quotes: Number(r.quotes),
          lastQuoteAt: r.last_quote_at,
          wishlist: Number(r.wishlist),
        }),
      )
    },

    async adminListMessages(status) {
      let query = db.from('contact_messages').select('id, full_name, email, phone, topic, message, status, clerk_user_id, created_at').order('created_at', { ascending: false }).limit(200)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) fail('messages', error)
      type R = { id: string; full_name: string; email: string; phone: string | null; topic: string; message: string; status: AdminMessage['status']; clerk_user_id: string | null; created_at: string }
      return (data as R[]).map((m) => ({ id: m.id, fullName: m.full_name, email: m.email, phone: m.phone, topic: m.topic, message: m.message, status: m.status, owner: m.clerk_user_id ? 'account' : 'guest', createdAt: m.created_at }))
    },

    async adminUpdateMessage(id, actor, status) {
      const { data, error } = await db.rpc('admin_update_message', { p_id: id, p_actor: actor, p_status: status })
      if (error) fail('update message', error)
      return data === true
    },

    async recordProductView(slug, visitorKey) {
      const { data, error } = await db.rpc('record_product_view', { p_slug: slug, p_visitor_key: visitorKey })
      if (error) fail('record view', error)
      return data === true
    },

    async productActivity(since) {
      const { data, error } = await db.rpc('admin_product_activity', { p_since: since })
      if (error) fail('product activity', error)
      const raw = data as ProductActivity
      return {
        views: raw.views.map((v) => ({ slug: v.slug, day: v.day, n: Number(v.n) })),
        quotes: raw.quotes.map((q) => ({ slug: q.slug, day: q.day, unit: q.unit, requests: Number(q.requests), quantity: q.quantity === null ? null : Number(q.quantity) })),
        viewTotals: raw.viewTotals.map((t) => ({ slug: t.slug, n: Number(t.n) })),
      }
    },

    async listResources({ includeUnpublished }) {
      let query = db.from('technical_resources').select('*').order('updated_at', { ascending: false }).limit(500)
      if (!includeUnpublished) query = query.eq('published', true)
      const { data, error } = await query
      if (error) fail('resources', error)
      return (data as ResourceRow[]).map(toResource)
    },

    async getResource(id) {
      const { data, error } = await db.from('technical_resources').select('*').eq('id', id).maybeSingle()
      if (error) fail('resource', error)
      return data ? toResource(data as ResourceRow) : null
    },

    async saveResource(actor, id, r) {
      const row = { title: r.title, summary: r.summary, kind: r.kind, product_slugs: r.productSlugs, published: r.published, storage_path: r.storagePath, file_name: r.fileName, file_size: r.fileSize }
      const query = id ? db.from('technical_resources').update(row).eq('id', id) : db.from('technical_resources').insert({ ...row, created_by: actor })
      const { data, error } = await query.select('*').maybeSingle()
      if (error) fail('save resource', error)
      if (!data) return null
      const saved = toResource(data as ResourceRow)
      await db.from('admin_audit_log').insert({ actor, action: id ? 'resource.update' : 'resource.create', entity: 'resource', entity_key: saved.id, details: { published: saved.published } })
      return saved
    },

    async deleteResource(actor, id) {
      const { data, error } = await db.from('technical_resources').delete().eq('id', id).select('*').maybeSingle()
      if (error) fail('delete resource', error)
      if (!data) return null
      await db.from('admin_audit_log').insert({ actor, action: 'resource.delete', entity: 'resource', entity_key: id, details: {} })
      return toResource(data as ResourceRow)
    },

    async listCoverage() {
      const { data, error } = await db.from('product_coverage').select('*')
      if (error) fail('coverage', error)
      return (data as CoverageRow[]).map(toCoverage)
    },

    async saveCoverage(actor, slug, c) {
      const { error } = await db.from('product_coverage').upsert({
        product_slug: slug,
        rate: c.rate,
        rate_unit: c.rateUnit,
        coats: c.coats,
        pack_amount: c.packAmount,
        pack_container: c.packContainer,
        source_resource_id: c.sourceResourceId,
        note: c.note ?? null,
        updated_by: actor,
        updated_at: new Date().toISOString(),
      })
      if (error?.code === '23503') return false
      if (error) fail('save coverage', error)
      await db.from('admin_audit_log').insert({ actor, action: 'coverage.update', entity: 'product', entity_key: slug, details: { rate: c.rate, unit: c.rateUnit } })
      return true
    },

    async deleteCoverage(actor, slug) {
      const { data, error } = await db.from('product_coverage').delete().eq('product_slug', slug).select('product_slug')
      if (error) fail('delete coverage', error)
      if (!data?.length) return false
      await db.from('admin_audit_log').insert({ actor, action: 'coverage.delete', entity: 'product', entity_key: slug, details: {} })
      return true
    },

    async hitRateLimit(key, windowSeconds, max) {
      const { data, error } = await db.rpc('quote_rate_limit_hit', { p_key: key, p_window_seconds: windowSeconds, p_max: max })
      if (error) fail('rate limit', error)
      return data === true
    },
  }
}
