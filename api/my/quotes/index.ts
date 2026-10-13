import { getApiHandlers } from '../../../server/quotes/config.js'

/** GET /api/my/quotes — the verified Clerk user's own quotes only. */
export function GET(request: Request) {
  return getApiHandlers().myQuotes(request)
}
