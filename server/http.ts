const baseHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...baseHeaders, ...headers } })
}

export function apiError(status: number, error: string, message: string, extra: Record<string, unknown> = {}, headers?: Record<string, string>) {
  return json({ error, message, ...extra }, status, headers)
}

export class HttpError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** Reads a JSON body with a hard size cap (checked on the declared length and the actual bytes). */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'Send the request as JSON.')
  }
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > maxBytes) throw new HttpError(413, 'payload_too_large', 'The request is too large.')
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new HttpError(413, 'payload_too_large', 'The request is too large.')
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'invalid_json', 'The request body is not valid JSON.')
  }
}

/** Platform-set client IP (Vercel overwrites these headers at the edge). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header) return null
  const match = /^Bearer\s+(\S+)$/i.exec(header)
  return match ? match[1] : ''
}
