import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Package, ShoppingBag } from 'lucide-react'
import type { Order } from './schema.ts'
import { orderDate, orderMoney, unitsOf } from './orderView.ts'
import { JourneyBar, StatusPill } from './TrackingUI.tsx'
import { call } from '../quotes/api.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import { useLivePoll } from './useLivePoll.ts'
import RemoteState from '../../pages/Account/RemoteState.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { FilterTabs } from '../../pages/Admin/ui.tsx'
import { buttonClass } from '../../components/ui/button.ts'

type Filter = 'all' | 'active' | 'delivered' | 'cancelled'
const matches = (o: Order, f: Filter) => f === 'all' || (f === 'active' ? o.status !== 'delivered' && o.status !== 'cancelled' : o.status === f)

function OrderCard({ order }: { order: Order }) {
  const shown = order.items.slice(0, 3)
  return (
    <li>
      <article className="group surface-card relative min-w-0 overflow-hidden p-[clamp(1.125rem,2.5vw,1.5rem)] transition-[box-shadow,border-color] duration-300 hover:border-forest/25 hover:shadow-[var(--shadow-lift)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-mono text-[0.9375rem] font-bold tracking-wide break-all text-ink">
              <Link to={`/account/orders/${order.id}`} className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:rounded-[var(--radius-card)] after:focus-visible:outline-[0.1875rem] after:focus-visible:outline-offset-2 after:focus-visible:outline-copper">
                {order.reference}
              </Link>
            </h2>
            <p className="mt-1 text-[0.8125rem] text-muted">Placed <time dateTime={order.created_at}>{orderDate(order.created_at)}</time> · {unitsOf(order)} {unitsOf(order) === 1 ? 'unit' : 'units'}</p>
          </div>
          <StatusPill status={order.status} />
        </div>
        <div className="mt-5"><JourneyBar status={order.status} timeline={order.timeline} /></div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 -space-x-3">
              {shown.map(item => (
                <span key={item.slug} className="grid size-12 place-items-center overflow-hidden rounded-xl border-2 border-surface bg-canvas ring-1 ring-border">
                  {item.image?.src ? <img src={item.image.src} alt="" width={48} height={48} loading="lazy" decoding="async" className="size-full object-contain p-0.5" /> : <Package aria-hidden="true" className="size-4 text-muted" />}
                </span>
              ))}
            </div>
            <p className="min-w-0 text-[0.875rem] text-muted"><span className="line-clamp-1 font-semibold text-ink">{order.items[0]?.name}</span>{order.items.length > 1 && <span>+{order.items.length - 1} more</span>}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-right"><span className="block font-semibold text-ink tabular-nums">{orderMoney(order.total)}</span><span className="text-[0.75rem] text-muted">Cash on Delivery</span></p>
            <span aria-hidden="true" className={buttonClass('secondary', 'sm', 'pointer-events-none')}>Track<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
          </div>
        </div>
      </article>
    </li>
  )
}

/** Signed-in customer's order history with live status. */
export default function CustomerOrders() {
  const path = '/api/orders'
  const [state, reload] = useAuthedRemote(t => call<{ orders: Order[] }>(path, { method: 'GET' }, t), path)
  const [filter, setFilter] = useState<Filter>('all')
  const orders = state.kind === 'ready' ? state.data.orders : undefined
  useLivePoll(reload, orders, Boolean(orders?.some(o => matches(o, 'active'))), 60_000)

  return (
    <RemoteState state={state} reload={reload} skeleton={3}>
      {({ orders }) => {
        if (!orders.length)
          return (
            <EmptyState icon={ShoppingBag} title="No orders yet" actions={<ButtonLink to="/products">Browse products</ButtonLink>}>
              When you place a Cash on Delivery order, you can follow every step of its delivery here.
            </EmptyState>
          )
        const list = orders.filter(o => matches(o, filter))
        const count = (f: Filter) => orders.filter(o => matches(o, f)).length
        return (
          <div className="flex flex-col gap-5">
            <FilterTabs<Filter>
              label="Filter orders"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `All (${count('all')})` },
                { value: 'active', label: `In progress (${count('active')})` },
                { value: 'delivered', label: `Delivered (${count('delivered')})` },
                { value: 'cancelled', label: `Cancelled (${count('cancelled')})` },
              ]}
            />
            {list.length ? (
              <ul className="flex flex-col gap-4">{list.map(o => <OrderCard key={o.id} order={o} />)}</ul>
            ) : (
              <p className="surface-card p-6 text-center text-muted">No orders in this view.</p>
            )}
          </div>
        )
      }}
    </RemoteState>
  )
}
