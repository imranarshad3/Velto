import { getApiHandlers } from '../../server/quotes/config.js'

/** POST /api/track/view — server-side product view counting (deduplicated, bot-filtered). */
export function POST(request: Request) {
  return getApiHandlers().trackView(request)
}
