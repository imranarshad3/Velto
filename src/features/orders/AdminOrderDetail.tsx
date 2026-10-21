import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Ban, ExternalLink, History, LoaderCircle, Lock, Mail, MapPin, Package, Phone, Save } from 'lucide-react'
import type { AdminOrder } from './schema.ts'
import { orderDate, orderMoney, unitsOf } from './orderView.ts'
import { nextStatuses, statusLabels, type OrderStatus } from './tracking.ts'
import { CopyCode, JourneyBar, StatusPill } from './TrackingUI.tsx'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { Panel } from '../../pages/Admin/ui.tsx'
import ConfirmDialog from '../../pages/Admin/ConfirmDialog.tsx'

const today = () => new Date().toISOString().slice(0, 10)
const updateSchema = z.object({
  status: z.string(),
  carrier: z.string().trim().max(60, 'Use 60 characters or fewer.').refine(v => v === '' || v.length >= 2, 'Enter the courier name.'),
  carrierReference: z.string().trim().regex(/^([A-Za-z0-9-]{3,40})?$/, 'Use 3–40 letters, numbers or dashes.'),
  estimatedDelivery: z.string().refine(v => v === '' || v >= today(), 'Choose today or a later date.'),
  note: z.string().trim().max(500, 'Keep notes under 500 characters.'),
  notePublic: z.boolean(),
})
export type OrderUpdateValues = z.infer<typeof updateSchema>
export type OrderUpdate = OrderUpdateValues & { id: string; expectedStatus: string }

function UpdatePanel({ order, save }: { order: AdminOrder; save: (u: OrderUpdate) => Promise<boolean> }) {
  const options = nextStatuses(order.status)
  const t = order.tracking
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting, isDirty } } = useForm<OrderUpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { status: order.status, carrier: t?.carrier ?? '', carrierReference: t?.carrierReference ?? '', estimatedDelivery: t?.estimatedDelivery?.exact ? t.estimatedDelivery.earliest.slice(0, 10) : '', note: '', notePublic: true },
  })
  const [confirm, setConfirm] = useState<OrderUpdateValues | null>(null)
  const status = watch('status')
  const note = watch('note')

  const submit = async (values: OrderUpdateValues) => {
    if (values.status === 'cancelled' && !confirm) return setConfirm(values)
    const ok = await save({ ...values, id: order.id, expectedStatus: order.status })
    setConfirm(null)
    if (ok) reset({ ...values, note: '' })
  }

  if (!options.length)
    return (
      <Panel id="update-title" title="Order closed">
        <p className="flex gap-3 text-[0.9375rem] text-muted"><Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{order.status === 'delivered' ? 'This order is complete and paid. You can’t change it.' : 'This order was cancelled. You can’t reopen it.'}</p>
      </Panel>
    )

  return (
    <Panel id="update-title" title="Update order" description="A new status is shown to the customer right away.">
      <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
        <fieldset>
          <legend className="text-[0.875rem] font-semibold text-ink">Choose a status</legend>
          <div className="mt-2 grid gap-2">
            {[order.status as OrderStatus, ...options].map(s => (
              <label key={s} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-[0.9375rem] transition-colors has-[:checked]:border-forest has-[:checked]:bg-forest-soft/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest ${s === 'cancelled' ? 'border-danger/20 text-danger has-[:checked]:border-danger has-[:checked]:bg-danger-soft' : 'border-border'}`}>
                <input type="radio" value={s} {...register('status')} className="size-4 accent-forest" />
                <span className="flex-1 font-semibold">{s === order.status ? `${statusLabels[s]} (current)` : statusLabels[s]}</span>
                {s !== order.status && s !== 'cancelled' && <ArrowRight aria-hidden="true" className="size-4 text-muted" />}
                {s === 'cancelled' && <Ban aria-hidden="true" className="size-4" />}
              </label>
            ))}
          </div>
          {['shipped', 'out_for_delivery'].includes(status) && !t?.number && <p className="mt-2 text-[0.8125rem] text-muted">We’ll create a VELTO tracking ID when you mark this order as shipped.</p>}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field id="carrier" label="Delivery company" error={errors.carrier?.message}>{a => <input {...a} {...register('carrier')} placeholder="e.g. TCS, Leopards" className={inputClass} />}</Field>
          <Field id="carrier-ref" label="Courier tracking number" error={errors.carrierReference?.message}>{a => <input {...a} {...register('carrierReference')} spellCheck={false} placeholder="Enter the number from the courier" className={`${inputClass} font-mono`} />}</Field>
        </div>
        <Field id="eta" label="Expected delivery date" hint="Leave blank to use the usual 2–4 day estimate." error={errors.estimatedDelivery?.message}>{a => <input {...a} type="date" min={today()} {...register('estimatedDelivery')} className={inputClass} />}</Field>
        <Field id="note" label="Message or note" error={errors.note?.message}>{a => <textarea {...a} {...register('note')} rows={3} maxLength={500} className={`${inputClass} min-h-24 py-3`} placeholder="e.g. The driver will call before arrival." />}</Field>
        {note?.trim() && (
          <label className="-mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-[0.875rem]">
            <input type="checkbox" {...register('notePublic')} className="size-4 accent-forest" />
            Show this message to the customer
          </label>
        )}
        <button type="submit" disabled={isSubmitting || !isDirty} className={buttonClass(status === 'cancelled' ? 'danger' : 'primary', 'md', 'w-full')}>
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
          {isSubmitting ? 'Saving…' : status === order.status ? 'Save details' : `Mark as ${statusLabels[status]?.toLowerCase()}`}
        </button>
      </form>
      <ConfirmDialog open={Boolean(confirm)} icon={Ban} title="Cancel this order?" confirmLabel="Cancel order" busyLabel="Cancelling…" busy={isSubmitting} error={null} onCancel={() => setConfirm(null)} onConfirm={() => void handleSubmit(submit)()}>
        Reserved stock is released and the customer sees the order as cancelled. Cancelled orders cannot be reopened.
      </ConfirmDialog>
    </Panel>
  )
}

function ActivityLog({ order }: { order: AdminOrder }) {
  const events = [...order.activity].reverse()
  return (
    <Panel id="activity-title" title="Order updates" description="See what changed and when.">
      <ol className="flex flex-col">
        {events.map((e, i) => (
          <li key={`${e.at}-${i}`} className="relative flex gap-3.5 pb-5 last:pb-0">
            <span aria-hidden="true" className="absolute top-9 bottom-0 left-4 w-px bg-border" />
            <span className="z-[1] grid size-8 shrink-0 place-items-center rounded-full bg-cream text-forest ring-1 ring-border"><History aria-hidden="true" className="size-3.5" /></span>
            <div className="min-w-0 flex-1 text-[0.875rem]">
              <p className="text-ink">
                {e.kind === 'status' && e.to ? <><span className="font-semibold">{statusLabels[e.from ?? ''] ?? e.from}</span> → <span className="font-semibold">{statusLabels[e.to] ?? e.to}</span></> : <span className="font-semibold">Order details changed</span>}
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-muted">{e.actor} · <time dateTime={e.at}>{orderDate(e.at, true)}</time></p>
              {(e.carrier || e.carrierReference || e.eta) && <p className="mt-1 text-[0.8125rem] text-muted">{[e.carrier, e.carrierReference, e.eta && `Expected delivery ${orderDate(e.eta)}`].filter(Boolean).join(' · ')}</p>}
              {e.note && (
                <p className="mt-2 rounded-xl bg-cream/70 px-3 py-2 leading-relaxed text-ink">
                  <span className={`mr-2 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tracking-wide uppercase ${e.notePublic ? 'bg-forest-soft text-forest' : 'bg-copper-soft text-copper-hover'}`}>{e.notePublic ? 'Customer' : 'Internal'}</span>
                  {e.note}
                </p>
              )}
            </div>
          </li>
        ))}
        <li className="relative flex gap-3.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-copper-soft text-copper-hover ring-1 ring-copper/20"><Package aria-hidden="true" className="size-3.5" /></span>
          <div className="text-[0.875rem]"><p className="font-semibold text-ink">Order placed by customer</p><p className="mt-0.5 text-[0.8125rem] text-muted"><time dateTime={order.created_at}>{orderDate(order.created_at, true)}</time></p></div>
        </li>
      </ol>
    </Panel>
  )
}

/** Admin order detail: journey, items, customer, tracking, status update form and activity log. */
export default function AdminOrderDetail({ order, save }: { order: AdminOrder; save: (u: OrderUpdate) => Promise<boolean> }) {
  const c = order.customer
  return (
    <div className="grid min-w-0 gap-[var(--grid-gap)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:items-start">
      <div className="flex min-w-0 flex-col gap-[var(--grid-gap)]">
        <section aria-label="Order status" className="surface-card p-[clamp(1.25rem,2.5vw,1.75rem)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.8125rem] text-muted">Ordered {orderDate(order.created_at, true)} · Pay by cash on delivery</p>
              <p className="mt-1 font-display text-[clamp(1.75rem,1.5rem+1vw,2.25rem)] leading-tight text-ink tabular-nums">{orderMoney(order.total)}</p>
            </div>
            <StatusPill status={order.status} size="md" />
          </div>
          <div className="mt-6"><JourneyBar status={order.status} timeline={order.timeline} labelled /></div>
        </section>

        <Panel id="items-title" title="Items" description={`${order.items.length} ${order.items.length === 1 ? 'product' : 'products'} · ${unitsOf(order)} ${unitsOf(order) === 1 ? 'item' : 'items'}`}>
          <ul className="divide-y divide-border">
            {order.items.map(item => (
              <li key={item.slug} className="flex min-w-0 items-center gap-3.5 py-3 first:pt-0">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-canvas">{item.image?.src ? <img src={item.image.src} alt="" width={56} height={56} loading="lazy" className="size-full object-contain p-0.5" /> : <Package aria-hidden="true" className="size-5 text-muted" />}</div>
                <div className="min-w-0 flex-1"><p className="line-clamp-2 font-semibold text-ink">{item.name}</p><p className="mt-0.5 text-[0.8125rem] text-muted tabular-nums">{item.quantity} × {orderMoney(item.unitPrice)}</p></div>
                <p className="shrink-0 font-semibold tabular-nums">{orderMoney(item.quantity * item.unitPrice)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 rounded-2xl bg-cream/70 p-4 text-[0.9375rem]">
            <div className="flex justify-between gap-3"><dt className="text-muted">Items total</dt><dd className="tabular-nums">{orderMoney(order.subtotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Delivery fee</dt><dd className="tabular-nums">{orderMoney(order.delivery)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-border pt-2.5 font-bold"><dt>Customer pays on delivery</dt><dd className="tabular-nums">{orderMoney(order.total)}</dd></div>
          </dl>
        </Panel>

        <ActivityLog order={order} />
      </div>

      <div className="flex min-w-0 flex-col gap-[var(--grid-gap)] xl:sticky xl:top-[calc(var(--header-height)+1.5rem)]">
        <UpdatePanel key={`${order.status}-${order.updated_at}`} order={order} save={save} />
        <Panel id="customer-title" title="Customer & delivery">
          <p className="font-semibold text-ink">{c.name}</p>
          <address className="mt-2 flex gap-2 break-words text-[0.9375rem] not-italic leading-relaxed text-muted"><MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" /><span>{c.address}<br />{c.city}, {c.country}</span></address>
          <div className="mt-2 flex flex-col items-start">
            <a href={`tel:${c.phone.replace(/[^+0-9]/g, '')}`} className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold break-all text-forest underline-offset-4 hover:underline"><Phone aria-hidden="true" className="size-4 shrink-0" />{c.phone}</a>
            <a href={`mailto:${c.email}`} className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] break-all text-forest underline-offset-4 hover:underline"><Mail aria-hidden="true" className="size-4 shrink-0" />{c.email}</a>
          </div>
        </Panel>
        <Panel id="tracking-title" title="Tracking details">
          <dl className="flex flex-col gap-3 text-[0.9375rem]">
            <div className="flex flex-wrap items-center justify-between gap-2"><dt className="text-muted">Order number</dt><dd><CopyCode value={order.reference} label="order number" /></dd></div>
            <div className="flex flex-wrap items-center justify-between gap-2"><dt className="text-muted">VELTO tracking ID</dt><dd>{order.tracking?.number ? <CopyCode value={order.tracking.number} label="tracking ID" /> : <span className="text-muted">Created when shipped</span>}</dd></div>
          </dl>
          <a href="/track" target="_blank" rel="noopener" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[0.875rem] font-semibold text-forest underline-offset-4 hover:underline">Open tracking page<ExternalLink aria-hidden="true" className="size-3.5" /></a>
        </Panel>
      </div>
    </div>
  )
}
