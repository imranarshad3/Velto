import { useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, ClipboardList, Clock3, Package, RefreshCw, Search, Truck, X } from 'lucide-react'
import type { Order } from './schema.ts'
import { orderMoney, orderStatuses, statusLabels, visibleOrders } from './orderView.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { buttonClass } from '../../components/ui/button.ts'

const statusStyle: Record<string, string> = {
  placed: 'bg-amber-50 text-amber-900 ring-amber-200',
  confirmed: 'bg-blue-50 text-blue-900 ring-blue-200',
  shipped: 'bg-violet-50 text-violet-900 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
}
const date = (value: string) => new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' }).format(new Date(value))

function StatusEditor({ order, busy, update }: { order: Order; busy: boolean; update: (id: string, status: string) => Promise<void> }) {
  const [status, setStatus] = useState(order.status)
  if (order.status === 'cancelled') return <p className="rounded-xl bg-sand p-4 text-sm text-muted">This order is cancelled and closed. Reserved stock has been released.</p>
  return <div className="rounded-2xl border border-forest/15 bg-forest-soft/40 p-4">
    <label htmlFor={`status-${order.id}`} className="block text-sm font-semibold">Update order status</label>
    <div className="mt-2 flex flex-wrap gap-2">
      <select id={`status-${order.id}`} value={status} disabled={busy} onChange={e => setStatus(e.target.value)} className={`${inputClass} min-w-0 flex-1 basis-[10rem]`}>
        {orderStatuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
      </select>
      <button type="button" disabled={busy || status === order.status} onClick={() => void update(order.id, status)} className={buttonClass('primary', 'md', 'min-h-11')}>{busy ? 'Saving…' : 'Save status'}<Check aria-hidden="true" className="size-4" /></button>
    </div>
    {status === 'cancelled' && <p className="mt-3 text-sm text-danger">Saving will cancel this order and release its reserved stock. Cancelled orders cannot be reopened.</p>}
    <p className="mt-3 text-xs leading-relaxed text-muted">Status changes are saved to the order. Cash on Delivery payment is collected by your delivery team.</p>
  </div>
}

function OrderCard({ order, busy, update }: { order: Order; busy: boolean; update: (id: string, status: string) => Promise<void> }) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0)
  return <li className="min-w-0">
    <details className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)] open:border-forest/25">
      <summary className="flex cursor-pointer list-none flex-col gap-4 p-4 transition-colors hover:bg-canvas/60 focus-visible:outline-2 focus-visible:outline-offset-[-0.25rem] focus-visible:outline-forest sm:p-5 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest"><Package aria-hidden="true" className="size-5" /></span><div className="min-w-0"><h2 className="break-all text-sm font-bold tracking-wide text-ink">{order.reference}</h2><time dateTime={order.created_at} className="mt-1 block text-xs text-muted">{date(order.created_at)}</time></div></div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusStyle[order.status] ?? statusStyle.placed}`}>{statusLabels[order.status] ?? order.status}</span>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0"><p className="break-words font-semibold">{order.customer.name}</p><p className="mt-1 truncate text-sm text-muted">{order.customer.city} · {units} {units === 1 ? 'unit' : 'units'}</p></div>
          <p className="hidden truncate text-sm text-muted sm:block">{order.items[0]?.name}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}</p>
          <div className="text-right"><p className="font-bold tabular-nums">{orderMoney(order.total)}</p><p className="mt-1 text-xs text-muted">Cash on Delivery</p></div>
        </div>
        <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs font-semibold text-forest"><span className="group-open:hidden">View items, delivery & status</span><span className="hidden group-open:inline">Hide order details</span><ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" /></div>
      </summary>
      <div className="grid min-w-0 gap-6 border-t border-border bg-canvas/35 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section aria-label={`Items in ${order.reference}`} className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Order items</h3>
          <ul className="mt-4 divide-y divide-border">{order.items.map(item => <li key={item.slug} className="flex min-w-0 gap-3 py-3 first:pt-0">
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface">{item.image?.src ? <img src={item.image.src} alt="" loading="lazy" className="size-full object-contain" /> : <Package aria-hidden="true" className="size-5 text-muted" />}</div>
            <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted">{item.quantity} × {orderMoney(item.unitPrice)}</p><p className="mt-1 text-sm font-semibold tabular-nums">{orderMoney(item.quantity * item.unitPrice)}</p></div>
          </li>)}</ul>
          <dl className="mt-4 space-y-2 rounded-xl bg-surface p-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{orderMoney(order.subtotal)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Delivery</dt><dd>{orderMoney(order.delivery)}</dd></div><div className="flex justify-between gap-3 border-t border-border pt-3 font-bold"><dt>Order total</dt><dd className="tabular-nums">{orderMoney(order.total)}</dd></div></dl>
        </section>
        <section aria-label={`Delivery for ${order.reference}`} className="min-w-0 space-y-5">
          <div><h3 className="text-xs font-bold uppercase tracking-widest text-muted">Customer & delivery</h3><p className="mt-4 font-semibold">{order.customer.name}</p><address className="mt-2 break-words text-sm not-italic leading-relaxed text-muted">{order.customer.address}<br />{order.customer.city}, {order.customer.country}</address><div className="mt-2 flex flex-col items-start"><a href={`tel:${order.customer.phone.replace(/[^+0-9]/g, '')}`} className="inline-flex min-h-11 items-center gap-2 break-all text-sm font-semibold text-forest underline underline-offset-4">{order.customer.phone}<ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" /></a><a href={`mailto:${order.customer.email}`} className="inline-flex min-h-11 items-center break-all text-sm text-forest underline underline-offset-4">{order.customer.email}</a></div></div>
          <StatusEditor key={`${order.id}-${order.status}`} order={order} busy={busy} update={update} />
        </section>
      </div>
    </details>
  </li>
}

export default function AdminOrderWorkspace({ orders, busy, update, reload }: { orders: Order[]; busy: string | null; update: (id: string, status: string) => Promise<void>; reload: () => void }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const filtered = visibleOrders(orders, search, status, sort)
  const cards = [
    { label: 'All orders', value: orders.length, icon: ClipboardList, filter: 'all' },
    { label: 'New orders', value: orders.filter(o => o.status === 'placed').length, icon: Clock3, filter: 'placed' },
    { label: 'In transit', value: orders.filter(o => o.status === 'shipped').length, icon: Truck, filter: 'shipped' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: Check, filter: 'delivered' },
  ]
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(({label,value,icon:Icon,filter}) => <button key={label} type="button" aria-pressed={status === filter} onClick={() => setStatus(filter)} className={`min-w-0 rounded-2xl border p-4 text-left transition-colors ${status === filter ? 'border-forest bg-forest text-white shadow-[var(--shadow-soft)]' : 'border-border bg-surface hover:border-forest/40'}`}><span className="flex items-center justify-between gap-2 text-xs font-semibold"><span>{label}</span><Icon aria-hidden="true" className="size-4 shrink-0 opacity-70" /></span><strong className="mt-3 block text-3xl font-semibold tabular-nums">{value}</strong></button>)}</div>
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-[16rem]"><label htmlFor="order-search" className="text-sm font-semibold">Find an order</label><div className="relative mt-2"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"/><input id="order-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Reference, customer, city or product" className={`${inputClass} pl-10`} /></div></div>
        <div className="min-w-0 flex-1 basis-[9rem] sm:max-w-[12rem]"><label htmlFor="order-filter" className="text-sm font-semibold">Status</label><select id="order-filter" value={status} onChange={e=>setStatus(e.target.value)} className={`${inputClass} mt-2`}><option value="all">All statuses</option>{orderStatuses.map(s=><option key={s} value={s}>{statusLabels[s]}</option>)}</select></div>
        <div className="min-w-0 flex-1 basis-[9rem] sm:max-w-[12rem]"><label htmlFor="order-sort" className="text-sm font-semibold">Sort by</label><select id="order-sort" value={sort} onChange={e=>setSort(e.target.value)} className={`${inputClass} mt-2`}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="value">Highest total</option></select></div>
        <button type="button" onClick={reload} disabled={!!busy} className={buttonClass('secondary','md','min-h-11')}><RefreshCw aria-hidden="true" className="size-4"/>Refresh</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted"><p role="status">{filtered.length} of {orders.length} orders{orders.length === 100 ? ' · latest 100 orders' : ''}</p>{(search || status !== 'all') && <button type="button" onClick={()=>{setSearch('');setStatus('all')}} className="inline-flex min-h-11 items-center gap-1 font-semibold text-forest"><X aria-hidden="true" className="size-3.5"/>Clear filters</button>}<span>Cash on Delivery · PKR</span></div>
    </div>
    {filtered.length ? <ul className="space-y-4">{filtered.map(order=><OrderCard key={order.id} order={order} busy={!!busy} update={update}/>)}</ul> : <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-12 text-center"><Package aria-hidden="true" className="mx-auto size-9 text-forest/60"/><h2 className="mt-4 font-display text-2xl">{orders.length ? 'No matching orders' : 'Ready for your first order'}</h2><p className="mx-auto mt-2 max-w-sm text-sm text-muted">{orders.length ? 'Try a different reference, customer name or status.' : 'Customer purchases will appear here with items, delivery details and status controls.'}</p></div>}
  </div>
}
