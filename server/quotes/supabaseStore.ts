import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AdminCustomer, AdminMessage, AdminOverview, AdminProduct, AdminQuoteRow, AuditEntry } from '../../src/features/admin/types.js'
import type { ProductData } from '../../src/features/catalog/productSchema.js'
import type { QuoteDetail, QuoteEvent, QuoteSummary } from '../../src/features/quotes/schema.js'
import type { DataStore } from './store.js'

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
  sort_order: number
  updated_at: string
}

const toProduct = (r: ProductRow): AdminProduct => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  categorySlug: r.category_slug,
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
  sortOrder: r.sort_order,
  updatedAt: r.updated_at,
})

const productPayload = (d: ProductData) => ({
  name: d.name,
  category_slug: d.categorySlug,
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
function fail(operation: string, error: { code?: string } | null): never {
  throw new Error(`supabase ${operation} failed (${error?.code ?? 'unknown'})`)
}

/** Server-only store using the Supabase secret key (bypasses RLS; never ship to the browser). */
export function createSupabaseStore(url: string, secretKey: string): DataStore {
  const db: SupabaseClient = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return {
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

    async saveProduct(actor, slug, data, create) {
      const { data: ok, error } = await db.rpc('admin_save_product', { p_actor: actor, p_slug: slug, p_product: productPayload(data), p_create: create })
      if (error?.code === '23505') return 'conflict'
      if (error) fail('save product', error)
      return ok ? 'ok' : 'not_found'
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

    async hitRateLimit(key, windowSeconds, max) {
      const { data, error } = await db.rpc('quote_rate_limit_hit', { p_key: key, p_window_seconds: windowSeconds, p_max: max })
      if (error) fail('rate limit', error)
      return data === true
    },
  }
}
