import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { AuthVerifier } from '../server/quotes/auth.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'
import { defaultContent, pageDefinitions } from '../src/features/cms/registry.js'
import { addSection, removeSection } from '../src/features/cms/sections.js'
import { validContent } from '../src/features/cms/schema.js'

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
  it('keeps added sections private until published and restores them from revisions', async () => {
    const section = { id: `custom-${crypto.randomUUID()}`, type: 'image-text' as const }
    const draft = addSection(defaultContent('home'), section)
    draft.fields[`${section.id}.title`] = 'Project support'
    draft.fields[`${section.id}.image-src`] = '/images/project.webp'
    draft.imageSizes = { [`${section.id}.image-src`]: { width: '75%', height: '20rem' } }
    draft.order = [section.id, ...draft.order.filter(id => id !== section.id)]
    assert.equal((await call('POST', 'cms/home', 'sales', { action: 'save', version: 0, content: draft })).status, 403)
    assert.equal((await call('POST', 'cms/home', 'editor', { action: 'save', version: 0, content: draft })).status, 200)
    assert.deepEqual((await (await api.content()).json()).pages, {})
    assert.equal((await call('POST', 'cms/home', 'editor', { action: 'publish', version: 1 })).status, 200)
    assert.deepEqual((await (await api.content()).json()).pages.home, draft)
    const { revisions } = await (await call('GET', 'cms/home/revisions', 'editor')).json()
    const removed = removeSection(draft, section.id)
    assert.ok(validContent('home', removed))
    assert.equal((await call('POST', 'cms/home', 'editor', { action: 'save', version: 2, content: removed })).status, 200)
    assert.deepEqual((await (await api.content()).json()).pages.home, draft)
    const restored = await call('POST', 'cms/home', 'editor', { action: 'restore', version: 3, revisionId: revisions[0].id })
    assert.equal(restored.status, 200)
    assert.deepEqual((await restored.json()).page.draft, draft)
  })

  it('validates section types, unique IDs, limits, URLs and fixed page layouts', () => {
    for (const page of pageDefinitions) assert.ok(validContent(page.id, defaultContent(page.id)))
    const section = { id: `custom-${crypto.randomUUID()}`, type: 'cta' as const }
    const draft = addSection(defaultContent('about'), section)
    assert.ok(validContent('about', { ...draft, hidden: [section.id] }))
    assert.equal(validContent('about', { ...draft, order: [...draft.order].reverse() }), null)
    assert.equal(validContent('about', { ...draft, hidden: [draft.order[0]] }), null)
    assert.equal(validContent('about', { ...draft, sections: [section, section] }), null)
    assert.equal(validContent('about', { ...draft, sections: [{ ...section, type: 'html' }] }), null)
    assert.equal(validContent('about', { ...draft, fields: { ...draft.fields, [`${section.id}.link`]: 'javascript:alert(1)' } }), null)
    assert.equal(validContent('site', addSection(defaultContent('site'), section)), null)
    assert.equal(validContent('categories', addSection(defaultContent('categories'), section)), null)
    let full = defaultContent('home')
    for (let i = 0; i < 20; i++) full = addSection(full, { ...section, id: `custom-${crypto.randomUUID()}` })
    assert.ok(validContent('home', full))
    assert.equal(validContent('home', addSection(full, section)), null)
    const image = addSection(defaultContent('home'), { ...section, type: 'image-text' })
    image.fields[`${section.id}.image-src`] = 'data:image/svg+xml,unsafe'
    assert.equal(validContent('home', image), null)
  })

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
