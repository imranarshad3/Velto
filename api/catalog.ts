import { getApiHandlers } from '../server/quotes/config.js'

/** GET /api/catalog — published products (public, edge-cacheable). */
export function GET(request: Request) {
  return getApiHandlers().catalog(request)
}
