import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { activitySince, buildProductAnalytics } from '../server/admin/analytics.js'
import type { AuthVerifier } from '../server/quotes/auth.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'
import { catalog } from '../src/data/catalog.js'
import type { AdminProduct, ProductActivity } from '../src/features/admin/types.js'

declare global {
  interface Response {
    // oxlint-disable-next-line typescript/no-explicit-any
    json(): Promise<any>
  }
}

const verifyAuth: AuthVerifier = async (token) =>
  token === null ? { kind: 'guest' } : token === 'admin' ? { kind: 'user', userId: 'user_admin' } : token === 'cust' ? { kind: 'user', userId: 'user_cust' } : { kind: 'invalid' }

const CHROME = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0'
const products = catalog.slice(0, 4)
const [first, second] = products

let store: ReturnType<typeof createMemoryStore>
let api: ReturnType<typeof createApiHandlers>

beforeEach(() => {
  store = createMemoryStore({ products, admins: ['user_admin'] })
  api = createApiHandlers({
    store,
    verifyAuth,
    hashSecret: 'analytics-test-secret-at-least-32-chars!!',
    knownProducts: async () => new Set((await store.listProducts({ includeUnpublished: false })).map((p) => p.slug)),
    allowedOrigins: [],
  })
})

const view = (slug: string, headers: Record<string, string> = {}) =>
  api.trackView(
    new Request('https://novaro.test/api/track/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': CHROME, 'sec-fetch-site': 'same-origin', 'x-forwarded-for': '10.1.1.1', ...headers },
      body: JSON.stringify({ slug }),
    }),
  )

const analytics = async (range = '30d', token = 'admin') =>
  api.admin(new Request(`https://novaro.test/api/admin/analytics?range=${range}`, { headers: { authorization: `Bearer ${token}` } }))

const viewsOf = async (slug: string) => (await (await analytics()).json()).products.find((p: { slug: string }) => p.slug === slug)

describe('product view tracking', () => {
  it('counts a real visitor once per product per day', async () => {
    assert.equal((await view(first.slug)).status, 204)
    assert.equal((await view(first.slug)).status, 204)
    await view(first.slug, { 'user-agent': FIREFOX })
    await view(second.slug)
    const row = await viewsOf(first.slug)
    assert.equal(row.views, 2)
    assert.equal(row.viewsAllTime, 2)
    assert.equal((await viewsOf(second.slug)).views, 1)
  })

  it('ignores bots, scripted clients and cross-site beacons', async () => {
    await view(first.slug, { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' })
    await view(first.slug, { 'user-agent': 'curl/8.5.0' })
    await view(first.slug, { 'user-agent': '' })
    await view(first.slug, { 'sec-fetch-site': 'cross-site' })
    await view(first.slug, { 'user-agent': 'Mozilla/5.0 HeadlessChrome/140.0 Safari/537.36' })
    assert.equal((await viewsOf(first.slug)).views, 0)
  })

  it('rejects malformed slugs and ignores unknown products', async () => {
    assert.equal((await view('../etc')).status, 422)
    assert.equal((await view('no-such-product')).status, 204)
    const body = await (await analytics()).json()
    assert.equal(body.totals.views, 0)
  })

  it('rate limits views per IP without revealing it', async () => {
    for (let i = 0; i < 125; i++) await view(first.slug, { 'user-agent': `${CHROME} v${i}` })
    assert.equal((await viewsOf(first.slug)).views, 120)
  })

  it('rejects non-JSON requests', async () => {
    const res = await api.trackView(new Request('https://novaro.test/api/track/view', { method: 'POST', headers: { 'user-agent': CHROME }, body: 'slug=x' }))
    assert.equal(res.status, 415)
  })
})

describe('admin analytics endpoint', () => {
  it('requires a signed-in admin', async () => {
    assert.equal((await api.admin(new Request('https://novaro.test/api/admin/analytics'))).status, 401)
    assert.equal((await analytics('30d', 'cust')).status, 403)
    assert.equal((await analytics('30d', 'admin')).status, 200)
  })

  it('reports quote demand separately from sales', async () => {
    await store.insert({
      clerkUserId: null,
      guestTokenHash: null,
      fullName: 'Ada',
      email: 'ada@example.com',
      phone: '1234567',
      company: null,
      items: [
        { productSlug: first.slug, quantity: 40, quantityUnit: 'bags' },
        { productSlug: second.slug, quantity: null, quantityUnit: null },
      ],
      projectType: null,
      city: 'Lahore',
      deliveryLocation: null,
      description: 'Analytics test request',
      consentAt: new Date().toISOString(),
    })
    await view(first.slug)
    const body = await (await analytics('7d')).json()
    const row = body.products.find((p: { slug: string }) => p.slug === first.slug)
    assert.equal(body.range, '7d')
    assert.equal(body.salesTracked, false)
    assert.equal(body.totals.unitsSold, null)
    assert.equal(body.totals.quoteRequests, 2)
    assert.equal(row.quoteRequests, 1)
    assert.deepEqual(row.requestedQuantity, { bags: 40 })
    assert.equal(row.unitsSold, null)
    assert.equal(row.quoteRate, 1)
    assert.equal(body.series.length, 7)
  })

  it('falls back to 30 days for an unknown range', async () => {
    assert.equal((await (await analytics('bogus')).json()).range, '30d')
  })
})

describe('buildProductAnalytics', () => {
  const now = Date.parse('2026-10-13T12:00:00Z')
  const list = products.map((p, i) => ({ ...p, published: true, sortOrder: i, updatedAt: '' })) as AdminProduct[]
  const activity: ProductActivity = {
    views: [
      { slug: first.slug, day: '2026-10-13', n: 5 },
      { slug: first.slug, day: '2026-10-01', n: 3 }, // previous 7-day window for trend; outside 7d range
      { slug: second.slug, day: '2026-10-10', n: 9 },
      { slug: second.slug, day: '2026-08-01', n: 50 }, // outside 30d
    ],
    quotes: [{ slug: first.slug, day: '2026-10-12', unit: 'kg', requests: 2, quantity: 30 }],
    viewTotals: [
      { slug: first.slug, n: 8 },
      { slug: second.slug, n: 59 },
    ],
  }

  it('filters by range, ranks by views and fills the daily series', () => {
    const a = buildProductAnalytics('7d', list, activity, now)
    assert.equal(a.from, '2026-10-07')
    assert.equal(a.series.length, 7)
    assert.deepEqual(a.totals, { views: 14, quoteRequests: 2, productsViewed: 2, unitsSold: null })
    assert.deepEqual(a.previousTotals, { views: 3, quoteRequests: 0 })
    assert.deepEqual(
      a.products.slice(0, 2).map((p) => [p.slug, p.views, p.viewsAllTime]),
      [
        [second.slug, 9, 59],
        [first.slug, 5, 8],
      ],
    )
    assert.equal(a.products.length, list.length)
  })

  it('computes trend (last 7 vs previous 7 days) and quote rate', () => {
    const row = buildProductAnalytics('30d', list, activity, now).products.find((p) => p.slug === first.slug)!
    assert.deepEqual(row.trend, { current: 7, previous: 3, change: 4 / 3 })
    assert.equal(row.quoteRate, 2 / 8)
  })

  it('includes everything for all time', () => {
    const a = buildProductAnalytics('all', list, activity, now)
    assert.equal(a.totals.views, 67)
    assert.equal(a.previousTotals, null)
    assert.equal(a.series[0].day, '2026-08-01')
    assert.equal(activitySince('all', now), null)
    assert.equal(activitySince('7d', now), '2026-09-30')
  })
})
