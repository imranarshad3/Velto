/**
 * Integration test against a real PostgREST + Postgres with the migration applied.
 * Skipped unless SUPABASE_TEST_URL, SUPABASE_TEST_JWT_SECRET are set (see PROGRESS.md for the local recipe).
 */
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { describe, it } from 'node:test'
import type { AuthVerifier } from '../server/quotes/auth.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createSupabaseStore } from '../server/quotes/supabaseStore.js'

const url = process.env.SUPABASE_TEST_URL
const jwtSecret = process.env.SUPABASE_TEST_JWT_SECRET

function signJwt(role: string) {
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const body = `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ role, iss: 'supabase', exp: Math.floor(Date.now() / 1000) + 600 })}`
  return `${body}.${createHmac('sha256', jwtSecret!).update(body).digest('base64url')}`
}

describe('Supabase store (PostgREST)', { skip: !url || !jwtSecret }, () => {
  const rest = (path: string, role: string, init: RequestInit = {}) =>
    fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: signJwt(role), authorization: `Bearer ${signJwt(role)}`, 'content-type': 'application/json', ...init.headers },
    })

  it('denies direct anon/authenticated REST access to quote data', async () => {
    for (const role of ['anon', 'authenticated']) {
      for (const table of ['quote_request_items', 'quote_rate_limits', 'quote_events', 'wishlist_items', 'contact_messages', 'products', 'admin_members', 'admin_audit_log']) {
        const r = await rest(`${table}?select=*`, role)
        assert.ok([401, 403].includes(r.status), `${role} ${table} → ${r.status}`)
      }
      for (const fn of ['admin_overview', 'admin_customers']) {
        const r = await rest(`rpc/${fn}`, role, { method: 'POST', body: '{}' })
        assert.ok([401, 403, 404].includes(r.status), `${role} ${fn} → ${r.status}`)
      }
      const save = await rest('rpc/admin_save_product', role, { method: 'POST', body: JSON.stringify({ p_actor: 'x', p_slug: 'x', p_product: {}, p_create: true }) })
      assert.ok([401, 403, 404].includes(save.status), `${role} admin_save_product → ${save.status}`)
      const upd = await rest('rpc/admin_update_quote', role, { method: 'POST', body: JSON.stringify({ p_reference: 'x', p_actor: 'x', p_status: 'closed', p_note: null, p_internal_notes: null }) })
      assert.ok([401, 403, 404].includes(upd.status), `${role} admin_update_quote → ${upd.status}`)
      const selfAdmin = await rest('admin_members', role, { method: 'POST', body: JSON.stringify({ clerk_user_id: 'attacker' }) })
      assert.ok([401, 403].includes(selfAdmin.status), `${role} self-grant admin → ${selfAdmin.status}`)
      const wish = await rest('rpc/replace_wishlist', role, { method: 'POST', body: JSON.stringify({ p_user: 'user_x', p_slugs: ['a'] }) })
      assert.ok([401, 403, 404].includes(wish.status), `${role} wishlist rpc → ${wish.status}`)
      const create = await rest('rpc/create_quote_request', role, { method: 'POST', body: JSON.stringify({ p_quote: {}, p_items: [] }) })
      assert.ok([401, 403, 404].includes(create.status), `${role} create rpc → ${create.status}`)
      const read = await rest('quote_requests?select=*', role)
      assert.ok([401, 403].includes(read.status), `${role} select → ${read.status}`)
      const insert = await rest('quote_requests', role, {
        method: 'POST',
        body: JSON.stringify({ guest_token_hash: 'a'.repeat(64), full_name: 'Eve', email: 'e@x.io', phone: '1234567', city: 'X', description: 'direct insert attempt', consent_at: new Date().toISOString() }),
      })
      assert.ok([401, 403].includes(insert.status), `${role} insert → ${insert.status}`)
      const patch = await rest('quote_requests?status=eq.submitted', role, { method: 'PATCH', body: JSON.stringify({ status: 'quoted' }) })
      assert.ok([401, 403].includes(patch.status), `${role} update → ${patch.status}`)
      const del = await rest('quote_requests?status=eq.submitted', role, { method: 'DELETE' })
      assert.ok([401, 403].includes(del.status), `${role} delete → ${del.status}`)
      const rpc = await rest('rpc/quote_rate_limit_hit', role, { method: 'POST', body: JSON.stringify({ p_key: 'k', p_window_seconds: 60, p_max: 1 }) })
      assert.ok([401, 403, 404].includes(rpc.status), `${role} rpc → ${rpc.status}`)
    }
  })

  it('runs the full guest + account flow through the server-only store', async () => {
    const store = createSupabaseStore(url!, signJwt('service_role'))
    const verifyAuth: AuthVerifier = async (token) =>
      token === null ? { kind: 'guest' } : token === 'token-A' ? { kind: 'user', userId: 'user_int_A' } : { kind: 'invalid' }
    const handlers = createApiHandlers({
      store,
      verifyAuth,
      hashSecret: 'integration-secret-at-least-32-characters!!',
      knownProducts: async () => new Set(['tile-adhesive', 'epoxy-grout']),
      allowedOrigins: [],
    })
    const post = (path: string, body: unknown, token?: string) =>
      new Request(`http://local${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.${Math.floor(Math.random() * 250)}.1`, ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      })
    const quote = {
      fullName: 'Int Test', email: 'int@example.com', phone: '1234567', city: 'Lahore', description: 'Integration test request', consent: true,
      items: [{ productSlug: 'tile-adhesive', quantity: 3, quantityUnit: 'bags' }, { productSlug: 'epoxy-grout' }],
    }

    const guest = await handlers.submit(post('/api/quotes', quote))
    assert.equal(guest.status, 201)
    const g = await guest.json() as { reference: string; guestToken: string }
    assert.match(g.reference, /^NQ-[0-9A-F]{12}$/)

    const user = await handlers.submit(post('/api/quotes', { ...quote, city: 'Multan', clerkUserId: 'user_someone_else' }, 'token-A'))
    assert.equal(user.status, 201)

    const list = await handlers.myQuotes(new Request('http://local/api/my/quotes', { headers: { authorization: 'Bearer token-A' } }))
    const { quotes } = await list.json() as { quotes: { city: string; items: { productSlug: string; quantity: number | null }[] }[] }
    assert.ok(quotes.length >= 1 && quotes.every((q) => q.city === 'Multan'))
    assert.deepEqual(quotes[0].items.map((i) => [i.productSlug, i.quantity]), [['tile-adhesive', 3], ['epoxy-grout', null]])
    assert.ok(!('email' in quotes[0]))

    const status = await handlers.guestStatus(post('/api/quotes/status', { reference: g.reference, token: g.guestToken }))
    assert.equal(status.status, 200)
    const wrong = await handlers.guestStatus(post('/api/quotes/status', { reference: g.reference, token: 'B'.repeat(43) }))
    assert.equal(wrong.status, 404)

    const ownRef = (quotes[0] as unknown as { reference: string }).reference
    const detail = await handlers.myQuoteDetail(new Request(`http://local/api/my/quotes/${ownRef}`, { headers: { authorization: 'Bearer token-A' } }))
    assert.equal(detail.status, 200)
    const d = (await detail.json()) as { quote: { events: { status: string }[]; email: string; items: unknown[] } }
    assert.deepEqual(d.quote.events.map((e) => e.status), ['submitted'])
    assert.equal(d.quote.email, 'int@example.com')
    assert.equal(d.quote.items.length, 2)
    assert.equal(await store.findUserQuote('user_someone_else', ownRef), null)

    const replaced = await store.replaceWishlist('user_int_A', ['tile-adhesive', 'epoxy-grout'])
    assert.deepEqual([...replaced].sort(), ['epoxy-grout', 'tile-adhesive'])
    assert.deepEqual(await store.getWishlist('user_int_A'), replaced, 'same ordering from read and replace')
    assert.deepEqual((await store.replaceWishlist('user_int_A', ['epoxy-grout'])), ['epoxy-grout'])
    assert.deepEqual(await store.getWishlist('user_int_B'), [])

    assert.equal(await store.hitRateLimit('int-key', 60, 1), true)
    assert.equal(await store.hitRateLimit('int-key', 60, 1), false)
  })

  it('runs catalogue and admin operations through the database functions', async () => {
    const store = createSupabaseStore(url!, signJwt('service_role'))
    assert.equal(await store.isAdmin('user_int_admin'), true)
    assert.equal(await store.isAdmin('user_int_A'), false)

    const published = await store.listProducts({ includeUnpublished: false })
    assert.ok(published.length >= 27, 'seeded DEMO catalogue')
    assert.equal(published.every((p) => !p.verified), true)

    const data = {
      slug: 'int-primer', name: 'Integration Primer', categorySlug: 'surface-treatments' as const, images: [], stockQuantity: 10, usage: 'For integration testing only.',
      applications: ['exterior-walls' as const], areas: ['exterior' as const], benefits: ['One'], specifications: [{ label: 'Colour', value: 'Clear' }],
      packSizes: ['20 kg'], documents: [{ title: 'TDS', url: 'https://example.com/tds.pdf', fileType: 'pdf' }], faq: [],
      image: { src: '/images/products/concept-pack-01.webp', alt: 'x', width: 236, height: 224 }, price: { amount: 1234.5, currency: 'PKR' as const },
      verified: false, published: false, sortOrder: 99,
    }
    await store.saveProduct('user_int_admin', 'int-primer', data, true).catch(() => {})
    assert.equal(await store.saveProduct('user_int_admin', 'int-primer', data, true), 'conflict')
    assert.equal(await store.saveProduct('user_int_admin', 'int-primer', { ...data, verified: true, published: true }, false), 'ok')
    assert.equal(await store.saveProduct('user_int_admin', 'nope-nope', data, false), 'not_found')
    const saved = (await store.listProducts({ includeUnpublished: false })).find((p) => p.slug === 'int-primer')
    assert.deepEqual(saved?.price, { amount: 1234.5, currency: 'PKR' as const })
    assert.deepEqual(saved?.documents, data.documents)
    assert.deepEqual(saved?.packSizes, ['20 kg'])

    const { rows, total } = await store.adminListQuotes({ search: 'int@example', limit: 5, offset: 0 })
    assert.ok(total >= 1 && rows[0].email === 'int@example.com' && rows[0].itemCount === 2)
    assert.equal((await store.adminListQuotes({ search: "x',or(1=1", limit: 5, offset: 0 })).total, 0, 'search is sanitised')
    const ref = rows[0].reference
    assert.equal(await store.adminUpdateQuote(ref, 'user_int_admin', 'reviewing', 'Looking into it', 'internal only'), true)
    const detail = await store.adminGetQuote(ref)
    assert.equal(detail?.status, 'reviewing')
    assert.equal(detail?.internalNotes, 'internal only')
    assert.equal(detail?.events.at(-1)?.note, 'Looking into it')

    const overview = await store.adminOverview()
    assert.ok((overview.quotesByStatus.reviewing ?? 0) >= 1)
    assert.ok(overview.recentAudit.some((a) => a.action === 'quote.update' && a.entityKey === ref))
    assert.ok((await store.adminCustomers()).some((c) => c.clerkUserId === 'user_int_A'))

    await store.insertContactMessage({ clerkUserId: null, fullName: 'Int Msg', email: 'msg@example.com', phone: null, topic: 'other', message: 'Integration message body', consentAt: new Date().toISOString() })
    const msg = (await store.adminListMessages('new')).find((m) => m.email === 'msg@example.com')
    assert.ok(msg)
    assert.equal(await store.adminUpdateMessage(msg!.id, 'user_int_admin', 'read'), true)
  })
})
