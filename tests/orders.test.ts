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
  const orders = [...testOrders]
  let hitCount = 0

  // oxlint-disable-next-line typescript/no-explicit-any
  const client: any = {
    from: (table: string) => {
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
          return chain
        },
        maybeSingle: async () => {
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
            const result = filterCol === 'clerk_user_id' ? orders.filter((o) => o.clerk_user_id === filterVal) : orders
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
      if (fn === 'update_cod_order') {
        const order = orders.find((o) => o.id === args.p_id)
        if (order) {
          order.status = args.p_status as string
          return { data: true, error: null }
        }
        return { data: false, error: null }
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
      assert.equal(o.clerk_user_id, 'user_cust_A')
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
        body: JSON.stringify({ id: 'a0000000-0000-4000-8000-000000000001', status: 'shipped' }),
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
        body: JSON.stringify({ id: 'a0000000-0000-4000-8000-000000000001', status: 'shipped' }),
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
        body: JSON.stringify({ id: 'a0000000-0000-4000-8000-000000000001', status: 'delivered' }),
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
        body: JSON.stringify({ id: 'a0000000-0000-4000-8000-000000000001', status: 'fraudulent' }),
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
})
