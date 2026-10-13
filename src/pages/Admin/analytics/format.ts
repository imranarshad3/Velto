import type { AnalyticsRange } from '../../../features/admin/types.ts'

export const fmt = new Intl.NumberFormat('en-GB')
export const pct = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 })
export const signedPct = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' })

export const rangeOptions: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
]

export const rangeLabel = (range: AnalyticsRange) => (range === 'all' ? 'all time' : `the last ${range.replace('d', '')} days`)

/** "120 bags · 40 kg" from per-unit totals; null when nothing was quantified. */
export function quantityText(quantities: Record<string, number>) {
  const parts = Object.entries(quantities)
    .sort((a, b) => b[1] - a[1])
    .map(([unit, n]) => `${fmt.format(n)} ${unit}`)
  return parts.length ? parts.join(' · ') : null
}

/** Relative change, or null when there is no baseline to compare with. */
export const change = (current: number, previous: number) => (previous > 0 ? (current - previous) / previous : null)
