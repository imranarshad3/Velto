import { getApiHandlers } from '../server/quotes/config.js'
export function GET() { return getApiHandlers().content() }
