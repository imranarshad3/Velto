import { getApiHandlers } from '../../server/quotes/config.js'

/** GET /api/resources/download?id= — redirects to a short-lived signed URL for a published document. */
export function GET(request: Request) {
  return getApiHandlers().resourceDownload(request)
}
