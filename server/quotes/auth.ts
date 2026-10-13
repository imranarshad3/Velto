import { verifyToken } from '@clerk/backend'

export type AuthResult = { kind: 'guest' } | { kind: 'user'; userId: string } | { kind: 'invalid' }

export type AuthVerifier = (token: string | null) => Promise<AuthResult>

interface ClerkConfig {
  secretKey?: string
  jwtKey?: string
  authorizedParties: string[]
}

/**
 * Verifies a Clerk session token sent as `Authorization: Bearer`. Identity comes ONLY from the
 * verified `sub` claim; any user ID in the request body is ignored by the handlers.
 */
export function createClerkVerifier(config: ClerkConfig): AuthVerifier {
  return async (token) => {
    if (token === null) return { kind: 'guest' }
    if (!token || (!config.secretKey && !config.jwtKey)) return { kind: 'invalid' }
    try {
      const result = await verifyToken(token, {
        secretKey: config.secretKey,
        jwtKey: config.jwtKey,
        authorizedParties: config.authorizedParties.length ? config.authorizedParties : undefined,
      })
      const sub = (result.data as { sub?: unknown } | undefined)?.sub
      return typeof sub === 'string' && sub ? { kind: 'user', userId: sub } : { kind: 'invalid' }
    } catch {
      return { kind: 'invalid' }
    }
  }
}
