import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { AuthVerifier } from '../server/quotes/auth.js'
import { hmac } from '../server/quotes/crypto.js'
import { createApiHandlers, LIMITS, type ApiHandlerDeps } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'

// Test-only: read JSON bodies loosely; assertions check the shapes.
declare global {
  interface Response {
    // oxlint-disable-next-line typescript/no-explicit-any
    json(): Promise<any>
  }
}

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const NOW = 1_800_000_000_000

const verifyAuth: AuthVerifier = async (token) => {
  if (token === null) return { kind: 'guest' }
  if (token === 'token-A') return { kind: 'user', userId: 'user_A' }
  if (token === 'token-B') return { kind: 'user', userId: 'user_B' }
  if (token === 'token-admin') return { kind: 'user', userId: 'user_admin' }
  return { kind: 'invalid' }
}

const valid = {
  fullName: 'Asha Builder',
  email: 'Asha@Example.com ',
  phone: '+92 300 1234567',
  items: [
    { productSlug: 'tile-adhesive', quantity: 40, quantityUnit: 'bags' },
    { productSlug: 'epoxy-grout' },
  ],
  projectType: 'residential',
  city: 'Lahore',
  description: 'Tiling two bathrooms and a kitchen floor.',
  consent: true,
  website: '',
  startedAt: NOW - 60_000,
}

let store: ReturnType<typeof createMemoryStore>
let handlers: ReturnType<typeof createApiHandlers>
let ipCounter = 0

function setup(overrides: Partial<ApiHandlerDeps> = {}) {
  store = createMemoryStore({ admins: ['user_admin'] })
  handlers = createApiHandlers({
    store,
    verifyAuth,
    hashSecret: SECRET,
    knownProducts: async () => new Set(['tile-adhesive', 'epoxy-grout']),
    allowedOrigins: ['https://novaro.example'],
    now: () => NOW,
    ...overrides,
  })
}

function request(url: string, body?: unknown, { token, ip, headers = {}, method = 'POST' }: { token?: string; ip?: string; headers?: Record<string, string>; method?: string } = {}) {
  return new Request(`https://novaro.example${url}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      'x-forwarded-for': ip ?? `203.0.113.${++ipCounter % 250}`,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const submit = (body: unknown, options?: Parameters<typeof request>[2]) => handlers.submit(request('/api/quotes', body, options))

describe('POST /api/quotes', () => {
  beforeEach(() => setup())

  it('accepts a guest quote, returns a one-time token and stores only its keyed hash', async () => {
    const res = await submit(valid)
    assert.equal(res.status, 201)
    assert.equal(res.headers.get('cache-control'), 'no-store')
    const body = await res.json()
    assert.match(body.reference, /^NQ-[0-9A-F]{12}$/)
    assert.equal(body.status, 'submitted')
    assert.match(body.guestToken, /^[A-Za-z0-9_-]{43}$/)
    const row = store.rows[0]
    assert.equal(row.clerkUserId, null)
    assert.equal(row.guestTokenHash, hmac(SECRET, `guest:${body.guestToken}`))
    assert.ok(!JSON.stringify(row).includes(body.guestToken), 'raw token must not be stored')
    assert.equal(row.email, 'asha@example.com', 'email normalised')
    assert.deepEqual(Object.keys(body).sort(), ['createdAt', 'guestToken', 'reference', 'status'])
  })

  it('assigns ownership only from the verified token and ignores forged body identity', async () => {
    const res = await submit({ ...valid, clerkUserId: 'user_B', userId: 'user_B', clerk_user_id: 'user_B', status: 'quoted' }, { token: 'token-A' })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.equal(body.guestToken, undefined, 'signed-in users get no guest token')
    assert.equal(store.rows[0].clerkUserId, 'user_A')
    assert.equal(store.rows[0].guestTokenHash, null)
    assert.equal(store.rows[0].status, 'submitted')
  })

  it('treats forged identity fields from guests as guest submissions', async () => {
    const res = await submit({ ...valid, clerkUserId: 'user_A' })
    assert.equal(res.status, 201)
    assert.equal(store.rows[0].clerkUserId, null)
  })

  it('rejects an expired/invalid Clerk session without saving', async () => {
    const res = await submit(valid, { token: 'expired-token' })
    assert.equal(res.status, 401)
    assert.equal((await res.json()).error, 'session_invalid')
    assert.equal(store.rows.length, 0)
  })

  it('returns field errors for invalid input', async () => {
    const res = await submit({ ...valid, email: 'not-an-email', description: 'short', phone: 'call me', consent: false, items: [{ productSlug: 'tile-adhesive', quantity: 4 }] })
    assert.equal(res.status, 422)
    const { fieldErrors } = await res.json()
    for (const field of ['email', 'description', 'phone', 'consent', 'items.0.quantityUnit']) assert.ok(fieldErrors[field], `${field} error`)
    assert.equal(store.rows.length, 0)
  })

  it('rejects oversized descriptions and unknown products', async () => {
    let res = await submit({ ...valid, description: 'x'.repeat(5001) })
    assert.equal(res.status, 422)
    assert.ok((await res.json()).fieldErrors.description)
    res = await submit({ ...valid, items: [{ productSlug: 'tile-adhesive' }, { productSlug: 'ultra-fake-sku' }] })
    assert.equal(res.status, 422)
    assert.ok((await res.json()).fieldErrors['items.1.productSlug'])
    res = await submit({ ...valid, items: [{ productSlug: '../../etc' }] })
    assert.equal(res.status, 422)
  })

  it('rejects duplicate products and more than 20 items', async () => {
    let res = await submit({ ...valid, items: [{ productSlug: 'tile-adhesive' }, { productSlug: 'tile-adhesive' }] })
    assert.equal(res.status, 422)
    assert.ok((await res.json()).fieldErrors.items)
    res = await submit({ ...valid, items: Array.from({ length: 21 }, () => ({ productSlug: 'tile-adhesive' })) })
    assert.equal(res.status, 422)
    assert.equal(store.rows.length, 0)
  })

  it('stores items in order and allows general enquiries without items', async () => {
    assert.equal((await submit(valid)).status, 201)
    assert.deepEqual(store.rows[0].items, [
      { productSlug: 'tile-adhesive', quantity: 40, quantityUnit: 'bags' },
      { productSlug: 'epoxy-grout', quantity: null, quantityUnit: null },
    ])
    assert.equal((await submit({ ...valid, items: [] })).status, 201)
    assert.equal((await submit({ ...valid, items: undefined })).status, 201)
  })

  it('rejects honeypot and too-fast submissions', async () => {
    assert.equal((await submit({ ...valid, website: 'http://spam' })).status, 400)
    assert.equal((await submit({ ...valid, startedAt: NOW - 500 })).status, 400)
    assert.equal(store.rows.length, 0)
  })

  it('enforces body size, content type and JSON validity', async () => {
    assert.equal((await submit({ ...valid, company: 'x'.repeat(17_000) })).status, 413)
    assert.equal((await handlers.submit(request('/api/quotes', 'a=b', { headers: { 'content-type': 'text/plain' } }))).status, 415)
    assert.equal((await submit('{not json')).status, 400)
  })

  it('rate limits repeated submissions from one IP', async () => {
    for (let i = 0; i < LIMITS.submitPerIp; i++) assert.equal((await submit(valid, { ip: '198.51.100.7' })).status, 201)
    const res = await submit(valid, { ip: '198.51.100.7' })
    assert.equal(res.status, 429)
    assert.ok(res.headers.get('retry-after'))
    assert.equal(store.rows.length, LIMITS.submitPerIp)
  })

  it('blocks disallowed browser origins', async () => {
    assert.equal((await submit(valid, { headers: { origin: 'https://evil.example' } })).status, 403)
    assert.equal((await submit(valid, { headers: { origin: 'https://novaro.example' } })).status, 201)
  })

  it('requires the human check when configured', async () => {
    setup({ humanCheck: async (token) => token === 'pass' })
    assert.equal((await submit(valid)).status, 400)
    assert.equal((await submit({ ...valid, turnstileToken: 'pass' })).status, 201)
  })

  it('answers 503 when no database is configured', async () => {
    setup({ store: null })
    assert.equal((await submit(valid)).status, 503)
  })

  it('hides internal errors and never logs PII', async () => {
    setup()
    store.insert = async () => {
      throw new Error('supabase insert failed (23514)')
    }
    const logged: string[] = []
    const original = console.error
    console.error = (...args: unknown[]) => logged.push(args.join(' '))
    try {
      const res = await submit(valid)
      assert.equal(res.status, 500)
      const text = await res.text()
      assert.ok(!text.includes('23514') && !text.includes('supabase'))
    } finally {
      console.error = original
    }
    assert.ok(logged.length > 0)
    assert.ok(logged.every((line) => !line.includes('asha') && !line.includes('300 1234567')))
  })
})

describe('GET /api/my/quotes', () => {
  beforeEach(() => setup())
  const list = (token?: string) => handlers.myQuotes(request('/api/my/quotes', undefined, { token, method: 'GET' }))

  it('requires a signed-in user', async () => {
    assert.equal((await list()).status, 401)
    assert.equal((await list('expired-token')).status, 401)
  })

  it('returns only the caller’s quotes, without private fields', async () => {
    await submit(valid, { token: 'token-A' })
    await submit({ ...valid, city: 'Karachi' }, { token: 'token-B' })
    await submit(valid) // guest

    const res = await list('token-A')
    assert.equal(res.status, 200)
    const { quotes } = await res.json()
    assert.equal(quotes.length, 1)
    assert.equal(quotes[0].city, 'Lahore')
    const keys = Object.keys(quotes[0])
    for (const secret of ['email', 'phone', 'fullName', 'guestTokenHash', 'clerkUserId', 'internalNotes', 'description']) {
      assert.ok(!keys.includes(secret), `${secret} must not be exposed`)
    }

    const other = await (await list('token-B')).json()
    assert.equal(other.quotes.length, 1)
    assert.equal(other.quotes[0].city, 'Karachi')
  })
})

describe('POST /api/quotes/status (guest lookup)', () => {
  beforeEach(() => setup())
  const lookup = (body: unknown, ip?: string) => handlers.guestStatus(request('/api/quotes/status', body, { ip }))

  it('requires both the reference and the secret token', async () => {
    const a = await (await submit(valid)).json()
    const b = await (await submit(valid)).json()

    const ok = await lookup({ reference: a.reference.toLowerCase(), token: a.guestToken })
    assert.equal(ok.status, 200)
    assert.equal((await ok.json()).quote.reference, a.reference)

    assert.equal((await lookup({ reference: a.reference, token: b.guestToken })).status, 404, 'another guest’s token')
    assert.equal((await lookup({ reference: a.reference, token: 'x'.repeat(43) })).status, 404, 'guessed token')
    assert.equal((await lookup({ reference: a.reference })).status, 404, 'missing token')
  })

  it('does not let signed-in quotes be looked up as guest quotes', async () => {
    const owned = await (await submit(valid, { token: 'token-A' })).json()
    assert.equal((await lookup({ reference: owned.reference, token: 'A'.repeat(43) })).status, 404)
  })

  it('rate limits lookups per IP', async () => {
    for (let i = 0; i < LIMITS.guestLookupPerIp; i++) await lookup({ reference: 'NQ-000000000000', token: 'A'.repeat(43) }, '192.0.2.9')
    assert.equal((await lookup({ reference: 'NQ-000000000000', token: 'A'.repeat(43) }, '192.0.2.9')).status, 429)
  })
})

describe('GET /api/my/quotes/:reference', () => {
  beforeEach(() => setup())
  const detail = (reference: string, token?: string) =>
    handlers.myQuoteDetail(request(`/api/my/quotes/${reference}`, undefined, { token, method: 'GET' }))

  it('returns the owner’s full request with its status history', async () => {
    const { reference } = await (await submit({ ...valid, company: 'Acme' }, { token: 'token-A' })).json()
    const res = await detail(reference.toLowerCase(), 'token-A')
    assert.equal(res.status, 200)
    const { quote } = await res.json()
    assert.equal(quote.reference, reference)
    assert.equal(quote.company, 'Acme')
    assert.equal(quote.items.length, 2)
    assert.deepEqual(quote.events.map((e: { status: string }) => e.status), ['submitted'])
    assert.ok(!('guestTokenHash' in quote) && !('clerkUserId' in quote) && !('internalNotes' in quote))
  })

  it('hides other users’ and guest quotes behind the same 404', async () => {
    const owned = await (await submit(valid, { token: 'token-A' })).json()
    const guest = await (await submit(valid)).json()
    assert.equal((await detail(owned.reference, 'token-B')).status, 404)
    assert.equal((await detail(guest.reference, 'token-B')).status, 404)
    assert.equal((await detail('NQ-ZZZ', 'token-A')).status, 404)
    assert.equal((await detail(owned.reference)).status, 401)
    assert.equal((await detail(owned.reference, 'expired')).status, 401)
  })
})

describe('/api/my/wishlist', () => {
  beforeEach(() => setup())
  const put = (slugs: unknown, token?: string) => handlers.wishlist(request('/api/my/wishlist', { slugs }, { token, method: 'PUT' }))
  const get = (token?: string) => handlers.wishlist(request('/api/my/wishlist', undefined, { token, method: 'GET' }))

  it('stores per-user lists, dropping unknown products and duplicates', async () => {
    const res = await put(['tile-adhesive', 'tile-adhesive', 'ultra-fake', 'epoxy-grout'], 'token-A')
    assert.equal(res.status, 200)
    assert.deepEqual((await res.json()).slugs, ['tile-adhesive', 'epoxy-grout'])
    assert.deepEqual((await (await get('token-B')).json()).slugs, [])
    assert.deepEqual((await (await get('token-A')).json()).slugs, ['tile-adhesive', 'epoxy-grout'])
  })

  it('requires sign-in and validates input', async () => {
    assert.equal((await get()).status, 401)
    assert.equal((await put(['tile-adhesive'])).status, 401)
    assert.equal((await put(['../x'], 'token-A')).status, 422)
    assert.equal((await put(Array.from({ length: 101 }, (_, i) => `p${i}`), 'token-A')).status, 422)
  })
})

describe('dev-only fake auth', () => {
  it('cannot be enabled on Vercel or in production', async () => {
    const { withDevAuth } = await import('../server/quotes/config.js')
    const base: AuthVerifier = async () => ({ kind: 'invalid' })
    const local = withDevAuth({ NOVARO_DEV_FAKE_AUTH: '1' }, base)
    assert.deepEqual(await local('dev:dev_admin'), { kind: 'user', userId: 'dev_admin' })
    assert.deepEqual(await local('dev:not-allowed!'), { kind: 'invalid' })
    for (const env of [{ NOVARO_DEV_FAKE_AUTH: '1', VERCEL: '1' }, { NOVARO_DEV_FAKE_AUTH: '1', NODE_ENV: 'production' }, {}]) {
      assert.deepEqual(await withDevAuth(env, base)('dev:dev_admin'), { kind: 'invalid' }, JSON.stringify(env))
    }
  })
})

describe('POST /api/contact', () => {
  beforeEach(() => setup())
  const msg = { fullName: 'Sam Visitor', email: 'Sam@Example.com', topic: 'products', message: 'Do you stock waterproofing for basements?', consent: true, startedAt: NOW - 30_000 }
  const send = (body: unknown, options?: Parameters<typeof request>[2]) => handlers.contact(request('/api/contact', body, options))

  it('stores a valid message; owner only from a verified session', async () => {
    assert.equal((await send({ ...msg, clerkUserId: 'user_B' })).status, 201)
    assert.equal((await send(msg, { token: 'token-A' })).status, 201)
    assert.deepEqual(store.messages.map((m) => m.clerkUserId), [null, 'user_A'])
    assert.equal(store.messages[0].email, 'sam@example.com')
  })

  it('validates, rejects bots and rate limits', async () => {
    const res = await send({ ...msg, topic: 'pricing', message: 'hi', consent: false })
    assert.equal(res.status, 422)
    const { fieldErrors } = await res.json()
    for (const f of ['topic', 'message', 'consent']) assert.ok(fieldErrors[f], f)
    assert.equal((await send({ ...msg, website: 'x' })).status, 400)
    assert.equal((await send({ ...msg, startedAt: NOW - 100 })).status, 400)
    assert.equal((await send(msg, { token: 'expired' })).status, 401)
    for (let i = 0; i < LIMITS.contactPerIp; i++) assert.equal((await send(msg, { ip: '192.0.2.77' })).status, 201)
    assert.equal((await send(msg, { ip: '192.0.2.77' })).status, 429)
  })
})
