import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { AuthVerifier } from '../server/quotes/auth.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'
import { defaultContent, pageDefinitions } from '../src/features/cms/registry.js'

declare global {
  interface Response {
    // oxlint-disable-next-line typescript/no-explicit-any
    json(): Promise<any>
  }
}

const users: Record<string, string> = { admin: 'user_admin', editor: 'user_editor', sales: 'user_sales' }
const verifyAuth: AuthVerifier = async (token) => (token && users[token] ? { kind: 'user', userId: users[token] } : { kind: 'guest' })

let api: ReturnType<typeof createApiHandlers>
const call = (method: string, path: string, token: string, body?: unknown) =>
  api.admin(
    new Request(`https://novaro.test/api/admin/${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )

/** Minimal valid WebP container of the given total size. */
const webp = (size = 64) => {
  const b = Buffer.alloc(size)
  b.write('RIFF', 0, 'ascii')
  b.writeUInt32LE(size - 8, 4)
  b.write('WEBP', 8, 'ascii')
  return b.toString('base64')
}

beforeEach(async () => {
  const store = createMemoryStore({ products: [], admins: Object.values(users) })
  api = createApiHandlers({
    store,
    verifyAuth,
    hashSecret: 'workspace-test-secret-at-least-32-characters!!',
    knownProducts: async () => new Set(),
    allowedOrigins: [],
  })
  assert.equal((await call('PATCH', 'roles/user_editor', 'admin', { role: 'editor' })).status, 200)
  assert.equal((await call('PATCH', 'roles/user_sales', 'admin', { role: 'sales' })).status, 200)
})

describe('CMS/CRM workspace', () => {
  it('enforces team roles on the server', async () => {
    assert.equal((await call('GET', 'leads', 'editor')).status, 403)
    assert.equal((await call('GET', 'cms', 'sales')).status, 403)
    assert.equal((await call('GET', 'media', 'sales')).status, 403)
    assert.equal((await call('GET', 'roles', 'editor')).status, 403)
    assert.equal((await call('GET', 'cms', 'editor')).status, 200)
    assert.equal((await call('GET', 'leads', 'sales')).status, 200)
  })

  it('saves drafts, publishes to the storefront and restores revisions', async () => {
    const def = pageDefinitions[0]
    const key = def.sections.flatMap((s) => s.fields).find((f) => f.kind === 'text')!.key
    const draft = defaultContent(def.id)
    draft.fields[key] = 'Edited headline'
    const saved = await call('POST', `cms/${def.id}`, 'editor', { action: 'save', version: 0, content: draft })
    assert.equal(saved.status, 200)
    assert.deepEqual(await (await api.content()).json(), { pages: {} }, 'drafts stay private')
    assert.equal((await call('POST', `cms/${def.id}`, 'editor', { action: 'publish', version: 0 })).status, 409, 'stale version rejected')
    assert.equal((await call('POST', `cms/${def.id}`, 'editor', { action: 'publish', version: 1 })).status, 200)
    assert.equal((await (await api.content()).json()).pages[def.id].fields[key], 'Edited headline')
    const { revisions } = await (await call('GET', `cms/${def.id}/revisions`, 'editor')).json()
    assert.equal(revisions.length, 2)
    const unsafe = { ...draft, fields: { ...draft.fields, [key]: 'x', nope: 'y' } }
    assert.equal((await call('POST', `cms/${def.id}`, 'editor', { action: 'save', version: 2, content: unsafe })).status, 422)
  })

  it('uploads, replaces and validates media', async () => {
    const metadata = { name: 'Hero', alt: 'Site', folder: 'home', tags: [] }
    assert.equal((await call('POST', 'media', 'editor', { metadata, base64: Buffer.from('not an image at all!!').toString('base64') })).status, 422)
    const created = await call('POST', 'media', 'editor', { metadata, base64: webp() })
    assert.equal(created.status, 201)
    const { media } = await created.json()
    const replaced = await call('PUT', `media/${media.id}`, 'editor', { base64: webp(128) })
    assert.equal(replaced.status, 200)
    const after = (await replaced.json()).media
    assert.equal(after.url, media.url)
    assert.equal(after.size, 128)
    assert.equal((await call('PUT', `media/${crypto.randomUUID()}`, 'editor', { base64: webp() })).status, 404)
  })

  it('tracks lead stages, assignment and history', async () => {
    const lead = { name: 'Site Co', email: 'buyer@site.test', phone: '', company: 'Site Co', stage: 'New', notes: '', tags: [], assignedTo: null, followUp: null, quoteReference: null, version: 0 }
    const created = await call('POST', 'leads', 'sales', lead)
    assert.equal(created.status, 201)
    const saved = (await created.json()).lead
    assert.equal((await call('PATCH', `leads/${saved.id}`, 'sales', { ...lead, assignedTo: 'user_editor', version: 1 })).status, 422, 'editors cannot own leads')
    const updated = await call('PATCH', `leads/${saved.id}`, 'sales', { ...lead, stage: 'Qualified', assignedTo: 'user_sales', notes: 'Called', version: 1 })
    assert.equal(updated.status, 200)
    const { events } = await (await call('GET', `leads/${saved.id}/events`, 'sales')).json()
    assert.equal(events.length, 2)
    assert.match(events[0].action, /New → Qualified/)
  })
})
