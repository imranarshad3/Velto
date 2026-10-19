import { getApiHandlers } from '../server/quotes/config.js'
export function GET(request: Request) { return getApiHandlers().content(request) }
