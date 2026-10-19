import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { AuthVerifier } from '../server/quotes/auth.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'
import { defaultContent } from '../src/features/cms/registry.js'

let api: ReturnType<typeof createApiHandlers>
const verifyAuth: AuthVerifier = async () => ({ kind: 'user', userId: 'user_admin' })

beforeEach(async () => {
  const store = createMemoryStore({ products: [], admins: ['user_admin'] })
  api = createApiHandlers({
    store,
    verifyAuth,
    hashSecret: 'workspace-test-secret-at-least-32-characters!!',
    knownProducts: async () => new Set(),
    allowedOrigins: [],
  })
})

describe('CMS Caching, ETag, and Invalidation', () => {
  it('returns ETag and supports 304 Not Modified on unchanged content', async () => {
    const res1 = await api.content()
    assert.equal(res1.status, 200)
    const etag1 = res1.headers.get('etag')
    assert.ok(etag1, 'Should return ETag')
    assert.equal(res1.headers.get('cache-control'), 'public, max-age=0, must-revalidate')

    const res2 = await api.content(
      new Request('https://novaro.test/api/content', {
        headers: { 'if-none-match': etag1! },
      }),
    )
    assert.equal(res2.status, 304)
    assert.equal(res2.headers.get('etag'), etag1)
  })

  it('invalidates cache and updates ETag when content is published', async () => {
    const draft = defaultContent('home')
    draft.fields['Hero.field-1'] = 'New Published Hero Title'

    // Save and publish
    await api.admin(
      new Request('https://novaro.test/api/admin/cms/home', {
        method: 'POST',
        headers: { authorization: 'Bearer admin', 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'save', version: 0, content: draft }),
      }),
    )
    const pubRes = await api.admin(
      new Request('https://novaro.test/api/admin/cms/home', {
        method: 'POST',
        headers: { authorization: 'Bearer admin', 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'publish', version: 1 }),
      }),
    )
    assert.equal(pubRes.status, 200)

    const updated = await api.content()
    assert.equal(updated.status, 200)
    const data = await updated.json()
    assert.equal(data.pages.home.fields['Hero.field-1'], 'New Published Hero Title')

    const newEtag = updated.headers.get('etag')
    assert.ok(newEtag)

    // With matching new ETag, 304 is returned
    const res304 = await api.content(
      new Request('https://novaro.test/api/content', {
        headers: { 'if-none-match': newEtag! },
      }),
    )
    assert.equal(res304.status, 304)
  })
})
