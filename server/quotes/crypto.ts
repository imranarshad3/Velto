import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** Keyed hash so leaked database rows cannot be brute-forced without the server secret. */
export function hmac(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

/** 256-bit random guest tracking token, base64url (43 chars). */
export function newGuestToken(): string {
  return randomBytes(32).toString('base64url')
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
