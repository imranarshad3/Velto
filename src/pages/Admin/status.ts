import type { QuoteStatus } from '../../features/quotes/schema.ts'

/** Badge tone for each quote status. */
export const statusTone = (s: QuoteStatus) => (s === 'quoted' ? 'green' : s === 'closed' ? 'muted' : s === 'reviewing' ? 'copper' : 'soft')
