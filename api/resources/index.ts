import { getApiHandlers } from '../../server/quotes/config.js'

/** GET /api/resources — published technical documents and verified coverage data (public, edge-cacheable). */
export function GET(request: Request) {
  return getApiHandlers().resources(request)
}
