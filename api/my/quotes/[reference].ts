import { getApiHandlers } from '../../../server/quotes/config.js'

/** GET /api/my/quotes/:reference — one of the verified user's own quotes (404 for anyone else's). */
export function GET(request: Request) {
  return getApiHandlers().myQuoteDetail(request)
}
