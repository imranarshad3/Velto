import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import { createProductGenerator } from '../server/admin/aiProduct.js'
import { aiProductDraftSchema, draftFormFields, mergeDraft, type AiProductDraft } from '../src/features/catalog/aiProduct.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'

const draft: AiProductDraft = { name: 'Tile adhesive', slug: 'tile-adhesive', categorySlug: 'tile-adhesives', usage: 'Tile fixing', description: 'A product for tiling.', applications: [], areas: [], benefits: [], specifications: [{ label: 'Pack', value: '20 kg' }], packSizes: ['20 kg'], coverage: '', faq: [], imageAlt: 'Bag of tile adhesive', confidence: 'medium', observations: ['20 kg printed on label'], reviewNotes: ['Check suitability'], missingInformation: ['Coverage'] }
const photo = (await sharp({ create: { width: 10, height: 10, channels: 3, background: '#ffffff' } }).png().toBuffer()).toString('base64')
const input = { images: [photo], context: '' }
const response = (value: unknown, finish_reason = 'stop') => Response.json({ choices: [{ finish_reason, message: { content: typeof value === 'string' ? value : JSON.stringify(value) } }] })
const errorCode = (code: string) => (e: unknown) => { assert.equal((e as { code: string }).code, code); return true }

test('valid vision response is validated and image is decoded and normalized', async () => {
  const generate = createProductGenerator({ apiKey: 'test', fetcher: async (_url, init) => {
    const body = JSON.parse(String(init?.body))
    assert.equal(body.response_format.type, 'json_object')
    assert.match(body.messages[1].content[1].image_url.url, /^data:image\/jpeg;base64,/)
    return response(draft)
  } })
  assert.deepEqual(await generate(input), draft)
})

test('rejects unavailable config, invalid images and excessive bytes before provider calls', async () => {
  await assert.rejects(createProductGenerator({})(input), errorCode('ai_unconfigured'))
  const generate = createProductGenerator({ apiKey: 'test', fetcher: async () => { throw new Error('Must not be called') } })
  await assert.rejects(generate({ images: [Buffer.from('not an image').toString('base64')], context: '' }), errorCode('invalid_image'))
  await assert.rejects(generate({ images: [Buffer.alloc(2_500_001).toString('base64')], context: '' }), errorCode('image_too_large'))
  await assert.rejects(generate({ images: [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>').toString('base64')], context: '' }), errorCode('invalid_image'))
})

test('provider errors, malformed drafts, truncated output and operational fields fail safely', async () => {
  for (const [res, code] of [[new Response('', { status: 429 }), 'ai_rate_limited'], [new Response('secret diagnostic', { status: 401 }), 'ai_unavailable'], [response('not json'), 'ai_invalid_response'], [response({ ...draft, published: true }), 'ai_invalid_response'], [response(draft, 'length'), 'ai_invalid_response']] as const) {
    await assert.rejects(createProductGenerator({ apiKey: 'test', fetcher: async () => res })(input), errorCode(code))
  }
  assert.equal(aiProductDraftSchema.safeParse({ ...draft, price: 100 }).success, false)
})

test('timeout returns a recoverable error', async () => {
  const fetcher: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
  await assert.rejects(createProductGenerator({ apiKey: 'test', timeoutMs: 5, fetcher })(input), errorCode('ai_timeout'))
})

test('merge preserves manual data, live edits, operational fields and existing slugs', () => {
  const current = { ...draftFormFields(draft), name: 'My title', description: '', priceAmount: '900', verified: false, published: false }
  const result = mergeDraft(current, draft, false, true)
  assert.equal(result.name, 'My title')
  assert.equal(result.description, draft.description)
  assert.equal(result.priceAmount, '900')
  assert.equal(result.published, false)
  assert.equal(result.verified, false)
  assert.equal(mergeDraft(current, draft, true, true).name, draft.name)
  assert.equal(mergeDraft({ ...current, slug: 'stable' }, draft, true, false).slug, 'stable')
  assert.equal(mergeDraft({ ...current, name: 'Typed during analysis' }, draft, true, true, current).name, 'Typed during analysis')
})

test('AI API enforces auth, origin, schema, limits and does not save a product', async () => {
  let calls = 0
  const store = createMemoryStore({ admins: ['user_admin'] })
  const api = createApiHandlers({ store, hashSecret: 'a-test-secret-at-least-32-characters-long', knownProducts: async () => new Set(), allowedOrigins: ['https://velto.test'], verifyAuth: async token => token ? { kind: 'user', userId: token } : { kind: 'guest' }, generateProduct: async () => { calls++; return draft } })
  const call = (token?: string, body: unknown = input, origin = 'https://velto.test') => api.admin(new Request('https://velto.test/api/admin/products/ai-generate', { method: 'POST', headers: { 'content-type': 'application/json', origin, ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }))
  assert.equal((await call()).status, 401)
  assert.equal((await call('user_other')).status, 403)
  assert.equal((await call('user_admin', input, 'https://evil.test')).status, 403)
  assert.equal((await call('user_admin', { images: [] })).status, 422)
  assert.equal(calls, 0)
  for (let n = 0; n < 4; n++) assert.equal((await call('user_admin')).status, 200)
  assert.equal((await call('user_admin')).status, 429)
  assert.equal(calls, 4)
  const products = await api.admin(new Request('https://velto.test/api/admin/products', { headers: { authorization: 'Bearer user_admin' } }))
  assert.deepEqual((await products.json()).products, [])
})

test('Ollama fallback runs once for provider errors, never for bad input', async () => {
  const { withProductFallback } = await import('../server/admin/aiProduct.js')
  const { HttpError } = await import('../server/http.js')
  let fallbacks = 0
  const fallback = async () => { fallbacks++; return draft }
  for (const status of [429, 502, 503, 504]) {
    assert.deepEqual(await withProductFallback(async () => { throw new HttpError(status, 'provider', 'failed') }, fallback)(input), draft)
  }
  assert.equal(fallbacks, 4)
  await assert.rejects(withProductFallback(async () => { throw new HttpError(422, 'invalid_image', 'bad') }, fallback)(input), errorCode('invalid_image'))
  assert.equal(fallbacks, 4)
  await withProductFallback(async () => draft, fallback)(input)
  assert.equal(fallbacks, 4)
  await createProductGenerator({ apiKey: 'test', provider: 'ollama', fetcher: async (url, init) => {
    assert.equal(url, 'https://ollama.com/v1/chat/completions')
    const body = JSON.parse(String(init?.body))
    assert.equal(body.model, 'gemma4:31b')
    assert.equal(body.max_tokens, 4000)
    return response(draft)
  } })(input)
})
