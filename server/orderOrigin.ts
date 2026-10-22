import { z } from 'zod'

export const orderOriginSchema = z.object({
  city: z.string().trim().min(1).max(100).nullable(),
  countryCode: z.string().regex(/^[A-Z]{2}$/).nullable(),
}).strict()

/** Read coarse location supplied by the hosting edge, never browser JSON or raw IPs. */
export function requestOrderOrigin(request: Request, onVercel: boolean) {
  if (!onVercel) return null
  let city: string | null = null
  try {
    const decoded = decodeURIComponent(request.headers.get('x-vercel-ip-city') ?? '').trim()
    if (decoded.length <= 100 && /^[\p{L}\p{M}\p{N} .,'’()\-]+$/u.test(decoded)) city = decoded
  } catch { /* A missing or malformed hint must not block checkout. */ }
  const country = request.headers.get('x-vercel-ip-country')?.trim().toUpperCase() ?? ''
  const countryCode = /^[A-Z]{2}$/.test(country) ? country : null
  return city || countryCode ? { city, countryCode } : null
}
