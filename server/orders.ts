import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClerkVerifier, type AuthVerifier } from './quotes/auth.js'
import { withDevAuth } from './quotes/config.js'
import { hmac } from './quotes/crypto.js'
import { apiError, bearerToken, clientIp, HttpError, json, readJson } from './http.js'
import { sessionInvalid } from './quotes/handlers.js'
import { orderInput } from '../src/features/orders/schema.js'
import { customerTimeline, deliveryWindow, orderStatuses, REFERENCE_PATTERN, TRACKING_PATTERN, type HistoryEvent } from '../src/features/orders/tracking.js'
import { createClerkDirectory, withDevDirectory, type UserDirectory } from './quotes/directory.js'

const WINDOW_SECONDS = 600
const ORDER_LIMITS = { ordersPerUser: 30, ordersPerIp: 60, getPerUser: 300, trackPerIp: 60 }

function maskAddress(addr?: string): string {
  if (!addr) return ''
  const parts = addr.split(',')
  if (parts.length > 1) {
    return `••••, ${parts[parts.length - 1].trim()}`
  }
  return addr.length > 8 ? `${addr.slice(0, 4)}••••` : '••••'
}

function maskPhone(phone?: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '••••'
  return `•••••••${digits.slice(-4)}`
}

function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '••••'
  const [local, domain] = email.split('@')
  return `${local.slice(0, 2)}••••@${domain}`
}

const ORDER_COLUMNS = 'id,reference,clerk_user_id,customer,items,subtotal,delivery,total,currency,payment_method,status,status_history,created_at,updated_at,tracking_number,carrier,carrier_reference,estimated_delivery'

// oxlint-disable-next-line typescript/no-explicit-any
type OrderRow = Record<string, any>

/** Shipment details shared by every view. */
function trackingOf(order: OrderRow) {
  return {
    number: order.tracking_number ?? null,
    carrier: order.carrier ?? null,
    carrierReference: order.carrier_reference ?? null,
    estimatedDelivery: order.status === 'cancelled' ? null : deliveryWindow(order.created_at, order.estimated_delivery),
  }
}

/** Customer-facing order: staff identities and internal notes are never included. */
function customerView(order: OrderRow, reveal: boolean) {
  const c = order.customer ?? {}
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at ?? order.created_at,
    currency: order.currency ?? 'PKR',
    subtotal: order.subtotal,
    delivery: order.delivery ?? 300,
    total: order.total,
    payment_method: order.payment_method ?? 'cod',
    customer: {
      name: c.name,
      city: c.city,
      country: c.country,
      address: reveal ? c.address : maskAddress(c.address),
      phone: reveal ? c.phone : maskPhone(c.phone),
      email: reveal ? c.email : maskEmail(c.email),
    },
    items: order.items ?? [],
    tracking: trackingOf(order),
    timeline: customerTimeline(order.created_at, order.status_history),
    isOwner: reveal,
  }
}

/** Admin view: full details plus the activity log with actor names when the directory can resolve them. */
function adminView(order: OrderRow, names: Map<string, { name: string | null; email: string | null }> = new Map()) {
  const history = (Array.isArray(order.status_history) ? order.status_history : []) as HistoryEvent[]
  return {
    ...customerView(order, true),
    activity: history.map((e) => ({
      kind: e.kind ?? 'status',
      from: e.from ?? null,
      to: e.to ?? null,
      at: e.at,
      note: e.note ?? null,
      notePublic: Boolean(e.public),
      carrier: e.carrier ?? null,
      carrierReference: e.carrierReference ?? null,
      eta: e.eta ?? null,
      actor: e.actor ? (names.get(e.actor)?.name ?? names.get(e.actor)?.email ?? 'Team member') : 'System',
    })),
  }
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'Invalid date')
const updateInput = z.object({
  id: z.uuid(),
  expectedStatus: z.enum(orderStatuses),
  status: z.enum(orderStatuses),
  note: z.string().trim().max(500).optional(),
  notePublic: z.boolean().optional(),
  carrier: z.string().trim().max(60).refine((v) => v === '' || v.length >= 2, 'Carrier is too short').optional(),
  carrierReference: z.string().trim().regex(/^([A-Za-z0-9-]{3,40})?$/).optional(),
  estimatedDelivery: isoDate.nullable().optional(),
}).strict()

export interface OrdersHandlerDeps {
  db?: SupabaseClient
  verifyAuth?: AuthVerifier
  allowedOrigins?: string[]
  hashSecret?: string
  directory?: UserDirectory | null
}

export function createOrdersHandler(deps: OrdersHandlerDeps = {}) {
  return async function handle(request: Request) {
    try {
      const env = process.env
      const url = new URL(request.url)
      const allowedOrigins = deps.allowedOrigins ?? [url.origin, ...(env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)]
      const origin = request.headers.get('origin')
      if (request.method !== 'GET' && origin && !allowedOrigins.includes(origin)) {
        return apiError(403, 'forbidden_origin', 'This request is not allowed.')
      }

      const verify = deps.verifyAuth ?? withDevAuth(
        env,
        createClerkVerifier({
          secretKey: env.CLERK_SECRET_KEY,
          jwtKey: env.CLERK_JWT_KEY,
          authorizedParties: (env.CLERK_AUTHORIZED_PARTIES ?? '').split(',').map((s) => s.trim()).filter(Boolean),
        }),
      )
      const auth = await verify(bearerToken(request), url.origin)
      if (auth.kind === 'invalid') return sessionInvalid(auth.reason)

      const isTrack = url.pathname.endsWith('/track') || url.searchParams.has('track') || url.searchParams.has('reference') || url.searchParams.get('action') === 'track'
      if (!isTrack && auth.kind === 'guest') return apiError(401, 'sign_in_required', 'Please sign in to manage your orders.')

      let db = deps.db
      if (!db) {
        const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
        if (!env.SUPABASE_URL || !secret) return apiError(503, 'unavailable', 'Ordering is temporarily unavailable.')
        db = createClient(env.SUPABASE_URL, secret, { auth: { persistSession: false } })
      }

      const hashSecret = deps.hashSecret ?? env.QUOTE_HASH_SECRET ?? ''
      const ip = clientIp(request)
      const rateLimit = async (kind: string, id: string, max: number) => {
        if (!hashSecret) return true
        const key = hmac(hashSecret, `${kind}:${id}`)
        const { data } = await db.rpc('quote_rate_limit_hit', { p_key: key, p_window_seconds: WINDOW_SECONDS, p_max: max })
        return data === true
      }

      const adminRequested = url.searchParams.get('admin') === '1'
      const isPatch = request.method === 'PATCH'
      let isAdminUser = false

      if (adminRequested || isPatch) {
        if (auth.kind !== 'user') return apiError(401, 'sign_in_required', 'Please sign in.')
        const { data: member, error } = await db.from('admin_members').select('clerk_user_id').eq('clerk_user_id', auth.userId).maybeSingle()
        if (error || !member) return apiError(403, 'forbidden', 'Admin access required.')

        // Enforce function-level and role-based access control: editors cannot access or modify customer orders
        const { data: roleRow, error: roleError } = await db.from('workspace_roles').select('role').eq('clerk_user_id', auth.userId).maybeSingle()
        if (roleError) return apiError(503, 'unavailable', 'Could not verify team permissions.')
        const role = roleRow?.role ?? 'admin'
        if (role === 'editor') return apiError(403, 'forbidden', 'Your team role does not permit access to orders.')

        isAdminUser = true
      }

      const trackDb = db
      async function handleTrackLookup(reference: string, contact?: string) {
        if (!reference || reference.length < 3 || reference.length > 64) {
          return apiError(422, 'invalid', 'Enter a valid order reference.')
        }

        const notFound = () => apiError(404, 'not_found', 'No order found matching this reference and contact information.')
        // Exact match only (never a pattern), on an order reference or a VELTO tracking ID.
        const key = reference.trim().toUpperCase()
        const column = REFERENCE_PATTERN.test(key) ? 'reference' : TRACKING_PATTERN.test(key) ? 'tracking_number' : null
        if (!column) return notFound()

        const { data: order, error } = await trackDb.from('orders').select(ORDER_COLUMNS).eq(column, key).maybeSingle()

        if (error || !order) return notFound()

        let isOwnerOrAdmin = false
        if (auth.kind === 'user') {
          if (order.clerk_user_id === auth.userId) {
            isOwnerOrAdmin = true
          } else {
            const { data: member } = await trackDb.from('admin_members').select('clerk_user_id').eq('clerk_user_id', auth.userId).maybeSingle()
            if (member) isOwnerOrAdmin = true
          }
        }

        if (!isOwnerOrAdmin) {
          if (!contact) {
            return apiError(422, 'contact_required', 'Please provide the email address or phone number used at checkout to track this order.')
          }
          const cleanedContact = contact.trim().toLowerCase()
          const customerEmail = (order.customer?.email ?? '').trim().toLowerCase()
          const normalizePhone = (value: string) => value.replace(/\D/g, '').replace(/^0092/, '92').replace(/^0(?=3\d{9}$)/, '92')
          const customerPhoneDigits = normalizePhone(order.customer?.phone ?? '')
          const contactDigits = normalizePhone(cleanedContact)

          const emailMatches = Boolean(customerEmail && customerEmail === cleanedContact)
          const phoneMatches = Boolean(
            contactDigits.length >= 7 &&
            customerPhoneDigits.length >= 7 &&
            customerPhoneDigits === contactDigits
          )

          if (!emailMatches && !phoneMatches) {
            return notFound()
          }
        }

        return json({ order: customerView(order, isOwnerOrAdmin) })
      }

      if (request.method === 'GET') {
        const trackRef = url.searchParams.get('reference')?.trim()
        if (trackRef) {
          if (!(await rateLimit('orders-track-ip', ip, ORDER_LIMITS.trackPerIp))) {
            return apiError(429, 'rate_limited', 'Too many tracking requests. Please wait a few minutes and try again.')
          }
          const contact = url.searchParams.get('contact')?.trim()
          return handleTrackLookup(trackRef, contact)
        }

        if (auth.kind === 'guest') return apiError(401, 'sign_in_required', 'Please sign in to manage your orders.')
        if (!(await rateLimit('orders-get-user', auth.userId, ORDER_LIMITS.getPerUser))) {
          return apiError(429, 'rate_limited', 'Too many requests. Please wait a few minutes and try again.')
        }
        const orderId = url.searchParams.get('id')
        if (orderId && !z.uuid().safeParse(orderId).success) return apiError(422, 'invalid', 'Invalid order reference.')
        let query = db.from('orders').select(ORDER_COLUMNS).order('created_at', { ascending: false }).limit(isAdminUser ? 500 : 100)
        if (!isAdminUser) query = query.eq('clerk_user_id', auth.userId)
        if (orderId) query = query.eq('id', orderId)
        const { data, error } = await query
        if (error) throw new Error('orders_read')
        const rows = (data ?? []) as OrderRow[]
        if (!isAdminUser) return json({ orders: rows.map((o) => customerView(o, true)) })
        let names = new Map<string, { name: string | null; email: string | null }>()
        if (orderId && rows[0]) {
          const actors = [...new Set(((rows[0].status_history ?? []) as HistoryEvent[]).map((e) => e.actor).filter((a): a is string => !!a))]
          const directory = deps.directory !== undefined ? deps.directory : env.NOVARO_DEV_FAKE_AUTH === '1' && !env.VERCEL ? withDevDirectory(createClerkDirectory(env.CLERK_SECRET_KEY)) : createClerkDirectory(env.CLERK_SECRET_KEY)
          try {
            if (directory && actors.length) names = await directory.describe(actors)
          } catch {
            // Names are a convenience; the log still shows "Team member".
          }
        }
        return json({ orders: rows.map((o) => adminView(o, names)) })
      }

      if (request.method === 'PATCH') {
        if (!isAdminUser || auth.kind !== 'user') return apiError(403, 'forbidden', 'Admin access required.')
        const parsed = updateInput.safeParse(await readJson(request, 4096))
        if (!parsed.success) return apiError(422, 'invalid', 'Check the status and shipment details.')
        const u = parsed.data
        if (u.estimatedDelivery) {
          const eta = Date.parse(`${u.estimatedDelivery}T00:00:00Z`)
          if (eta < Date.now() - 86_400_000 || eta > Date.now() + 90 * 86_400_000) return apiError(422, 'invalid', 'Choose a delivery date from today up to 90 days ahead.')
        }
        const { data, error } = await db.rpc('admin_update_order', {
          p_actor: auth.userId,
          p_id: u.id,
          p_expected: u.expectedStatus,
          p_status: u.status,
          p_note: u.note || null,
          p_note_public: u.notePublic ?? false,
          p_carrier: u.carrier || null,
          p_carrier_ref: u.carrierReference || null,
          p_eta: u.estimatedDelivery ?? null,
        })
        if (error?.message.includes('cancelled_order_closed')) return apiError(409, 'order_closed', 'Cancelled orders cannot be reopened. Create a new order instead.')
        if (error) throw new Error('orders_update')
        if (data === 'not_found') return apiError(404, 'not_found', 'Order not found.')
        if (data === 'conflict') return apiError(409, 'order_changed', 'This order was updated by someone else. Refresh to see the latest status.')
        if (data === 'closed') return apiError(409, 'order_closed', 'Delivered and cancelled orders are closed.')
        if (data === 'invalid_transition') return apiError(422, 'invalid_transition', 'Orders can only move forward through the delivery steps.')
        if (data !== 'ok') throw new Error('orders_update')
        const { data: fresh, error: readError } = await db.from('orders').select(ORDER_COLUMNS).eq('id', u.id).maybeSingle()
        if (readError || !fresh) return json({ ok: true })
        return json({ ok: true, order: adminView(fresh as OrderRow) })
      }

      if (request.method === 'POST') {
        const isTrackPost = url.pathname.endsWith('/track') || url.searchParams.get('action') === 'track'
        const body = await readJson(request, 16000)

        if (isTrackPost || (body && typeof body === 'object' && ('reference' in body) && !('items' in body))) {
          if (!(await rateLimit('orders-track-ip', ip, ORDER_LIMITS.trackPerIp))) {
            return apiError(429, 'rate_limited', 'Too many tracking requests. Please wait a few minutes and try again.')
          }
          const parsedTrack = z.object({
            reference: z.string().trim().min(3).max(64),
            contact: z.string().trim().min(3).max(200).optional(),
          }).safeParse(body)
          if (!parsedTrack.success) return apiError(422, 'invalid', 'Enter a valid order reference.')
          return handleTrackLookup(parsedTrack.data.reference, parsedTrack.data.contact)
        }

        if (auth.kind === 'guest') return apiError(401, 'sign_in_required', 'Please sign in to manage your orders.')
        if (isAdminUser) return apiError(400, 'invalid', 'Order placement is for customers only.')
        if (!(await rateLimit('orders-post-ip', ip, ORDER_LIMITS.ordersPerIp)) || !(await rateLimit('orders-post-user', auth.userId, ORDER_LIMITS.ordersPerUser))) {
          return apiError(429, 'rate_limited', 'Too many requests. Please wait a few minutes and try again.')
        }
        const parsed = orderInput.safeParse(body)
        if (!parsed.success) return apiError(422, 'invalid', 'Check your delivery details and quantities.')
        const p = parsed.data
        const { data, error } = await db.rpc('place_cod_order', { p_user: auth.userId, p_key: p.requestKey, p_customer: p.customer, p_items: p.items, p_expected: p.expectedTotal })
        if (error) {
          if (/price_changed|product_unavailable|insufficient_stock/.test(error.message)) return apiError(409, 'cart_changed', 'A price, product or available quantity changed. Refresh your cart before ordering.')
          if (/order_limit/.test(error.message)) return apiError(429, 'order_limit', 'Daily order limit reached. Please contact us.')
          throw new Error('orders_create')
        }
        return json({ order: data }, 201)
      }

      return apiError(405, 'method', 'Method not allowed.')
    } catch (e) {
      if (e instanceof HttpError) return apiError(e.status, e.code, e.message)
      return apiError(503, 'unavailable', 'Orders are temporarily unavailable. Your cart is saved; please retry.')
    }
  }
}

const defaultHandler = createOrdersHandler()
export const GET = defaultHandler
export const POST = defaultHandler
export const PATCH = defaultHandler
