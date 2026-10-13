import { getApiHandlers } from '../../server/quotes/config.js'

/** GET/PUT /api/my/wishlist — the verified user's saved products. */
export function GET(request: Request) {
  return getApiHandlers().wishlist(request)
}

export function PUT(request: Request) {
  return getApiHandlers().wishlist(request)
}
