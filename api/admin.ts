import { createOrdersHandler } from '../server/orders.js'
import { getApiHandlers } from '../server/quotes/config.js'

const orders = createOrdersHandler()
const handle = (request: Request) => {
  const url = new URL(request.url)
  const isOrders = url.pathname === '/api/orders' || url.pathname.startsWith('/api/orders/') || url.searchParams.get('path') === 'checkout-orders' || url.searchParams.get('path')?.startsWith('checkout-orders')
  return isOrders ? orders(request) : getApiHandlers().admin(request)
}

/**
 * /api/admin/* (rewritten to /api/admin?path=... in vercel.json). One function for all admin routes;
 * each request is authorised server-side (verified session + admin_members).
 */
export function GET(request: Request) {
  return handle(request)
}
export function POST(request: Request) {
  return handle(request)
}
export function PATCH(request: Request) {
  return handle(request)
}
export function PUT(request: Request) {
  return handle(request)
}
export function DELETE(request: Request) {
  return handle(request)
}
