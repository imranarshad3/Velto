import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createOrdersHandler } from '../server/orders.ts'
import type { AuthVerifier } from '../server/quotes/auth.js'

declare global {
  interface Response {
    // oxlint-disable-next-line typescript/no-explicit-any
    json(): Promise<any>
  }
}

const SITE = 'https://novaro.test'

const testOrders = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    reference: 'VEL-0000000000000001',
    clerk_user_id: 'user_cust_A',
    request_key: 'b0000000-0000-0000-0000-000000000001',
    customer: { name: 'Customer A', email: 'cust_a@example.com', phone: '+923001111111', address: '123 Street', city: 'Lahore', country: 'Pakistan' },
    items: [{ slug: 'tile-adhesive', name: 'Tile Adhesive', quantity: 2, unitPrice: 1500 }],
    subtotal: 3000,
    delivery: 300,
    total: 3300,
    currency: 'PKR',
    status: 'placed',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    reference: 'VEL-0000000000000002',
    clerk_user_id: 'user_cust_B',
    customer: { name: 'Customer B', email: 'cust_b@example.com', phone: '+923002222222', address: '456 Avenue', city: 'Karachi', country: 'Pakistan' },
    items: [{ slug: 'epoxy-grout', name: 'Epoxy Grout', quantity: 1, unitPrice: 2500 }],
    subtotal: 2500,
    delivery: 300,
    total: 2800,
    currency: 'PKR',
    status: 'shipped',
    estimated_delivery: '2026-10-25',
    created_at: new Date().toISOString(),
  },
]

function createMockDb(options: {
  admins?: string[]
  roles?: Record<string, 'admin' | 'editor' | 'sales'>
  rateLimitHits?: number
  rateLimitAllowed?: boolean
} = {}) {
  const admins = new Set(options.admins ?? ['user_admin', 'user_sales', 'user_editor'])
  const roles = options.roles ?? { user_admin: 'admin', user_sales: 'sales', user_editor: 'editor' }
  const orders = testOrders.map((o) => structuredClone(o))
  const calls: Record<string, unknown>[] = []
  let hitCount = 0

  // oxlint-disable-next-line typescript/no-explicit-any
  const client: any = {
    from: (table: string) => {
      const filters: Record<string,string> = {}
      let filterCol: string | null = null
      let filterVal: string | null = null

      // oxlint-disable-next-line typescript/no-explicit-any
      const chain: any = {
        select: () => chain,
        order: () => chain,
        limit: () => chain,
        eq: (col: string, val: string) => {
          filterCol = col
          filterVal = val
          filters[col] = val
          return chain
        },
        ilike: (col: string, val: string) => {
          filterCol = col
          filterVal = val
          return chain
        },
        maybeSingle: async () => {
          if (table === 'orders') {
            const found = orders.find((o) => {
              if (filterCol === 'reference') return o.reference === filterVal
              // oxlint-disable-next-line typescript/no-explicit-any
              if (filterCol === 'tracking_number') return (o as any).tracking_number === filterVal
              if (filterCol === 'id') return o.id === filterVal
              return false
            })
            return { data: found ?? null, error: null }
          }
          if (table === 'admin_members') {
            const has = admins.has(filterVal ?? '')
            return { data: has ? { clerk_user_id: filterVal } : null, error: null }
          }
          if (table === 'workspace_roles') {
            const role = roles[filterVal ?? ''] ?? 'admin'
            return { data: { role }, error: null }
          }
          return { data: null, error: null }
        },
        then: (resolve: (val: unknown) => void) => {
          if (table === 'orders') {
            const result = orders.filter(o => (!filters.clerk_user_id || o.clerk_user_id === filters.clerk_user_id) && (!filters.id || o.id === filters.id))
            resolve({ data: result, error: null })
          } else {
            resolve({ data: [], error: null })
          }
        },
      }
      return chain
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === 'quote_rate_limit_hit') {
        hitCount++
        if (options.rateLimitAllowed === false) return { data: false, error: null }
        if (options.rateLimitHits && hitCount > options.rateLimitHits) return { data: false, error: null }
        return { data: true, error: null }
      }
      if (fn === 'admin_update_order') {
        calls.push(args)
        // oxlint-disable-next-line typescript/no-explicit-any
        const order: any = orders.find((o) => o.id === args.p_id)
        if (!order) return { data: 'not_found', error: null }
        if (order.status !== args.p_expected) return { data: 'conflict', error: null }
        if (order.status === 'delivered' || order.status === 'cancelled') return { data: 'closed', error: null }
        order.status_history = [...(order.status_history ?? []), { kind: 'status', actor: args.p_actor, from: order.status, to: args.p_status, at: new Date().toISOString(), note: args.p_note ?? undefined, public: args.p_note ? args.p_note_public : undefined }]
        order.status = args.p_status as string
        if (args.p_status === 'shipped') order.tracking_number = 'VTABCDEF1234'
        return { data: 'ok', error: null }
      }
      if (fn === 'place_cod_order') {
        return {
          data: {
            id: 'a0000000-0000-0000-0000-000000000003',
            reference: 'VEL-0000000000000003',
            subtotal: 1500,
            delivery: 300,
            total: 1800,
          },
          error: null,
        }
      }
      return { data: null, error: null }
    },
  }
  client.calls = calls
  client.orders = orders
  return client
}

const verifyAuth: AuthVerifier = async (token) => {
  if (token === null) return { kind: 'guest' }
  if (token === 'token-admin') return { kind: 'user', userId: 'user_admin' }
  if (token === 'token-editor') return { kind: 'user', userId: 'user_editor' }
  if (token === 'token-sales') return { kind: 'user', userId: 'user_sales' }
  if (token === 'token-cust-A') return { kind: 'user', userId: 'user_cust_A' }
  if (token === 'token-cust-B') return { kind: 'user', userId: 'user_cust_B' }
  if (token === 'token-expired') return { kind: 'invalid', reason: 'expired' }
  return { kind: 'invalid', reason: 'rejected' }
}

describe('Orders API security & authorization', () => {
  it('rejects unauthenticated requests with 401 sign_in_required', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(new Request(`${SITE}/api/orders`, { method: 'GET' }))
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.equal(body.error, 'sign_in_required')
  })

  it('rejects expired tokens with 401 session_invalid', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(new Request(`${SITE}/api/orders`, { method: 'GET', headers: { authorization: 'Bearer token-expired' } }))
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.equal(body.error, 'session_invalid')
  })

  it('blocks disallowed cross-browser origins on mutations', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders`, {
        method: 'POST',
        headers: { authorization: 'Bearer token-cust-A', origin: 'https://evil.example', 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.error, 'forbidden_origin')
  })

  it('enforces customer isolation: customer A only receives their own orders', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(new Request(`${SITE}/api/orders`, { method: 'GET', headers: { authorization: 'Bearer token-cust-A' } }))
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(body.orders.length >= 1)
    for (const o of body.orders) {
      assert.equal(o.customer.email, 'cust_a@example.com')
      assert.equal(o.clerk_user_id, undefined, 'internal owner id is never exposed')
    }
  })

  it('prevents non-admin customer from accessing ?admin=1', async () => {
    const handler = createOrdersHandler({ db: createMockDb({ admins: ['user_admin'] }), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(new Request(`${SITE}/api/orders?admin=1`, { method: 'GET', headers: { authorization: 'Bearer token-cust-A' } }))
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.error, 'forbidden')
  })

  it('prevents non-admin customer from calling PATCH /api/orders', async () => {
    const handler = createOrdersHandler({ db: createMockDb({ admins: ['user_admin'] }), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders`, {
        method: 'PATCH',
        headers: { authorization: 'Bearer token-cust-A', 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'a0000000-0000-4000-8000-000000000001', expectedStatus: 'placed', status: 'shipped' }),
      }),
    )
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.error, 'forbidden')
  })

  it('BFLA defense: blocks team member with editor role from accessing GET /api/orders?admin=1', async () => {
    const handler = createOrdersHandler({
      db: createMockDb({ admins: ['user_admin', 'user_editor'], roles: { user_admin: 'admin', user_editor: 'editor' } }),
      verifyAuth,
      allowedOrigins: [SITE],
    })
    const res = await handler(new Request(`${SITE}/api/orders?admin=1`, { method: 'GET', headers: { authorization: 'Bearer token-editor' } }))
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.error, 'forbidden')
    assert.match(body.message, /team role/i)
  })

  it('BFLA defense: blocks team member with editor role from calling PATCH /api/orders', async () => {
    const handler = createOrdersHandler({
      db: createMockDb({ admins: ['user_admin', 'user_editor'], roles: { user_admin: 'admin', user_editor: 'editor' } }),
      verifyAuth,
      allowedOrigins: [SITE],
    })
    const res = await handler(
      new Request(`${SITE}/api/orders`, {
        method: 'PATCH',
        headers: { authorization: 'Bearer token-editor', 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'a0000000-0000-4000-8000-000000000001', expectedStatus: 'placed', status: 'shipped' }),
      }),
    )
    assert.equal(res.status, 403)
    const body = await res.json()
    assert.equal(body.error, 'forbidden')
    assert.match(body.message, /team role/i)
  })

  it('allows administrator to view all orders via GET /api/orders?admin=1', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(new Request(`${SITE}/api/orders?admin=1`, { method: 'GET', headers: { authorization: 'Bearer token-admin' } }))
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.orders.length, 2)
  })

  it('allows administrator to update order status via PATCH /api/orders', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders`, {
        method: 'PATCH',
        headers: { authorization: 'Bearer token-admin', 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'a0000000-0000-4000-8000-000000000001', expectedStatus: 'placed', status: 'delivered' }),
      }),
    )
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.ok, true)
  })

  it('rejects invalid order status in PATCH', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders`, {
        method: 'PATCH',
        headers: { authorization: 'Bearer token-admin', 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'a0000000-0000-4000-8000-000000000001', expectedStatus: 'placed', status: 'fraudulent' }),
      }),
    )
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.error, 'invalid')
  })

  it('enforces rate limits on GET and POST requests', async () => {
    const handler = createOrdersHandler({
      db: createMockDb({ rateLimitAllowed: false }),
      verifyAuth,
      allowedOrigins: [SITE],
      hashSecret: 'test-hash-secret-at-least-32-characters-long!!',
    })
    const res = await handler(new Request(`${SITE}/api/orders`, { method: 'GET', headers: { authorization: 'Bearer token-cust-A' } }))
    assert.equal(res.status, 429)
    const body = await res.json()
    assert.equal(body.error, 'rate_limited')
  })

  it('validates customer and items schema in POST /api/orders', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders`, {
        method: 'POST',
        headers: { authorization: 'Bearer token-cust-A', 'content-type': 'application/json' },
        body: JSON.stringify({ requestKey: 'bad-key', items: [] }),
      }),
    )
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.error, 'invalid')
  })

  it('allows authenticated customer to track own order by reference without contact', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders?reference=VEL-0000000000000001`, {
        method: 'GET',
        headers: { authorization: 'Bearer token-cust-A' },
      }),
    )
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.order.reference, 'VEL-0000000000000001')
    assert.equal(body.order.isOwner, true)
    assert.equal(body.order.customer.email, 'cust_a@example.com')
    assert.equal(body.order.tracking.estimatedDelivery, null)
    assert.equal(body.order.timeline[0].status, 'placed')
  })

  it('allows guest client to track order with valid reference and matching email', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders/track`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference: 'VEL-0000000000000001', contact: 'CUST_A@example.com' }),
      }),
    )
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.order.reference, 'VEL-0000000000000001')
    assert.equal(body.order.isOwner, false)
    assert.ok(body.order.customer.email.includes('••••'))
    assert.ok(body.order.customer.phone.includes('••••'))
  })

  it('allows guest client to track order with matching phone digits', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders/track`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference: 'VEL-0000000000000002', contact: '0300-222-2222' }),
      }),
    )
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.order.reference, 'VEL-0000000000000002')
    assert.equal(body.order.status, 'shipped')
    assert.equal(body.order.tracking.estimatedDelivery.earliest, '2026-10-25')
  })

  it('rejects guest tracking with wrong contact info (prevents enumeration)', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders/track`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference: 'VEL-0000000000000001', contact: 'wrong@example.com' }),
      }),
    )
    assert.equal(res.status, 404)
    const body = await res.json()
    assert.equal(body.error, 'not_found')
  })

  it('requires contact verification for guest tracking without contact', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(
      new Request(`${SITE}/api/orders/track`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference: 'VEL-0000000000000001' }),
      }),
    )
    assert.equal(res.status, 422)
    const body = await res.json()
    assert.equal(body.error, 'contact_required')
  })

  it('enforces rate limits on tracking requests', async () => {
    const handler = createOrdersHandler({
      db: createMockDb({ rateLimitAllowed: false }),
      verifyAuth,
      allowedOrigins: [SITE],
      hashSecret: 'test-hash-secret-at-least-32-characters-long!!',
    })
    const res = await handler(
      new Request(`${SITE}/api/orders/track`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference: 'VEL-0000000000000001', contact: 'cust_a@example.com' }),
      }),
    )
    assert.equal(res.status, 429)
    const body = await res.json()
    assert.equal(body.error, 'rate_limited')
  })
})

describe('single order detail access', () => {
 it('returns exactly the requested order for admin, and preserves customer isolation', async () => {
  const handler=createOrdersHandler({db:createMockDb(),verifyAuth,allowedOrigins:[SITE]})
  const id=testOrders[1].id
  const admin=await handler(new Request(`${SITE}/api/orders?admin=1&id=${id}`,{headers:{authorization:'Bearer token-admin'}}))
  assert.equal(admin.status,200)
  assert.deepEqual((await admin.json()).orders.map((o: {id:string})=>o.id),[id])
  const customer=await handler(new Request(`${SITE}/api/orders?id=${id}`,{headers:{authorization:'Bearer token-cust-A'}}))
  assert.equal(customer.status,200)
  assert.equal((await customer.json()).orders.length,0)
 })
})

const patch = (body: unknown, token = 'token-admin') =>
  new Request(`${SITE}/api/orders`, { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
const ORDER_A = 'a0000000-0000-4000-8000-000000000001'

describe('order tracking updates', () => {
  it('passes shipment details to the database and returns the refreshed order', async () => {
    const db = createMockDb()
    const handler = createOrdersHandler({ db, verifyAuth, allowedOrigins: [SITE] })
    const eta = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10)
    const res = await handler(patch({ id: ORDER_A, expectedStatus: 'placed', status: 'shipped', carrier: 'TCS', carrierReference: 'TCS-778899', estimatedDelivery: eta, note: 'Left warehouse', notePublic: true }))
    assert.equal(res.status, 200)
    assert.deepEqual(db.calls[0], { p_actor: 'user_admin', p_id: ORDER_A, p_expected: 'placed', p_status: 'shipped', p_note: 'Left warehouse', p_note_public: true, p_carrier: 'TCS', p_carrier_ref: 'TCS-778899', p_eta: eta })
  })

  it('returns 409 when the order changed since it was loaded', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const res = await handler(patch({ id: ORDER_A, expectedStatus: 'confirmed', status: 'shipped' }))
    assert.equal(res.status, 409)
    assert.equal((await res.json()).error, 'order_changed')
  })

  it('rejects closed orders, bad courier references and far-future dates', async () => {
    const handler = createOrdersHandler({ db: createMockDb(), verifyAuth, allowedOrigins: [SITE] })
    const second = 'a0000000-0000-4000-8000-000000000002'
    await handler(patch({ id: second, expectedStatus: 'shipped', status: 'delivered' }))
    const closed = await handler(patch({ id: second, expectedStatus: 'delivered', status: 'cancelled' }))
    assert.equal(closed.status, 409)
    assert.equal((await handler(patch({ id: ORDER_A, expectedStatus: 'placed', status: 'confirmed', carrierReference: 'bad ref!' }))).status, 422)
    assert.equal((await handler(patch({ id: ORDER_A, expectedStatus: 'placed', status: 'confirmed', estimatedDelivery: '2099-01-01' }))).status, 422)
    assert.equal((await handler(patch({ id: ORDER_A, expectedStatus: 'placed', status: 'confirmed', extra: 1 }))).status, 422)
  })

  it('customer views hide staff identities and internal notes', async () => {
    const db = createMockDb()
    const handler = createOrdersHandler({ db, verifyAuth, allowedOrigins: [SITE] })
    await handler(patch({ id: ORDER_A, expectedStatus: 'placed', status: 'confirmed', note: 'Customer is a VIP, call first', notePublic: false }))
    await handler(patch({ id: ORDER_A, expectedStatus: 'confirmed', status: 'shipped', note: 'On the way', notePublic: true }))
    const res = await handler(new Request(`${SITE}/api/orders?id=${ORDER_A}`, { headers: { authorization: 'Bearer token-cust-A' } }))
    const text = await res.text()
    assert.equal(res.status, 200)
    assert.doesNotMatch(text, /user_admin|VIP|actor/)
    const order = JSON.parse(text).orders[0]
    assert.deepEqual(order.timeline.map((e: { status: string }) => e.status), ['placed', 'confirmed', 'shipped'])
    assert.equal(order.timeline[2].note, 'On the way')
    assert.equal(order.tracking.number, 'VTABCDEF1234')
    const admin = await (await handler(new Request(`${SITE}/api/orders?admin=1&id=${ORDER_A}`, { headers: { authorization: 'Bearer token-admin' } }))).json()
    assert.equal(admin.orders[0].activity.length, 2)
    assert.equal(admin.orders[0].activity[0].note, 'Customer is a VIP, call first')
  })

  it('guests can track by tracking ID; wildcard or malformed references never match', async () => {
    const db = createMockDb()
    const handler = createOrdersHandler({ db, verifyAuth, allowedOrigins: [SITE] })
    await handler(patch({ id: ORDER_A, expectedStatus: 'placed', status: 'shipped' }))
    const track = (reference: string) => handler(new Request(`${SITE}/api/orders?action=track`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reference, contact: 'cust_a@example.com' }) }))
    const ok = await track('vtabcdef1234')
    assert.equal(ok.status, 200)
    const body = await ok.json()
    assert.equal(body.order.reference, 'VEL-0000000000000001')
    assert.match(body.order.customer.phone, /^•+1111$/)
    assert.equal((await track('VEL-%')).status, 404)
    assert.equal((await track('VEL-000000000000000_')).status, 404)
  })
})
