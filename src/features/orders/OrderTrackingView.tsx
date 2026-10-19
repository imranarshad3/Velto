import { CalendarClock, CircleHelp, CreditCard, MapPin, Package, RefreshCw, Truck } from 'lucide-react'
import { Link } from 'react-router'
import type { Order } from './schema.ts'
import { orderDate, orderDay, orderMoney, unitsOf } from './orderView.ts'
import { customerTimeline, statusDescriptions, statusLabels } from './tracking.ts'
import { CopyCode, JourneyBar, TrackingTimeline } from './TrackingUI.tsx'
import { useRelativeTime } from './useLivePoll.ts'

function eta(order: Order) {
  const timeline = order.timeline ?? customerTimeline(order.created_at)
  if (order.status === 'delivered') {
    const at = [...timeline].reverse().find(e => e.status === 'delivered')?.at ?? order.updated_at ?? order.created_at
    return { label: 'Delivered', value: orderDay(at) }
  }
  if (order.status === 'cancelled') return { label: 'Delivery', value: 'Cancelled' }
  const w = order.tracking?.estimatedDelivery
  if (!w) return { label: 'Estimated delivery', value: 'To be scheduled' }
  return { label: w.exact ? 'Scheduled delivery' : 'Estimated delivery', value: w.exact ? orderDay(w.earliest) : `${orderDay(w.earliest)} – ${orderDay(w.latest)}` }
}

/** Full customer tracking view, shared by the account order page and public tracking. */
export default function OrderTrackingView({ order, updatedAt, onRefresh, refreshing = false }: { order: Order; updatedAt?: number | null; onRefresh?: () => void; refreshing?: boolean }) {
  const timeline = order.timeline ?? customerTimeline(order.created_at)
  const when = eta(order)
  const ago = useRelativeTime(updatedAt ?? null)
  const live = order.status !== 'delivered' && order.status !== 'cancelled'
  const t = order.tracking

  return (
    <div className="flex min-w-0 flex-col gap-[var(--grid-gap)]">
      <section aria-labelledby="track-status" className="relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-[linear-gradient(135deg,var(--color-forest-deep),var(--color-forest)_60%,var(--color-forest-mid))] p-[clamp(1.25rem,3vw,2.25rem)] text-white shadow-[var(--shadow-lift)]">
        <div aria-hidden="true" className="absolute -top-24 -right-16 -z-10 size-[22rem] rounded-full bg-[radial-gradient(circle,rgb(143_212_179/0.22),transparent_65%)]" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-white/65 uppercase">Order {order.reference}</p>
            <h2 id="track-status" className="mt-2 font-display text-[clamp(2rem,1.6rem+1.8vw,3rem)] leading-[1.05]">{statusLabels[order.status] ?? order.status}</h2>
            <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-relaxed text-white/80">{statusDescriptions[order.status]}</p>
          </div>
          {onRefresh && (
            <div className="flex items-center gap-2 text-[0.8125rem] text-white/70">
              {live && (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-mint opacity-60 motion-reduce:hidden" /><span className="relative size-2 rounded-full bg-mint" /></span>
                  Live{ago && ` · updated ${ago}`}
                </span>
              )}
              <button type="button" onClick={onRefresh} disabled={refreshing} className="grid size-11 place-items-center rounded-xl border border-white/20 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50">
                <RefreshCw aria-hidden="true" className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh status</span>
              </button>
            </div>
          )}
        </div>
        <dl className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
          <div className="rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/12 backdrop-blur">
            <dt className="flex items-center gap-2 text-[0.75rem] font-semibold tracking-[0.1em] text-white/60 uppercase"><CalendarClock aria-hidden="true" className="size-3.5" />{when.label}</dt>
            <dd className="mt-1.5 text-[1.0625rem] font-semibold">{when.value}</dd>
          </div>
          <div className="rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/12 backdrop-blur">
            <dt className="flex items-center gap-2 text-[0.75rem] font-semibold tracking-[0.1em] text-white/60 uppercase"><Truck aria-hidden="true" className="size-3.5" />Tracking ID</dt>
            <dd className="mt-1.5 font-mono text-[1.0625rem] font-semibold tracking-wide">{t?.number ?? <span className="font-sans text-[0.9375rem] font-normal text-white/70">Assigned when shipped</span>}</dd>
          </div>
          <div className="rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/12 backdrop-blur">
            <dt className="flex items-center gap-2 text-[0.75rem] font-semibold tracking-[0.1em] text-white/60 uppercase"><CreditCard aria-hidden="true" className="size-3.5" />Pay on delivery</dt>
            <dd className="mt-1.5 text-[1.0625rem] font-semibold tabular-nums">{order.status === 'cancelled' ? 'Nothing due' : orderMoney(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Delivery progress" className="surface-card p-[clamp(1.25rem,2.5vw,1.75rem)]">
        <JourneyBar status={order.status} timeline={timeline} labelled />
        {order.status === 'cancelled' && <p className="mt-4 text-[0.875rem] text-muted">This order was cancelled before delivery.</p>}
      </section>

      <div className="grid min-w-0 gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section aria-labelledby="timeline-title" className="surface-card min-w-0 p-[clamp(1.25rem,2.5vw,1.75rem)]">
          <h2 id="timeline-title" className="font-display text-[1.5rem] text-ink">Delivery timeline</h2>
          <p className="mt-1 text-[0.875rem] text-muted">Placed {orderDate(order.created_at, true)}</p>
          <div className="mt-6"><TrackingTimeline status={order.status} timeline={timeline} /></div>
        </section>

        <div className="flex min-w-0 flex-col gap-[var(--grid-gap)]">
          <section aria-labelledby="items-title" className="surface-card min-w-0 p-[clamp(1.25rem,2.5vw,1.75rem)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="items-title" className="font-display text-[1.5rem] text-ink">Your items</h2>
              <p className="text-[0.8125rem] text-muted">{unitsOf(order)} {unitsOf(order) === 1 ? 'unit' : 'units'}</p>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {order.items.map(item => (
                <li key={item.slug} className="flex min-w-0 items-center gap-3.5 py-3.5 first:pt-0">
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-canvas">
                    {item.image?.src ? <img src={item.image.src} alt="" width={64} height={64} loading="lazy" decoding="async" className="size-full object-contain p-1" /> : <Package aria-hidden="true" className="size-5 text-muted" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.slug}`} className="line-clamp-2 font-semibold text-ink underline-offset-4 hover:text-forest hover:underline">{item.name}</Link>
                    <p className="mt-0.5 text-[0.8125rem] text-muted tabular-nums">{item.quantity} × {orderMoney(item.unitPrice)}</p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">{orderMoney(item.quantity * item.unitPrice)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 rounded-2xl bg-cream/70 p-4 text-[0.9375rem]">
              <div className="flex justify-between gap-3"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{orderMoney(order.subtotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Delivery</dt><dd className="tabular-nums">{orderMoney(order.delivery)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-border pt-2.5 font-bold text-ink"><dt>Total · Cash on Delivery</dt><dd className="tabular-nums">{orderMoney(order.total)}</dd></div>
            </dl>
          </section>

          <section aria-labelledby="delivery-title" className="surface-card min-w-0 p-[clamp(1.25rem,2.5vw,1.75rem)]">
            <h2 id="delivery-title" className="font-display text-[1.5rem] text-ink">Delivery details</h2>
            <div className="mt-4 flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest"><MapPin aria-hidden="true" className="size-[1.125rem]" /></span>
              <div className="min-w-0 text-[0.9375rem]">
                <p className="font-semibold text-ink">{order.customer.name}</p>
                <address className="mt-0.5 break-words not-italic leading-relaxed text-muted">{order.customer.address}<br />{order.customer.city}, {order.customer.country}</address>
                <p className="mt-1 text-muted">{order.customer.phone}</p>
              </div>
            </div>
            {(t?.carrier || t?.carrierReference || t?.number) && (
              <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-[0.9375rem]">
                {t?.number && <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-muted">VELTO tracking ID</span><CopyCode value={t.number} label="tracking ID" /></div>}
                {t?.carrier && <div className="flex flex-wrap justify-between gap-2"><span className="text-muted">Courier</span><span className="font-semibold">{t.carrier}</span></div>}
                {t?.carrierReference && <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-muted">Courier reference</span><CopyCode value={t.carrierReference} label="courier reference" /></div>}
              </div>
            )}
          </section>

          <Link to="/contact" className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 text-[0.9375rem] transition-colors hover:border-forest/30">
            <CircleHelp aria-hidden="true" className="size-5 shrink-0 text-forest" />
            <span className="min-w-0 flex-1"><span className="font-semibold text-ink">Need help with this order?</span> <span className="text-muted">Quote {order.reference} when you contact us.</span></span>
            <span aria-hidden="true" className="text-muted transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
      <StatusPillSrOnly status={order.status} />
    </div>
  )
}

/** Announces status changes picked up by live refresh. */
function StatusPillSrOnly({ status }: { status: string }) {
  return <p className="sr-only" aria-live="polite">Current status: {statusLabels[status]}</p>
}
