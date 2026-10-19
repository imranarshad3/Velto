import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Banknote, ChevronRight, ClipboardList, Package, RefreshCw, TrendingUp, Truck, X } from 'lucide-react'
import type { AdminOrder } from './schema.ts'
import { orderDate, orderMetrics, orderMoney, unitsOf, visibleOrders } from './orderView.ts'
import { fulfilmentSteps, statusLabels } from './tracking.ts'
import { JourneyBar, StatusPill } from './TrackingUI.tsx'
import StatCard from '../../components/ui/StatCard.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { FilterTabs, Panel, ResultCount, SearchInput, cardList, td, th, tr } from '../../pages/Admin/ui.tsx'
import TrendChart from '../../pages/Admin/analytics/TrendChart.tsx'
import { change, signedPct } from '../../pages/Admin/analytics/format.ts'

const PAGE = 25
const compact = (n: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', notation: n >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: n >= 100_000 ? 1 : 0 }).format(n)
const pipelineTone: Record<string, string> = {
  placed: 'bg-copper',
  confirmed: 'bg-forest-mid',
  processing: 'bg-forest',
  shipped: 'bg-[#2c4a7a]',
  out_for_delivery: 'bg-[#4d6fa8]',
  delivered: 'bg-success',
  cancelled: 'bg-sand-deep',
}

/** Admin order desk: KPIs, pipeline, trend, filters and the order table. */
export default function AdminOrderWorkspace({ orders, reload }: { orders: AdminOrder[]; reload: () => void }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('open')
  const [range, setRange] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const m = orderMetrics(orders)
  const filtered = visibleOrders(orders, search, status, sort, range)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const current = Math.min(page, pages)
  const shown = filtered.slice((current - 1) * PAGE, current * PAGE)
  const weekly = change(m.last7, m.prev7)
  const set = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1) }
  const filtering = search || status !== 'open' || range !== 'all'

  return (
    <div className="flex min-w-0 flex-col gap-[var(--grid-gap)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-[var(--grid-gap)]">
        <StatCard icon={ClipboardList} label="Open orders" value={m.open} hint={`${compact(m.openValue)} awaiting delivery`} />
        <StatCard icon={Banknote} tone="copper" label="Collected (delivered)" value={compact(m.collected)} hint="Cash on Delivery received" />
        <StatCard icon={TrendingUp} tone="gold" label="Average order" value={compact(m.averageValue)} hint="Excludes cancelled orders" />
        <StatCard icon={Truck} tone="ink" label="Orders, last 7 days" value={m.last7} hint={weekly === null ? 'No orders the week before' : `${signedPct.format(weekly)} vs previous 7 days`} />
      </div>

      <div className="grid min-w-0 gap-[var(--grid-gap)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel id="pipeline-title" title="Fulfilment pipeline" description={`${m.total} orders · ${(m.cancelRate * 100).toFixed(m.cancelRate ? 1 : 0)}% cancelled`}>
          <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-sand">
            {m.total > 0 && [...fulfilmentSteps, 'cancelled'].map(s => m.byStatus[s] ? <span key={s} style={{ width: `${(m.byStatus[s] / m.total) * 100}%` }} className={`${pipelineTone[s]} h-full border-r border-surface last:border-r-0`} /> : null)}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            {[...fulfilmentSteps, 'cancelled'].map(s => (
              <li key={s}>
                <button type="button" onClick={() => set(setStatus)(s)} aria-pressed={status === s} className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[0.875rem] transition-colors hover:bg-cream ${status === s ? 'bg-cream font-semibold' : ''}`}>
                  <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${pipelineTone[s]}`} />
                  <span className="min-w-0 flex-1 truncate text-muted">{statusLabels[s]}</span>
                  <span className="font-semibold text-ink tabular-nums">{m.byStatus[s]}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel id="trend-title" title="Orders per day" description="Last 14 days, excluding cancelled">
          <TrendChart label="Orders per day" unit={['order', 'orders']} color="var(--color-forest)" data={m.daily} />
        </Panel>
      </div>

      <section aria-label="Orders" className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <FilterTabs
            label="Order status"
            value={['open', 'all', 'delivered', 'cancelled'].includes(status) ? status : 'custom'}
            onChange={v => v !== 'custom' && set(setStatus)(v)}
            options={[
              { value: 'open', label: `Open (${m.open})` },
              { value: 'delivered', label: `Delivered (${m.byStatus.delivered})` },
              { value: 'cancelled', label: `Cancelled (${m.byStatus.cancelled})` },
              { value: 'all', label: `All (${m.total})` },
            ]}
          />
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <SearchInput id="order-search" label="Search orders" value={search} onChange={set(setSearch)} placeholder="Reference, tracking ID, customer, phone…" className="sm:col-span-4 lg:col-span-1" />
            <label htmlFor="order-range" className="sr-only">Date range</label>
            <select id="order-range" value={range} onChange={e => set(setRange)(e.target.value)} className={`${inputClass} sm:min-w-[10rem]`}>
              <option value="all">Any date</option>
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <label htmlFor="order-sort" className="sr-only">Sort orders</label>
            <select id="order-sort" value={sort} onChange={e => setSort(e.target.value)} className={`${inputClass} sm:min-w-[10rem]`}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="value">Highest total</option>
            </select>
            <button type="button" onClick={reload} className={buttonClass('secondary', 'md', 'px-3.5')}><RefreshCw aria-hidden="true" className="size-4" /><span className="sr-only sm:not-sr-only">Refresh</span></button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ResultCount>
            {filtered.length} of {orders.length} orders{!['open', 'all', 'delivered', 'cancelled'].includes(status) && ` · ${statusLabels[status]}`}{orders.length >= 500 && ' · latest 500 loaded'}
          </ResultCount>
          {filtering && (
            <button type="button" onClick={() => { setSearch(''); setStatus('open'); setRange('all'); setPage(1) }} className="inline-flex min-h-11 items-center gap-1 text-[0.875rem] font-semibold text-forest">
              <X aria-hidden="true" className="size-4" />Clear filters
            </button>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-5 py-14 text-center">
            <Package aria-hidden="true" className="mx-auto size-9 text-forest/60" />
            <h2 className="mt-4 font-display text-[1.5rem]">{orders.length ? 'No matching orders' : 'Ready for your first order'}</h2>
            <p className="mx-auto mt-2 max-w-sm text-[0.875rem] text-muted">{orders.length ? 'Try another reference, customer, status or date range.' : 'Customer purchases will appear here with delivery details and status controls.'}</p>
          </div>
        ) : (
          <>
            <div className="surface-card hidden overflow-clip md:block">
              <table className="w-full border-separate border-spacing-0 text-[0.9375rem]">
                <caption className="sr-only">Orders</caption>
                <thead>
                  <tr>
                    <th scope="col" className={th}>Order</th>
                    <th scope="col" className={th}>Customer</th>
                    <th scope="col" className={`${th} hidden lg:table-cell`}>Progress</th>
                    <th scope="col" className={th}>Status</th>
                    <th scope="col" className={`${th} text-right`}>Total</th>
                    <th scope="col" className={th}><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(o => (
                    <tr key={o.id} className={`${tr} cursor-pointer`} onClick={e => { if (!(e.target as HTMLElement).closest('a')) navigate(`/admin/orders/${o.id}`) }}>
                      <td className={td}>
                        <Link to={`/admin/orders/${o.id}`} className="font-mono text-[0.875rem] font-bold tracking-wide text-ink underline-offset-4 hover:text-forest hover:underline">{o.reference}</Link>
                        <p className="mt-0.5 text-[0.8125rem] text-muted">{orderDate(o.created_at, true)}</p>
                      </td>
                      <td className={`${td} max-w-[16rem]`}>
                        <p className="truncate font-semibold text-ink">{o.customer.name}</p>
                        <p className="truncate text-[0.8125rem] text-muted">{o.customer.city} · {unitsOf(o)} {unitsOf(o) === 1 ? 'unit' : 'units'}</p>
                      </td>
                      <td className={`${td} hidden w-[12rem] lg:table-cell`}><JourneyBar status={o.status} /></td>
                      <td className={td}><StatusPill status={o.status} /></td>
                      <td className={`${td} text-right font-semibold tabular-nums`}>{orderMoney(o.total)}</td>
                      <td className={`${td} w-10 text-muted`}><ChevronRight aria-hidden="true" className="size-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className={cardList}>
              {shown.map(o => (
                <li key={o.id} className="relative p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/admin/orders/${o.id}`} className="font-mono text-[0.875rem] font-bold tracking-wide break-all text-ink after:absolute after:inset-0">{o.reference}</Link>
                      <p className="mt-0.5 truncate text-[0.8125rem] text-muted">{o.customer.name} · {o.customer.city}</p>
                    </div>
                    <StatusPill status={o.status} />
                  </div>
                  <div className="mt-3"><JourneyBar status={o.status} /></div>
                  <div className="mt-3 flex justify-between gap-3 text-[0.875rem]"><span className="text-muted">{orderDate(o.created_at)}</span><span className="font-semibold tabular-nums">{orderMoney(o.total)}</span></div>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <nav aria-label="Order pages" className="flex items-center justify-between gap-3">
                <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className={buttonClass('secondary', 'sm')}>Previous</button>
                <p className="text-[0.875rem] text-muted tabular-nums">Page {current} of {pages}</p>
                <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className={buttonClass('secondary', 'sm')}>Next</button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  )
}
