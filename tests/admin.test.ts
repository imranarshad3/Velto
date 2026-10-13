import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { AuthVerifier } from '../server/quotes/auth.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'
import { catalog } from '../src/data/catalog.js'

declare global {
  interface Response {
    // oxlint-disable-next-line typescript/no-explicit-any
    json(): Promise<any>
  }
}

const verifyAuth: AuthVerifier = async (token) =>
  token === null ? { kind: 'guest' } : token === 'admin' ? { kind: 'user', userId: 'user_admin' } : token === 'cust' ? { kind: 'user', userId: 'user_cust' } : { kind: 'invalid' }

let store: ReturnType<typeof createMemoryStore>
let api: ReturnType<typeof createApiHandlers>
let invalidated = 0

beforeEach(() => {
  store = createMemoryStore({ products: catalog.slice(0, 5), admins: ['user_admin'] })
  invalidated = 0
  api = createApiHandlers({
    store,
    verifyAuth,
    hashSecret: 'admin-test-secret-at-least-32-characters!!',
    knownProducts: async () => new Set((await store.listProducts({ includeUnpublished: false })).map((p) => p.slug)),
    onCatalogChange: () => invalidated++,
    allowedOrigins: [],
  })
})

const call = (method: string, path: string, token?: string, body?: unknown) =>
  api.admin(
    new Request(`https://novaro.test/api/admin/${path}`, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )

const quoteBody = { fullName: 'Cara Client', email: 'cara@example.com', phone: '1234567', city: 'Lahore', description: 'Admin flow request details.', consent: true, items: [{ productSlug: 'tile-adhesive' }] }
const submitQuote = async (token?: string) =>
  (
    await api.submit(
      new Request('https://novaro.test/api/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(quoteBody),
      }),
    )
  ).json()

const product = {
  slug: 'verified-primer',
  name: 'Verified Primer',
  categorySlug: 'surface-treatments',
  usage: 'For priming walls before coating.',
  applications: ['exterior-walls'],
  areas: ['exterior'],
  specifications: [{ label: 'Colour', value: 'Clear' }],
  documents: [{ title: 'Data sheet', url: 'https://example.com/ds.pdf', fileType: 'pdf' }],
  image: { src: '/images/products/concept-pack-01.webp', alt: 'Primer', width: 236, height: 224 },
  price: { amount: 1500, currency: 'PKR' },
  verified: false,
  published: true,
}

describe('admin authorisation', () => {
  it('rejects guests, invalid sessions and non-admin customers on every route', async () => {
    const routes: [string, string, unknown?][] = [
      ['GET', 'overview'], ['GET', 'quotes'], ['GET', 'quotes/NQ-000000000000'], ['PATCH', 'quotes/NQ-000000000000', { status: 'quoted' }],
      ['GET', 'products'], ['POST', 'products', product], ['PATCH', 'products/tile-adhesive', product], ['GET', 'customers'],
      ['GET', 'messages'], ['PATCH', 'messages/00000000-0000-0000-0000-000000000000', { status: 'read' }],
      ['GET', 'analytics'], ['PATCH', 'product-status/tile-adhesive', { status: 'archived' }], ['DELETE', 'products/tile-adhesive'],
    ]
    for (const [method, path, body] of routes) {
      assert.equal((await call(method, path, undefined, body)).status, 401, `guest ${method} ${path}`)
      assert.equal((await call(method, path, 'expired', body)).status, 401, `invalid ${method} ${path}`)
      assert.equal((await call(method, path, 'cust', body)).status, 403, `customer ${method} ${path}`)
    }
    assert.equal(store.products.find((p) => p.slug === 'tile-adhesive')?.name, 'Tile Adhesive', 'unchanged')
  })

  it('reports admin status only from the server-side membership', async () => {
    assert.deepEqual(await (await call('GET', 'me', 'cust')).json(), { isAdmin: false })
    assert.deepEqual(await (await call('GET', 'me', 'admin')).json(), { isAdmin: true })
    // A body claiming admin rights changes nothing.
    assert.equal((await call('PATCH', 'products/tile-adhesive', 'cust', { ...product, isAdmin: true, role: 'admin' })).status, 403)
  })

  it('supports the rewritten ?path= form', async () => {
    const res = await api.admin(new Request('https://novaro.test/api/admin?path=overview', { headers: { authorization: 'Bearer admin' } }))
    assert.equal(res.status, 200)
  })
})

describe('admin quotes', () => {
  it('lists, filters, searches and updates with history and audit', async () => {
    const owned = await submitQuote('cust')
    await submitQuote()
    let res = await call('GET', 'quotes', 'admin')
    assert.equal((await res.json()).total, 2)
    res = await call('GET', `quotes?q=${owned.reference.slice(3, 9)}`, 'admin')
    assert.equal((await res.json()).rows[0].reference, owned.reference)

    res = await call('PATCH', `quotes/${owned.reference}`, 'admin', { status: 'quoted', note: 'Quote sent by email.', internalNotes: 'Discount approved' })
    assert.equal(res.status, 200)
    const { quote } = await res.json()
    assert.equal(quote.status, 'quoted')
    assert.equal(quote.internalNotes, 'Discount approved')
    assert.deepEqual(quote.events.map((e: { status: string }) => e.status), ['submitted', 'quoted'])

    // The customer sees the note but never internal notes.
    const mine = await (await api.myQuoteDetail(new Request(`https://novaro.test/api/my/quotes/${owned.reference}`, { headers: { authorization: 'Bearer cust' } }))).json()
    assert.equal(mine.quote.events.at(-1).note, 'Quote sent by email.')
    assert.ok(!('internalNotes' in mine.quote))

    assert.equal((await call('GET', 'quotes?status=quoted', 'admin').then((r) => r.json())).total, 1)
    assert.equal((await call('PATCH', `quotes/${owned.reference}`, 'admin', { status: 'approved' })).status, 422)
    assert.equal((await call('PATCH', 'quotes/NQ-FFFFFFFFFFFF', 'admin', { status: 'closed' })).status, 404)
    assert.equal(store.audit[0].action, 'quote.update')
    assert.equal(store.audit[0].actor, 'user_admin')
  })
})

describe('admin products and public catalogue', () => {
  const catalogJson = async () => (await api.catalog(new Request('https://novaro.test/api/catalog'))).json()

  it('creates, validates and publishes products; prices public only when verified', async () => {
    let res = await call('POST', 'products', 'admin', product)
    assert.equal(res.status, 201)
    assert.equal(invalidated, 1)
    let listed = (await catalogJson()).products.find((p: { slug: string }) => p.slug === 'verified-primer')
    assert.ok(listed)
    assert.equal(listed.price, undefined, 'unverified price hidden')

    res = await call('PATCH', 'products/verified-primer', 'admin', { ...product, verified: true })
    assert.equal(res.status, 200)
    listed = (await catalogJson()).products.find((p: { slug: string }) => p.slug === 'verified-primer')
    assert.deepEqual(listed.price, { amount: 1500, currency: 'PKR' })
    assert.ok(!('published' in listed) && !('sortOrder' in listed))

    await call('PATCH', 'products/verified-primer', 'admin', { ...product, published: false })
    assert.ok(!(await catalogJson()).products.some((p: { slug: string }) => p.slug === 'verified-primer'), 'unpublished hidden')
    assert.ok((await (await call('GET', 'products', 'admin')).json()).products.some((p: { slug: string }) => p.slug === 'verified-primer'), 'admin still sees it')

    // Unpublished products can no longer be quoted.
    const quote = await api.submit(new Request('https://novaro.test/api/quotes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...quoteBody, items: [{ productSlug: 'verified-primer' }] }) }))
    assert.equal(quote.status, 422)
  })

  it('rejects duplicates and unsafe input', async () => {
    assert.equal((await call('POST', 'products', 'admin', { ...product, slug: 'tile-adhesive' })).status, 422)
    const bad = [
      { image: { ...product.image, src: 'https://evil.example/x.png' } },
      { image: { ...product.image, src: '/images/../../etc/passwd' } },
      { documents: [{ title: 'x', url: 'javascript:alert(1)', fileType: 'pdf' }] },
      { categorySlug: 'weapons' },
      { applications: ['moon'] },
      { price: { amount: -5, currency: 'PKR' } },
      { slug: 'Bad Slug' },
    ]
    for (const patch of bad) assert.equal((await call('POST', 'products', 'admin', { ...product, ...patch })).status, 422, JSON.stringify(patch))
    assert.equal((await call('PATCH', 'products/does-not-exist', 'admin', product)).status, 404)
    assert.equal((await api.catalog(new Request('https://novaro.test/api/catalog'))).headers.get('cache-control')?.includes('s-maxage'), true)
  })
})

describe('admin customers, messages and overview', () => {
  it('aggregates customers, manages messages and reports totals', async () => {
    await submitQuote('cust')
    await api.contact(new Request('https://novaro.test/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName: 'Max', email: 'max@example.com', topic: 'other', message: 'A question about the site.', consent: true }) }))
    const customers = (await (await call('GET', 'customers', 'admin')).json()).customers
    assert.deepEqual(customers.map((c: { clerkUserId: string; quotes: number }) => [c.clerkUserId, c.quotes]), [['user_cust', 1]])

    const { messages } = await (await call('GET', 'messages?status=new', 'admin')).json()
    assert.equal(messages.length, 1)
    assert.equal((await call('PATCH', `messages/${messages[0].id}`, 'admin', { status: 'closed' })).status, 200)
    assert.equal((await call('PATCH', 'messages/not-a-uuid', 'admin', { status: 'closed' })).status, 404)
    assert.equal((await call('PATCH', `messages/${messages[0].id}`, 'admin', { status: 'deleted' })).status, 422)

    const overview = await (await call('GET', 'overview', 'admin')).json()
    assert.equal(overview.quotesByStatus.submitted, 1)
    assert.equal(overview.newMessages, 0)
    assert.equal(overview.products, 5)
    assert.equal(overview.customers, 1)
    assert.equal(overview.recentAudit[0].action, 'message.update')
  })
})

describe('product status and delete', () => {
  const catalogSlugs = async () => ((await (await api.catalog(new Request('https://novaro.test/api/catalog'))).json()).products as { slug: string }[]).map((p) => p.slug)
  const adminProduct = async (slug: string) => ((await (await call('GET', 'products', 'admin')).json()).products as { slug: string; published: boolean; archived: boolean }[]).find((p) => p.slug === slug)

  it('moves a product between published, draft and archived', async () => {
    const res = await call('PATCH', 'product-status/tile-adhesive', 'admin', { status: 'archived' })
    assert.equal(res.status, 200)
    assert.deepEqual([(await res.json()).product.published, (await adminProduct('tile-adhesive'))?.archived], [false, true])
    assert.equal((await catalogSlugs()).includes('tile-adhesive'), false)
    assert.equal(invalidated, 1)

    await call('PATCH', 'product-status/tile-adhesive', 'admin', { status: 'draft' })
    assert.deepEqual(await adminProduct('tile-adhesive').then((p) => [p?.published, p?.archived]), [false, false])

    await call('PATCH', 'product-status/tile-adhesive', 'admin', { status: 'published' })
    assert.equal((await catalogSlugs()).includes('tile-adhesive'), true)
  })

  it('keeps archive state through edits and un-archives on publish', async () => {
    await call('PATCH', 'product-status/tile-adhesive', 'admin', { status: 'archived' })
    const edited = { ...product, slug: 'tile-adhesive', published: false }
    await call('PATCH', 'products/tile-adhesive', 'admin', edited)
    assert.equal((await adminProduct('tile-adhesive'))?.archived, true)
    await call('PATCH', 'products/tile-adhesive', 'admin', { ...edited, published: true })
    assert.deepEqual(await adminProduct('tile-adhesive').then((p) => [p?.published, p?.archived]), [true, false])
  })

  it('validates status values and unknown products', async () => {
    assert.equal((await call('PATCH', 'product-status/tile-adhesive', 'admin', { status: 'demo' })).status, 422)
    assert.equal((await call('PATCH', 'product-status/nope', 'admin', { status: 'draft' })).status, 404)
  })

  it('never exposes the archived flag publicly', async () => {
    const products = (await (await api.catalog(new Request('https://novaro.test/api/catalog'))).json()).products
    assert.equal('archived' in products[0], false)
  })

  it('deletes unused products and refuses products in quote requests', async () => {
    const slugs = (await store.listProducts({ includeUnpublished: true })).map((p) => p.slug)
    const unused = slugs.find((s) => s !== 'tile-adhesive')!
    assert.equal((await call('DELETE', `products/${unused}`, 'admin')).status, 200)
    assert.equal(await adminProduct(unused), undefined)
    assert.equal((await call('DELETE', `products/${unused}`, 'admin')).status, 404)

    await submitQuote()
    const res = await call('DELETE', 'products/tile-adhesive', 'admin')
    assert.equal(res.status, 409)
    assert.equal((await res.json()).error, 'product_in_use')
    assert.ok(await adminProduct('tile-adhesive'))
  })
})
