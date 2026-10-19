import type { AdminProduct, AnalyticsRange, ProductActivity, ProductAnalytics, ProductAnalyticsRow } from '../../src/features/admin/types.js'

const DAY_MS = 86_400_000
const rangeDays: Record<Exclude<AnalyticsRange, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 }
/** Longest daily series drawn for "all time" (older activity still counts in totals). */
const MAX_SERIES_DAYS = 365

export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/**
 * First UTC day the store must return for a range. Covers the previous equal period (for comparison)
 * and the last 14 days (for trending). Null = all time.
 */
export function activitySince(range: AnalyticsRange, now: number): string | null {
  if (range === 'all') return null
  return isoDay(now - (Math.max(rangeDays[range] * 2, 14) - 1) * DAY_MS)
}

/** Pure aggregation of daily activity into rankings, totals and a chart series. */
export function buildProductAnalytics(range: AnalyticsRange, products: AdminProduct[], activity: ProductActivity, now: number): ProductAnalytics {
  const today = isoDay(now)
  const days = range === 'all' ? null : rangeDays[range]
  const from = days ? isoDay(now - (days - 1) * DAY_MS) : null
  const prevFrom = days ? isoDay(now - (days * 2 - 1) * DAY_MS) : null
  const trendFrom = isoDay(now - 6 * DAY_MS)
  const trendPrevFrom = isoDay(now - 13 * DAY_MS)
  const inRange = (day: string) => (!from || day >= from) && day <= today
  const inPrev = (day: string) => Boolean(prevFrom && from && day >= prevFrom && day < from)

  const rows = new Map<string, ProductAnalyticsRow & { trendPrev: number; trendCur: number }>()
  const row = (slug: string) => {
    let r = rows.get(slug)
    if (!r) {
      const p = products.find((x) => x.slug === slug)
      r = {
        slug,
        name: p?.name ?? slug,
        categorySlug: p?.categorySlug ?? '',
        categoryName: p?.categoryName,
        published: p?.published ?? false,
        views: 0,
        viewsAllTime: 0,
        quoteRequests: 0,
        requestedQuantity: {},
        unitsSold: null,
        quoteRate: null,
        trend: { current: 0, previous: 0, change: null },
        trendPrev: 0,
        trendCur: 0,
      }
      rows.set(slug, r)
    }
    return r
  }
  for (const p of products) row(p.slug)

  const series = new Map<string, { views: number; quoteRequests: number }>()
  const bump = (day: string, key: 'views' | 'quoteRequests', n: number) => {
    const point = series.get(day) ?? { views: 0, quoteRequests: 0 }
    point[key] += n
    series.set(day, point)
  }
  let prevViews = 0
  let prevQuotes = 0

  for (const v of activity.views) {
    const r = row(v.slug)
    if (inRange(v.day)) {
      r.views += v.n
      bump(v.day, 'views', v.n)
    }
    if (inPrev(v.day)) prevViews += v.n
    if (v.day >= trendFrom) r.trendCur += v.n
    else if (v.day >= trendPrevFrom) r.trendPrev += v.n
  }
  for (const q of activity.quotes) {
    const r = row(q.slug)
    if (inRange(q.day)) {
      r.quoteRequests += q.requests
      bump(q.day, 'quoteRequests', q.requests)
      if (q.unit && q.quantity) r.requestedQuantity[q.unit] = (r.requestedQuantity[q.unit] ?? 0) + q.quantity
    }
    if (inPrev(q.day)) prevQuotes += q.requests
    if (q.day >= trendFrom) r.trendCur += q.requests
    else if (q.day >= trendPrevFrom) r.trendPrev += q.requests
  }
  for (const t of activity.viewTotals) row(t.slug).viewsAllTime = t.n

  const result: ProductAnalyticsRow[] = [...rows.values()].map(({ trendCur, trendPrev, ...r }) => ({
    ...r,
    quoteRate: r.views > 0 ? r.quoteRequests / r.views : null,
    trend: { current: trendCur, previous: trendPrev, change: trendPrev > 0 ? (trendCur - trendPrev) / trendPrev : null },
  }))

  // Continuous daily series (zero-filled) so charts never imply missing days are gaps.
  const first = from ?? [...series.keys()].sort()[0] ?? today
  const start = Math.max(Date.parse(`${first}T00:00:00Z`), now - (MAX_SERIES_DAYS - 1) * DAY_MS)
  const filled: ProductAnalytics['series'] = []
  for (let t = Date.parse(`${isoDay(start)}T00:00:00Z`); isoDay(t) <= today; t += DAY_MS) {
    const day = isoDay(t)
    filled.push({ day, ...(series.get(day) ?? { views: 0, quoteRequests: 0 }) })
  }

  const sum = (key: 'views' | 'quoteRequests') => result.reduce((n, r) => n + r[key], 0)
  return {
    range,
    from,
    to: today,
    generatedAt: new Date(now).toISOString(),
    salesTracked: false,
    totals: { views: sum('views'), quoteRequests: sum('quoteRequests'), productsViewed: result.filter((r) => r.views > 0).length, unitsSold: null },
    previousTotals: days ? { views: prevViews, quoteRequests: prevQuotes } : null,
    series: filled,
    products: result.sort((a, b) => b.views - a.views || b.quoteRequests - a.quoteRequests || a.name.localeCompare(b.name)),
  }
}
