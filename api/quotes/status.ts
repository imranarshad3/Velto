import { getApiHandlers } from '../../server/quotes/config.js'

/** POST /api/quotes/status — guest lookup; requires reference AND the secret tracking code. */
export function POST(request: Request) {
  return getApiHandlers().guestStatus(request)
}
