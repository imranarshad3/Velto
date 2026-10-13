export type HumanCheck = (token: string | undefined, ip: string) => Promise<boolean>

/** Cloudflare Turnstile verification; only enforced when TURNSTILE_SECRET_KEY is configured. */
export function createTurnstileCheck(secret: string): HumanCheck {
  return async (token, ip) => {
    if (!token) return false
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({ secret, response: token, ...(ip !== 'unknown' ? { remoteip: ip } : {}) }),
        signal: AbortSignal.timeout(5000),
      })
      const result = (await response.json()) as { success?: boolean }
      return result.success === true
    } catch {
      return false
    }
  }
}
