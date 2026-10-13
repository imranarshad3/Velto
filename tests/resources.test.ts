import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { AuthVerifier } from '../server/quotes/auth.js'
import { createMemoryFileStorage } from '../server/quotes/fileStorage.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'
import { catalog } from '../src/data/catalog.js'

declare global {
  interface Response {
    // oxlint-disable-next-line typescript/no-explicit-any
    json(): Promise<any>
  }
}

const verifyAuth: AuthVerifier = async (token) => (token === null ? { kind: 'guest' } : token === 'admin' ? { kind: 'user', userId: 'user_admin' } : { kind: 'user', userId: 'user_cust' })
const PDF = new TextEncoder().encode('%PDF-1.7\n% test document\n%%EOF').buffer as ArrayBuffer
const [a, b] = catalog

let store: ReturnType<typeof createMemoryStore>
let api: ReturnType<typeof createApiHandlers>

beforeEach(() => {
  store = createMemoryStore({ products: catalog.slice(0, 4), admins: ['user_admin'] })
  api = createApiHandlers({ store, files: createMemoryFileStorage(), verifyAuth, hashSecret: 'resources-test-secret-at-least-32-chars!!', knownProducts: async () => new Set(), allowedOrigins: [] })
})

const admin = (method: string, path: string, token = 'admin', body?: unknown, raw?: { body: ArrayBuffer; type: string }) =>
  api.admin(
    new Request(`https://novaro.test/api/admin/${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(raw ? { 'content-type': raw.type } : body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: raw ? raw.body : body === undefined ? undefined : JSON.stringify(body),
    }),
  )
const publicList = async () => (await api.resources(new Request('https://novaro.test/api/resources'))).json()
const download = (id: string) => api.resourceDownload(new Request(`https://novaro.test/api/resources/download?id=${id}`))

/** Full admin flow: request upload URL → PUT bytes → create the resource. */
async function upload(fields: Record<string, unknown> = {}) {
  const ticket = await (await admin('POST', 'resources/uploads', 'admin', { fileName: 'Tile Adhesive TDS.pdf', size: PDF.byteLength, contentType: 'application/pdf' })).json()
  assert.match(ticket.storagePath, /^[a-z0-9-]+\/tile-adhesive-tds\.pdf$/)
  const token = ticket.url.split('/').pop()
  assert.equal((await admin('PUT', `uploads/${token}`, 'admin', undefined, { body: PDF, type: 'application/pdf' })).status, 200)
  const res = await admin('POST', 'resources', 'admin', { title: 'Tile Adhesive data sheet', kind: 'data_sheet', productSlugs: [a.slug], published: false, storagePath: ticket.storagePath, fileName: 'Tile Adhesive TDS.pdf', ...fields })
  return { res, ticket }
}

describe('resource center: admin management', () => {
  it('requires an admin for every management route', async () => {
    assert.equal((await admin('POST', 'resources/uploads', 'cust', { fileName: 'x.pdf', size: 10, contentType: 'application/pdf' })).status, 403)
    assert.equal((await admin('GET', 'resources', 'cust')).status, 403)
    assert.equal((await admin('PUT', `coverage/${a.slug}`, 'cust', { rate: 1, rateUnit: 'kg', packAmount: 20, packContainer: 'bags' })).status, 403)
  })

  it('accepts PDFs only, up to 20 MB', async () => {
    assert.equal((await admin('POST', 'resources/uploads', 'admin', { fileName: 'virus.exe', size: 10, contentType: 'application/pdf' })).status, 422)
    assert.equal((await admin('POST', 'resources/uploads', 'admin', { fileName: 'big.pdf', size: 21 * 1024 * 1024, contentType: 'application/pdf' })).status, 422)
    assert.equal((await admin('POST', 'resources/uploads', 'admin', { fileName: 'a.pdf', size: 10, contentType: 'text/html' })).status, 422)
  })

  it('refuses a resource whose upload never arrived or links unknown products', async () => {
    const ticket = await (await admin('POST', 'resources/uploads', 'admin', { fileName: 'a.pdf', size: 10, contentType: 'application/pdf' })).json()
    assert.equal((await admin('POST', 'resources', 'admin', { title: 'Missing file', kind: 'brochure', storagePath: ticket.storagePath })).status, 422)
    assert.equal((await admin('POST', 'resources', 'admin', { title: 'No file', kind: 'brochure' })).status, 422)
    assert.equal((await upload({ productSlugs: ['no-such-product'] })).res.status, 422)
  })

  it('publishes, lists, downloads and deletes a document', async () => {
    const { res } = await upload()
    assert.equal(res.status, 201)
    const { resource } = await res.json()
    assert.equal(resource.fileSize, PDF.byteLength)
    assert.equal('storagePath' in resource, false)

    assert.equal((await publicList()).resources.length, 0, 'drafts are private')
    assert.equal((await download(resource.id)).status, 404)

    assert.equal((await admin('PATCH', `resources/${resource.id}`, 'admin', { title: resource.title, kind: 'data_sheet', productSlugs: [a.slug, b.slug], published: true })).status, 200)
    const list = await publicList()
    assert.deepEqual(list.resources.map((r: { id: string; productSlugs: string[] }) => [r.id, r.productSlugs]), [[resource.id, [a.slug, b.slug]]])
    const file = await download(resource.id)
    assert.equal(file.status, 200)
    assert.equal(file.headers.get('content-type'), 'application/pdf')
    assert.match(file.headers.get('content-disposition') ?? '', /attachment/)

    assert.equal((await admin('DELETE', `resources/${resource.id}`)).status, 200)
    assert.equal((await download(resource.id)).status, 404)
    assert.equal((await publicList()).resources.length, 0)
  })

  it('replaces the file on edit', async () => {
    const { resource } = await (await upload({ published: true })).res.json()
    const { ticket } = await upload()
    const res = await admin('PATCH', `resources/${resource.id}`, 'admin', { title: 'Updated', kind: 'installation_guide', published: true, storagePath: ticket.storagePath, fileName: 'v2.pdf' })
    assert.equal(res.status, 200)
    assert.equal((await res.json()).resource.fileName, 'v2.pdf')
    assert.equal((await download(resource.id)).status, 200)
  })
})

describe('coverage data', () => {
  const coverage = { rate: 4.5, rateUnit: 'kg', coats: 1, packAmount: 20, packContainer: 'bags' }

  it('validates and stores coverage per product', async () => {
    assert.equal((await admin('PUT', `coverage/${a.slug}`, 'admin', { ...coverage, rate: 0 })).status, 422)
    assert.equal((await admin('PUT', 'coverage/no-such-product', 'admin', coverage)).status, 404)
    const res = await admin('PUT', `coverage/${a.slug}`, 'admin', coverage)
    assert.equal(res.status, 200)
    assert.equal((await res.json()).coverage.rate, 4.5)
  })

  it('is public only for verified products', async () => {
    await admin('PUT', `coverage/${a.slug}`, 'admin', coverage)
    assert.equal((await publicList()).coverage.length, 0, 'demo products never expose coverage')
    const product = (await store.listProducts({ includeUnpublished: true })).find((p) => p.slug === a.slug)!
    await store.saveProduct('user_admin', a.slug, { ...product, verified: true, description: product.description, coverage: product.coverage } as never, false)
    const list = await publicList()
    assert.deepEqual(list.coverage.map((c: { productSlug: string; rate: number }) => [c.productSlug, c.rate]), [[a.slug, 4.5]])
    assert.equal((await admin('DELETE', `coverage/${a.slug}`)).status, 200)
    assert.equal((await publicList()).coverage.length, 0)
  })
})
