import assert from 'node:assert/strict'
import { createSign, generateKeyPairSync } from 'node:crypto'
import { describe, it } from 'node:test'
import { createClerkVerifier, type AuthResult, type AuthVerifier } from '../server/quotes/auth.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'

declare global {
  interface Response {
    // oxlint-disable-next-line typescript/no-explicit-any
    json(): Promise<any>
  }
}

// Real RS256 tokens verified networklessly through `jwtKey` (the same code path as production verification).
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const other = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwtKey = publicKey.export({ type: 'spki', format: 'pem' }).toString()
const SITE = 'http://localhost:5173'

function token(claims: Record<string, unknown>, key = privateKey) {
  const now = Math.floor(Date.now() / 1000)
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const body = `${enc({ alg: 'RS256', typ: 'JWT', kid: 'ins_test' })}.${enc({ sub: 'user_new', iat: now, nbf: now - 10, exp: now + 60, iss: 'https://clerk.example', azp: SITE, ...claims })}`
  return `${body}.${createSign('RSA-SHA256').update(body).sign(key).toString('base64url')}`
}

const verify = createClerkVerifier({ jwtKey, authorizedParties: [SITE] })
const quiet = async (fn: () => Promise<AuthResult>) => {
  const warn = console.warn
  const error = console.error
  console.warn = console.error = () => {}
  try {
    return await fn()
  } finally {
    console.warn = warn
    console.error = error
  }
}

describe('Clerk session verification', () => {
  it('accepts a token minted immediately after sign-in', async () => {
    assert.deepEqual(await verify(token({}), SITE), { kind: 'user', userId: 'user_new' })
  })

  it('accepts the API’s own origin as authorized party (127.0.0.1, other ports, previews)', async () => {
    const origin = 'http://127.0.0.1:5173'
    assert.deepEqual(await verify(token({ azp: origin }), origin), { kind: 'user', userId: 'user_new' })
  })

  it('rejects a token issued for another site — as "rejected", not "expired"', async () => {
    assert.deepEqual(await quiet(() => verify(token({ azp: 'https://evil.example' }), SITE)), { kind: 'invalid', reason: 'rejected' })
  })

  it('classifies a genuinely expired token as expired', async () => {
    const past = Math.floor(Date.now() / 1000) - 600
    assert.deepEqual(await verify(token({ iat: past, nbf: past, exp: past + 60 }), SITE), { kind: 'invalid', reason: 'expired' })
  })

  it('rejects a token signed by a different Clerk instance', async () => {
    assert.deepEqual(await quiet(() => verify(token({}, other.privateKey), SITE)), { kind: 'invalid', reason: 'rejected' })
  })

  it('reports missing server keys as unconfigured, never as an expired session', async () => {
    const unconfigured = createClerkVerifier({ authorizedParties: [] })
    assert.deepEqual(await quiet(() => unconfigured(token({}), SITE)), { kind: 'invalid', reason: 'unconfigured' })
    assert.deepEqual(await unconfigured(null), { kind: 'guest' })
  })
})

describe('auth failure responses', () => {
  const handlersWith = (verifyAuth: AuthVerifier) =>
    createApiHandlers({ store: createMemoryStore(), verifyAuth, hashSecret: 'x'.repeat(40), knownProducts: async () => new Set(), allowedOrigins: [SITE] })
  const myQuotes = (verifyAuth: AuthVerifier) =>
    handlersWith(verifyAuth).myQuotes(new Request(`${SITE}/api/my/quotes`, { headers: { authorization: 'Bearer t', origin: SITE } }))

  const cases: [AuthResult, number, string][] = [
    [{ kind: 'invalid', reason: 'expired' }, 401, 'session_invalid'],
    [{ kind: 'invalid' }, 401, 'session_invalid'],
    [{ kind: 'invalid', reason: 'rejected' }, 401, 'session_rejected'],
    [{ kind: 'invalid', reason: 'unconfigured' }, 503, 'auth_unavailable'],
    [{ kind: 'invalid', reason: 'unavailable' }, 503, 'auth_unavailable'],
  ]
  for (const [result, status, code] of cases) {
    it(`${JSON.stringify(result)} → ${status} ${code}`, async () => {
      const res = await myQuotes(async () => result)
      assert.equal(res.status, status)
      assert.equal((await res.json()).error, code)
    })
  }

  it('a valid session gets its own (empty) quote list, and the verifier receives the request origin', async () => {
    let seenOrigin: string | undefined
    const res = await myQuotes(async (_t, origin) => {
      seenOrigin = origin
      return { kind: 'user', userId: 'user_new' }
    })
    assert.equal(res.status, 200)
    assert.deepEqual((await res.json()).quotes, [])
    assert.equal(seenOrigin, SITE)
  })
})
