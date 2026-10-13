import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowDown, ArrowUp, ArrowUpDown, BadgeCheck, Eye, Flame, MessageSquareQuote, MousePointerClick, Package, ShoppingBag } from 'lucide-react'
import StatCard from '../../components/ui/StatCard.tsx'
import { demoCategories } from '../../data/demoCategories.ts'
import { adminApi } from '../../features/admin/api.ts'
import { analyticsRanges, type AnalyticsRange, type ProductAnalyticsRow } from '../../features/admin/types.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import RankList from './analytics/RankList.tsx'
import TrendChart from './analytics/TrendChart.tsx'
import { change, fmt, pct, quantityText, rangeLabel, rangeOptions, signedPct } from './analytics/format.ts'
import { FilterTabs, Panel, ResultCount, SearchInput, td, th, tr } from './ui.tsx'

const categoryName = new Map(demoCategories.map((c) => [c.slug, c.name]))
const VIEWS = 'var(--color-chart-views)'
const QUOTES = 'var(--color-chart-quotes)'

type SortKey = 'views' | 'viewsAllTime' | 'quoteRequests' | 'quoteRate' | 'trend'
const sortValue: Record<SortKey, (r: ProductAnalyticsRow) => number> = {
  views: (r) => r.views,
  viewsAllTime: (r) => r.viewsAllTime,
  quoteRequests: (r) => r.quoteRequests,
  quoteRate: (r) => r.quoteRate ?? -1,
  trend: (r) => r.trend.current - r.trend.previous,
}

/** Change vs the previous equal period, as a neutral (not good/bad) annotation. */
function Delta({ current, previous, range }: { current: number; previous: number | undefined; range: AnalyticsRange }) {
  if (previous === undefined) return <>Since tracking began</>
  const c = change(current, previous)
  const Icon = c === null || c === 0 ? null : c > 0 ? ArrowUp : ArrowDown
  return (
    <span className="inline-flex items-center gap-1">
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {c === null ? (current > 0 ? `None in the previous ${range.replace('d', '')} days` : 'No change') : `${signedPct.format(c)} vs previous ${range.replace('d', '')} days`}
    </span>
  )
}

function TrendBadge({ trend }: { trend: ProductAnalyticsRow['trend'] }) {
  const diff = trend.current - trend.previous
  if (!trend.current && !trend.previous) return <span className="text-muted">—</span>
  const Icon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.8125rem] font-semibold tabular-nums ${diff > 0 ? 'bg-forest-soft text-forest' : 'bg-sand text-ink'}`}>
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {trend.change === null ? (diff > 0 ? 'New' : '0%') : signedPct.format(trend.change)}
      <span className="sr-only"> ({trend.current} activity this week, {trend.previous} the week before)</span>
    </span>
  )
}

export default function AdminAnalyticsPage() {
  const [params, setParams] = useSearchParams()
  const param = params.get('range') as AnalyticsRange
  const range: AnalyticsRange = analyticsRanges.includes(param) ? param : '30d'
  const [state, reload] = useAuthedRemote((t) => adminApi.analytics(t, range), `analytics-${range}`)
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'views', dir: -1 })

  const setRange = (value: AnalyticsRange) =>
    setParams(
      (p) => {
        if (value === '30d') p.delete('range')
        else p.set('range', value)
        return p
      },
      { replace: true },
    )

  const sortHeader = (key: SortKey, label: string) => {
    const activeSort = sort.key === key
    const Icon = !activeSort ? ArrowUpDown : sort.dir === -1 ? ArrowDown : ArrowUp
    return (
      <th scope="col" className={`${th} text-right`} aria-sort={activeSort ? (sort.dir === -1 ? 'descending' : 'ascending') : 'none'}>
        <button type="button" onClick={() => setSort({ key, dir: activeSort ? (sort.dir === -1 ? 1 : -1) : -1 })} className="ml-auto inline-flex min-h-11 items-center gap-1 tracking-[0.08em] uppercase hover:text-ink">
          {label}
          <Icon aria-hidden="true" className={`size-3.5 ${activeSort ? 'text-forest' : 'opacity-50'}`} />
        </button>
      </th>
    )
  }

  return (
    <>
      <title>Product analytics — Admin — VELTO</title>
      <AdminHeading title="Product analytics" crumbs={[{ label: 'Analytics' }]} actions={<FilterTabs label="Date range" options={rangeOptions} value={range} onChange={setRange} />}>
        Real product views and quote demand. Views are counted on the server once per visitor, product and day; bots and crawlers are excluded.
      </AdminHeading>

      <RemoteState state={state} reload={reload} skeleton={4}>
        {(a) => {
          const prev = a.previousTotals ?? undefined
          const quoteRate = a.totals.views ? a.totals.quoteRequests / a.totals.views : null
          const top = (rows: ProductAnalyticsRow[]) => rows.slice(0, 5)
          const mostViewed = top(a.products.filter((r) => r.views > 0))
          const mostRequested = top(a.products.filter((r) => r.quoteRequests > 0).sort((x, y) => y.quoteRequests - x.quoteRequests || y.views - x.views))
          const trending = top(
            a.products
              .filter((r) => r.trend.current > r.trend.previous)
              .sort((x, y) => y.trend.current - y.trend.previous - (x.trend.current - x.trend.previous) || y.trend.current - x.trend.current),
          )

          const term = filter.trim().toLowerCase()
          const rows = a.products
            .filter((r) => !term || [r.name, r.slug, categoryName.get(r.categorySlug) ?? ''].some((v) => v.toLowerCase().includes(term)))
            .sort((x, y) => (sortValue[sort.key](x) - sortValue[sort.key](y)) * sort.dir || x.name.localeCompare(y.name))

          const kpis = [
            { label: 'Product views', value: fmt.format(a.totals.views), hint: <Delta current={a.totals.views} previous={prev?.views} range={range} />, icon: Eye, tone: 'forest' as const },
            { label: 'Quote requests', value: fmt.format(a.totals.quoteRequests), hint: <Delta current={a.totals.quoteRequests} previous={prev?.quoteRequests} range={range} />, icon: MessageSquareQuote, tone: 'copper' as const },
            { label: 'View-to-quote rate', value: quoteRate === null ? '—' : pct.format(quoteRate), hint: 'Quote requests per product view', icon: MousePointerClick, tone: 'ink' as const },
            { label: 'Products viewed', value: <>{a.totals.productsViewed}<span className="text-[0.55em] text-muted">/{a.products.length}</span></>, hint: `At least one view in ${rangeLabel(range)}`, icon: Package, tone: 'forest' as const },
            { label: 'Verified sales', value: <span className="text-[0.6em] text-muted">No sales data</span>, hint: 'Shown once verified orders exist', icon: ShoppingBag, tone: 'ink' as const },
          ]

          return (
            <div className="flex flex-col gap-[clamp(1.25rem,2.5vw,1.75rem)]">
              <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-[var(--grid-gap)] sm:gap-4">
                {kpis.map(({ label, ...k }) => (
                  <li key={label} className="min-w-0">
                    <StatCard label={label} {...k} />
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-[minmax(0,1fr)] gap-[clamp(1.25rem,2.5vw,1.75rem)] xl:grid-cols-2">
                <Panel id="views-chart" title="Product views per day" description={`${fmt.format(a.totals.views)} views in ${rangeLabel(range)} (UTC days)`}>
                  <TrendChart label="Product views per day" unit={['view', 'views']} color={VIEWS} data={a.series.map((p) => ({ day: p.day, value: p.views }))} />
                </Panel>
                <Panel id="quotes-chart" title="Quote requests per day" description="Requests that include at least one product">
                  <TrendChart label="Quote requests per day" unit={['request', 'requests']} color={QUOTES} data={a.series.map((p) => ({ day: p.day, value: p.quoteRequests }))} />
                </Panel>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-[clamp(1.25rem,2.5vw,1.75rem)]">
                <RankList
                  id="rank-viewed"
                  title="Most viewed"
                  description={`Unique daily views, ${rangeLabel(range)}`}
                  icon={Eye}
                  color={VIEWS}
                  items={mostViewed.map((r) => ({ slug: r.slug, name: r.name, value: r.views, detail: `${fmt.format(r.viewsAllTime)} all-time views` }))}
                  empty="No product views recorded yet in this period."
                />
                <RankList
                  id="rank-requested"
                  title="Most requested"
                  description={`Quote requests, ${rangeLabel(range)}`}
                  icon={MessageSquareQuote}
                  color={QUOTES}
                  items={mostRequested.map((r) => ({ slug: r.slug, name: r.name, value: r.quoteRequests, detail: quantityText(r.requestedQuantity) ?? 'No quantities given' }))}
                  empty="No quote requests in this period."
                />
                <RankList
                  id="rank-trending"
                  title="Trending"
                  description="Views + requests, last 7 days vs the 7 before"
                  icon={Flame}
                  color={VIEWS}
                  items={trending.map((r) => ({
                    slug: r.slug,
                    name: r.name,
                    value: r.trend.current - r.trend.previous,
                    display: <>+{fmt.format(r.trend.current - r.trend.previous)}</>,
                    detail: `${r.trend.current} this week · ${r.trend.previous} the week before`,
                  }))}
                  empty="No product is gaining activity this week."
                />
                <RankList
                  id="rank-sold"
                  title="Most sold"
                  description="Verified completed sales and units sold"
                  icon={BadgeCheck}
                  color={VIEWS}
                  items={[]}
                  empty={
                    <span>
                      <strong className="block text-ink">No sales data</strong>
                      Quote requests are not sales. Rankings appear once verified orders are recorded.
                    </span>
                  }
                />
              </div>

              <Panel
                id="performance-title"
                title="Product performance"
                description={`Every product, ${rangeLabel(range)}. Trend compares the last 7 days with the 7 before.`}
                bodyClassName="p-0"
                action={<SearchInput id="analytics-filter" label="Filter products" value={filter} onChange={setFilter} placeholder="Filter products" className="w-full sm:w-[18rem]" />}
              >
                <div className="px-5 pt-3">
                  <ResultCount>
                    {rows.length} of {a.products.length} products
                  </ResultCount>
                </div>
                <div className="hidden lg:block">
                  <table className="w-full border-separate border-spacing-0 text-[0.9375rem]">
                    <caption className="sr-only">Product performance, sortable by column</caption>
                    <thead>
                      <tr>
                        <th scope="col" className={th}>
                          Product
                        </th>
                        {sortHeader('views', 'Views')}
                        {sortHeader('viewsAllTime', 'All-time')}
                        {sortHeader('quoteRequests', 'Requests')}
                        {sortHeader('quoteRate', 'Quote rate')}
                        <th scope="col" className={`${th} text-right`}>
                          Sales
                        </th>
                        {sortHeader('trend', 'Trend')}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.slug} className={tr}>
                          <td className={td}>
                            <Link to={`/admin/products/${r.slug}`} className="font-semibold text-ink before:absolute before:inset-0 hover:text-forest">
                              {r.name}
                            </Link>
                            <span className="block text-[0.8125rem] text-muted">
                              {categoryName.get(r.categorySlug) ?? r.slug}
                              {!r.published && ' · Hidden'}
                              {quantityText(r.requestedQuantity) && ` · ${quantityText(r.requestedQuantity)}`}
                            </span>
                          </td>
                          <td className={`${td} text-right font-semibold tabular-nums`}>{fmt.format(r.views)}</td>
                          <td className={`${td} text-right text-muted tabular-nums`}>{fmt.format(r.viewsAllTime)}</td>
                          <td className={`${td} text-right tabular-nums`}>{fmt.format(r.quoteRequests)}</td>
                          <td className={`${td} text-right tabular-nums`}>{r.quoteRate === null ? '—' : pct.format(r.quoteRate)}</td>
                          <td className={`${td} text-right text-[0.8125rem] text-muted`}>No sales data</td>
                          <td className={`${td} text-right`}>
                            <TrendBadge trend={r.trend} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-border lg:hidden">
                  {rows.map((r) => (
                    <li key={r.slug}>
                      <Link to={`/admin/products/${r.slug}`} className="block p-4 hover:bg-cream/60">
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0 font-semibold text-ink">{r.name}</span>
                          <TrendBadge trend={r.trend} />
                        </span>
                        <dl className="mt-3 grid grid-cols-3 gap-2 text-[0.8125rem]">
                          {[
                            ['Views', fmt.format(r.views)],
                            ['Requests', fmt.format(r.quoteRequests)],
                            ['Quote rate', r.quoteRate === null ? '—' : pct.format(r.quoteRate)],
                          ].map(([k, v]) => (
                            <div key={k} className="rounded-lg bg-canvas px-2.5 py-2">
                              <dt className="text-muted">{k}</dt>
                              <dd className="font-semibold text-ink tabular-nums">{v}</dd>
                            </div>
                          ))}
                        </dl>
                        <span className="mt-2 block text-[0.75rem] text-muted">
                          {fmt.format(r.viewsAllTime)} all-time views · No sales data
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
              <p className="text-[0.75rem] text-muted">Updated {new Date(a.generatedAt).toLocaleString('en-GB')}. Views are pseudonymous: no IP addresses are stored.</p>
            </div>
          )
        }}
      </RemoteState>
    </>
  )
}
