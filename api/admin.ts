import { getApiHandlers } from '../server/quotes/config.js'

/**
 * /api/admin/* (rewritten to /api/admin?path=... in vercel.json). One function for all admin routes;
 * each request is authorised server-side (verified session + admin_members).
 */
export function GET(request: Request) {
  return getApiHandlers().admin(request)
}
export function POST(request: Request) {
  return getApiHandlers().admin(request)
}
export function PATCH(request: Request) {
  return getApiHandlers().admin(request)
}
