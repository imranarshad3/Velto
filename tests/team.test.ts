import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { AuthVerifier } from '../server/quotes/auth.js'
import type { UserDirectory } from '../server/quotes/directory.js'
import { createApiHandlers } from '../server/quotes/handlers.js'
import { createMemoryStore } from '../server/quotes/memoryStore.js'

declare global {
  interface Response {
    // oxlint-disable-next-line typescript/no-explicit-any
    json(): Promise<any>
  }
}

const verifyAuth: AuthVerifier = async (token) => (token === null ? { kind: 'guest' } : token.startsWith('user_') ? { kind: 'user', userId: token } : { kind: 'invalid' })

/** Verified emails per Clerk user; `user_unverified` owns the invited address but has NOT verified it. */
const verified: Record<string, string[]> = {
  user_admin: ['boss@novaro.test'],
  user_new: ['new.admin@gmail.com'],
  user_other: ['someone@gmail.com'],
  user_unverified: [],
}
let sent: string[]
let store: ReturnType<typeof createMemoryStore>
let api: ReturnType<typeof createApiHandlers>
let offset = 0

beforeEach(() => {
  sent = []
  offset = 0
  store = createMemoryStore({ admins: ['user_admin'], now: () => Date.now() + offset })
  const directory: UserDirectory = {
    verifiedEmails: async (id) => verified[id] ?? [],
    sendInvite: async (email, url) => {
      sent.push(`${email} -> ${url}`)
      return email.endsWith('@gmail.com') ? 'sent' : 'existing_user'
    },
    describe: async (ids) => new Map(ids.map((id) => [id, { name: null, email: verified[id]?.[0] ?? null }])),
  }
  api = createApiHandlers({ store, verifyAuth, directory, hashSecret: 'team-test-secret-at-least-32-characters!!', knownProducts: async () => new Set(), allowedOrigins: ['https://novaro.example'] })
})

const call = (method: string, path: string, token?: string, body?: unknown) =>
  api.admin(
    new Request(`https://novaro.example/api/admin/${path}`, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
const isAdmin = async (token: string) => (await (await call('GET', 'me', token)).json()).isAdmin

describe('admin invitations', () => {
  it('only admins can view the team or invite', async () => {
    assert.equal((await call('GET', 'team')).status, 401)
    assert.equal((await call('GET', 'team', 'user_other')).status, 403)
    assert.equal((await call('POST', 'team/invites', 'user_other', { email: 'x@gmail.com' })).status, 403)
    assert.equal((await call('DELETE', 'team/members/user_admin', 'user_other')).status, 403)
    assert.equal((await call('GET', 'team', 'user_admin')).status, 200)
  })

  it('validates the email and emails a sign-up invitation', async () => {
    assert.equal((await call('POST', 'team/invites', 'user_admin', { email: 'not-an-email' })).status, 422)
    const res = await call('POST', 'team/invites', 'user_admin', { email: '  New.Admin@Gmail.com ' })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.equal(body.email, 'new.admin@gmail.com')
    assert.equal(body.delivery, 'sent')
    assert.equal(body.link, 'https://novaro.example/admin')
    assert.deepEqual(sent, ['new.admin@gmail.com -> https://novaro.example/sign-up?redirect_url=%2Fadmin'])
    assert.equal((await (await call('GET', 'team', 'user_admin')).json()).invites.length, 1)
  })

  it('grants admin only to a user whose verified email matches', async () => {
    await call('POST', 'team/invites', 'user_admin', { email: 'new.admin@gmail.com' })
    assert.equal(await isAdmin('user_other'), false)
    assert.equal(await isAdmin('user_unverified'), false)
    assert.equal(await isAdmin('user_new'), true)
    assert.equal((await call('GET', 'overview', 'user_new')).status, 200)
    const team = await (await call('GET', 'team', 'user_admin')).json()
    assert.deepEqual(team.members.map((m: { clerkUserId: string }) => m.clerkUserId).sort(), ['user_admin', 'user_new'])
    assert.equal(team.invites.length, 0)
  })

  it('does not grant access from revoked or expired invitations', async () => {
    const { id } = await (await call('POST', 'team/invites', 'user_admin', { email: 'new.admin@gmail.com' })).json()
    assert.equal((await call('DELETE', `team/invites/${id}`, 'user_admin')).status, 200)
    assert.equal(await isAdmin('user_new'), false)

    await call('POST', 'team/invites', 'user_admin', { email: 'new.admin@gmail.com' })
    offset = 8 * 86_400_000 // eight days later
    assert.equal(await isAdmin('user_new'), false)
  })

  it('refuses to invite an existing admin', async () => {
    assert.equal((await call('POST', 'team/invites', 'user_admin', { email: 'boss@novaro.test' })).status, 409)
  })

  it('removes other admins but never yourself or the last admin', async () => {
    assert.equal((await call('DELETE', 'team/members/user_admin', 'user_admin')).status, 409)
    await call('POST', 'team/invites', 'user_admin', { email: 'new.admin@gmail.com' })
    await isAdmin('user_new')
    assert.equal((await call('DELETE', 'team/members/user_new', 'user_admin')).status, 200)
    assert.equal(await isAdmin('user_new'), false)
    assert.equal((await call('DELETE', 'team/members/nobody', 'user_admin')).status, 404)
  })

  it('keeps the admin check working when invitations cannot be read', async () => {
    store.hasOpenAdminInvites = async () => {
      throw new Error('supabase open invites failed (PGRST205)')
    }
    const res = await call('GET', 'me', 'user_other')
    assert.equal(res.status, 200)
    assert.equal((await res.json()).isAdmin, false)
    assert.equal(await isAdmin('user_admin'), true)
  })
})
