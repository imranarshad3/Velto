import { verifyToken } from '@clerk/backend'

/**
 * Why a bearer token was not accepted:
 * - `expired`: the session token is past `exp` / not yet valid (client should refresh and retry once)
 * - `rejected`: signature, issuer or authorized-party (azp) mismatch — not an expiry, usually configuration
 * - `unconfigured`: no Clerk verification key on the server
 * - `unavailable`: Clerk's signing keys could not be fetched (network/outage)
 */
export type AuthFailureReason = 'expired' | 'rejected' | 'unconfigured' | 'unavailable'

export type AuthResult = { kind: 'guest' } | { kind: 'user'; userId: string } | { kind: 'invalid'; reason?: AuthFailureReason }

/** `origin` is the origin the API itself is served from (the request URL); it is always an acceptable `azp`. */
export type AuthVerifier = (token: string | null, origin?: string) => Promise<AuthResult>

interface ClerkConfig {
  secretKey?: string
  jwtKey?: string
  authorizedParties: string[]
}

const EXPIRED = new Set(['token-expired', 'token-not-active-yet', 'token-iat-in-the-future'])
const UNAVAILABLE = new Set(['jwk-remote-failed-to-load', 'jwk-failed-to-resolve', 'jwk-remote-missing', 'jwk-local-missing'])

function failureReason(error: unknown): AuthFailureReason {
  const reason = (error as { reason?: string } | null)?.reason ?? ''
  if (EXPIRED.has(reason)) return 'expired'
  if (UNAVAILABLE.has(reason) || /fetch|network|ECONN|ENOTFOUND|timed? ?out/i.test(String((error as Error)?.message))) return 'unavailable'
  return 'rejected'
}

/** Never logs the token: only the claim that failed and the non-secret `azp`/origin values. */
function logRejection(error: unknown, token: string, parties: string[] | undefined) {
  let azp: unknown
  try {
    azp = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString()).azp
  } catch {
    azp = undefined
  }
  const reason = (error as { reason?: string } | null)?.reason ?? 'unknown'
  console.warn(`[auth] Clerk token rejected (${reason}); token azp=${JSON.stringify(azp ?? null)}, accepted parties=${JSON.stringify(parties ?? 'any')}`)
}

/**
 * Verifies a Clerk session token sent as `Authorization: Bearer`. Identity comes ONLY from the
 * verified `sub` claim; any user ID in the request body is ignored by the handlers.
 */
export function createClerkVerifier(config: ClerkConfig): AuthVerifier {
  return async (token, origin) => {
    if (token === null) return { kind: 'guest' }
    if (!token) return { kind: 'invalid', reason: 'rejected' }
    if (!config.secretKey && !config.jwtKey) {
      console.error('[auth] CLERK_SECRET_KEY / CLERK_JWT_KEY not set: signed-in requests cannot be verified')
      return { kind: 'invalid', reason: 'unconfigured' }
    }
    // azp is enforced when parties are configured; the API's own origin is always a legitimate party
    // (frontend and API are same-origin), so previews/127.0.0.1/other ports do not break verification.
    const parties = config.authorizedParties.length ? [...new Set([...config.authorizedParties, ...(origin ? [origin] : [])])] : undefined
    try {
      const result = await verifyToken(token, { secretKey: config.secretKey, jwtKey: config.jwtKey, authorizedParties: parties })
      const sub = (result.data as { sub?: unknown } | undefined)?.sub ?? (result as { sub?: unknown }).sub
      return typeof sub === 'string' && sub ? { kind: 'user', userId: sub } : { kind: 'invalid', reason: 'rejected' }
    } catch (error) {
      const reason = failureReason(error)
      if (reason !== 'expired') logRejection(error, token, parties)
      return { kind: 'invalid', reason }
    }
  }
}
