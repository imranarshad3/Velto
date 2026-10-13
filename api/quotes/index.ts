import { getApiHandlers } from '../../server/quotes/config.js'

/** POST /api/quotes — submit a quote request (guest or verified Clerk user). */
export function POST(request: Request) {
  return getApiHandlers().submit(request)
}
