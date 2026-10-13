import { getApiHandlers } from '../server/quotes/config.js'

/** POST /api/contact — contact form message (guest or verified user). */
export function POST(request: Request) {
  return getApiHandlers().contact(request)
}
