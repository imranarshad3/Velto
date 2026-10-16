import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClerkVerifier, type AuthVerifier } from './quotes/auth.js'
import { withDevAuth } from './quotes/config.js'
import { hmac } from './quotes/crypto.js'
import { apiError, bearerToken, clientIp, HttpError, json, readJson } from './http.js'
import { sessionInvalid } from './quotes/handlers.js'
import { orderInput } from '../src/features/orders/schema.js'

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

function computeEstimatedDelivery(createdAt: string, status: string): { earliest: string; latest: string; label: string } {
  const created = new Date(createdAt)
  const earliest = new Date(created.getTime() + 2 * 24 * 60 * 60 * 1000)
  const latest = new Date(created.getTime() + 4 * 24 * 60 * 60 * 1000)
  const format = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (status === 'delivered') return { earliest: earliest.toISOString(), latest: latest.toISOString(), label: 'Delivered' }
  if (status === 'cancelled') return { earliest: '', latest: '', label: 'Order Cancelled' }
  return { earliest: earliest.toISOString(), latest: latest.toISOString(), label: `${format(earliest)} – ${format(latest)}` }
}

export interface OrdersHandlerDeps {
  db?: SupabaseClient
  verifyAuth?: AuthVerifier
  allowedOrigins?: string[]
  hashSecret?: string
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
        const { data: member, error } = await db.from('admin_members').select('clerk_user_id').eq('clerk_user_id', auth.userId).maybeSingle()
        if (error || !member) return apiError(403, 'forbidden', 'Admin access required.')

        // Enforce function-level and role-based access control: editors cannot access or modify customer orders
        const { data: roleRow, error: roleError } = await db.from('workspace_roles').select('role').eq('clerk_user_id', auth.userId).maybeSingle()
        if (roleError) return apiError(503, 'unavailable', 'Could not verify team permissions.')
        const role = roleRow?.role ?? 'admin'
        if (role === 'editor') return apiError(403, 'forbidden', 'Your team role does not permit access to orders.')

        isAdminUser = true
      }

      async function handleTrackLookup(reference: string, contact?: string) {
        if (!reference || reference.length < 3 || reference.length > 64) {
          return apiError(422, 'invalid', 'Enter a valid order reference.')
        }

        const notFound = () => apiError(404, 'not_found', 'No order found matching this reference and contact information.')

        const { data: order, error } = await db
          .from('orders')
          .select('id,reference,clerk_user_id,customer,items,subtotal,delivery,total,currency,payment_method,status,status_history,created_at')
          .ilike('reference', reference)
          .maybeSingle()

        if (error || !order) return notFound()

        let isOwnerOrAdmin = false
        if (auth.kind === 'user') {
          if (order.clerk_user_id === auth.userId) {
            isOwnerOrAdmin = true
          } else {
            const { data: member } = await db.from('admin_members').select('clerk_user_id').eq('clerk_user_id', auth.userId).maybeSingle()
            if (member) isOwnerOrAdmin = true
          }
        }

        if (!isOwnerOrAdmin) {
          if (!contact) {
            return apiError(422, 'contact_required', 'Please provide the email address or phone number used at checkout to track this order.')
          }
          const cleanedContact = contact.trim().toLowerCase()
          const customerEmail = (order.customer?.email ?? '').trim().toLowerCase()
          const customerPhoneDigits = (order.customer?.phone ?? '').replace(/\D/g, '')
          const contactDigits = cleanedContact.replace(/\D/g, '')

          const emailMatches = Boolean(customerEmail && customerEmail === cleanedContact)
          const phoneMatches = Boolean(
            contactDigits.length >= 7 &&
            customerPhoneDigits.length >= 7 &&
            (customerPhoneDigits.endsWith(contactDigits) || contactDigits.endsWith(customerPhoneDigits))
          )

          if (!emailMatches && !phoneMatches) {
            return notFound()
          }
        }

        return json({
          order: {
            id: order.id,
            reference: order.reference,
            status: order.status,
            status_history: order.status_history ?? [],
            created_at: order.created_at,
            currency: order.currency ?? 'PKR',
            subtotal: order.subtotal,
            delivery: order.delivery ?? 300,
            total: order.total,
            payment_method: order.payment_method ?? 'cod',
            customer: {
              name: order.customer.name,
              city: order.customer.city,
              country: order.customer.country,
              address: isOwnerOrAdmin ? order.customer.address : maskAddress(order.customer.address),
              phone: isOwnerOrAdmin ? order.customer.phone : maskPhone(order.customer.phone),
              email: isOwnerOrAdmin ? order.customer.email : maskEmail(order.customer.email),
            },
            items: order.items,
            isOwner: isOwnerOrAdmin,
            estimatedDelivery: computeEstimatedDelivery(order.created_at, order.status),
          },
        })
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
        let query = db.from('orders').select('id,reference,customer,items,subtotal,delivery,total,currency,status,created_at').order('created_at', { ascending: false }).limit(100)
        if (!isAdminUser) query = query.eq('clerk_user_id', auth.userId)
        const { data, error } = await query
        if (error) throw new Error('orders_read')
        return json({ orders: data })
      }

      if (request.method === 'PATCH') {
        if (!isAdminUser) return apiError(403, 'forbidden', 'Admin access required.')
        const parsed = z.object({ id: z.string().uuid(), status: z.enum(['placed', 'confirmed', 'shipped', 'delivered', 'cancelled']) }).strict().safeParse(await readJson(request, 2048))
        if (!parsed.success) return apiError(422, 'invalid', 'Choose a valid order status.')
        const { data, error } = await db.rpc('update_cod_order', { p_actor: auth.userId, p_id: parsed.data.id, p_status: parsed.data.status })
        if (error?.message.includes('cancelled_order_closed')) return apiError(409, 'order_closed', 'Cancelled orders cannot be reopened. Create a new order instead.')
        if (error) throw new Error('orders_update')
        return data ? json({ ok: true }) : apiError(404, 'not_found', 'Order not found.')
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
