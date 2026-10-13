import { createClerkClient } from '@clerk/backend'

export type InviteDelivery = 'sent' | 'existing_user' | 'not_sent'

/** Server-side view of Clerk users. Email verification status comes only from Clerk, never from the request. */
export interface UserDirectory {
  /** The user's verified email addresses (lower-cased); empty when unknown. */
  verifiedEmails(userId: string): Promise<string[]>
  /** Emails a Clerk sign-up invitation unless the address already has an account. */
  sendInvite(email: string, redirectUrl: string): Promise<InviteDelivery>
  /** Display details for admin listings. */
  describe(userIds: string[]): Promise<Map<string, { name: string | null; email: string | null }>>
}

export function createClerkDirectory(secretKey: string | undefined): UserDirectory | null {
  if (!secretKey) return null
  const clerk = createClerkClient({ secretKey })
  return {
    async verifiedEmails(userId) {
      const user = await clerk.users.getUser(userId)
      return user.emailAddresses.filter((e) => e.verification?.status === 'verified').map((e) => e.emailAddress.toLowerCase())
    },
    async sendInvite(email, redirectUrl) {
      try {
        const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 1 })
        if (existing.totalCount > 0) return 'existing_user'
        await clerk.invitations.createInvitation({ emailAddress: email, redirectUrl, notify: true, ignoreExisting: true })
        return 'sent'
      } catch (error) {
        console.error('[admin] invitation email not sent:', error instanceof Error ? error.message : 'unknown error')
        return 'not_sent'
      }
    },
    async describe(userIds) {
      const out = new Map<string, { name: string | null; email: string | null }>()
      if (!userIds.length) return out
      const { data } = await clerk.users.getUserList({ userId: userIds, limit: 100 })
      for (const u of data) {
        const primary = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId) ?? u.emailAddresses[0]
        out.set(u.id, { name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || null, email: primary?.emailAddress ?? null })
      }
      return out
    },
  }
}

/** LOCAL TESTING ONLY (with NOVARO_DEV_FAKE_AUTH): `dev_*` users own a verified `<id>@example.test` address. */
export function withDevDirectory(directory: UserDirectory | null): UserDirectory {
  const devEmail = (id: string) => `${id}@example.test`
  return {
    verifiedEmails: async (id) => (id.startsWith('dev_') ? [devEmail(id)] : (directory?.verifiedEmails(id) ?? [])),
    sendInvite: async (email, url) => (email.endsWith('@example.test') ? 'existing_user' : (directory?.sendInvite(email, url) ?? 'not_sent')),
    describe: async (ids) => {
      const out = (await directory?.describe(ids.filter((id) => !id.startsWith('dev_')))) ?? new Map()
      for (const id of ids) if (id.startsWith('dev_')) out.set(id, { name: id.replace('dev_', '').replace('_', ' '), email: devEmail(id) })
      return out
    },
  }
}
