import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Check, ClipboardCheck, Copy, House, PackageCheck, PackageOpen, Receipt, Truck, X, type LucideIcon } from 'lucide-react'
import { fulfilmentSteps, progressOf, statusDescriptions, statusLabels, stepIndex, stepTimes, type TimelineEvent } from './tracking.ts'
import { orderDate } from './orderView.ts'

const stepIcons: Record<string, LucideIcon> = {
  placed: Receipt,
  confirmed: ClipboardCheck,
  processing: PackageOpen,
  shipped: Truck,
  out_for_delivery: Truck,
  delivered: House,
  cancelled: X,
}

const pillTones: Record<string, string> = {
  placed: 'bg-copper-soft text-copper-hover ring-copper/25',
  confirmed: 'bg-forest-soft text-forest ring-forest/20',
  processing: 'bg-forest-soft text-forest ring-forest/20',
  shipped: 'bg-[#e8eef8] text-[#2c4a7a] ring-[#2c4a7a]/20',
  out_for_delivery: 'bg-[#e8eef8] text-[#2c4a7a] ring-[#2c4a7a]/20',
  delivered: 'bg-success-soft text-success ring-success/25',
  cancelled: 'bg-ink/[0.05] text-muted ring-ink/10',
}

/** Status badge; `live` adds a soft pulse for orders still on the move. */
export function StatusPill({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const moving = status !== 'delivered' && status !== 'cancelled'
  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-semibold whitespace-nowrap ring-1 ring-inset ${size === 'md' ? 'px-3.5 py-1.5 text-[0.875rem]' : 'px-2.5 py-1 text-[0.75rem]'} ${pillTones[status] ?? pillTones.placed}`}>
      <span aria-hidden="true" className="relative flex size-2">
        {moving && <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-40 motion-reduce:hidden" />}
        <span className="relative size-2 rounded-full bg-current" />
      </span>
      {statusLabels[status] ?? status}
    </span>
  )
}

/** Animates `[data-anim]` children once on mount, only when the user allows motion. */
function useEntrance<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const barX = el.querySelectorAll('[data-anim="fill-x"]')
      const barY = el.querySelectorAll('[data-anim="fill-y"]')
      const dots = el.querySelectorAll('[data-anim="dot"]')
      const rows = el.querySelectorAll('[data-anim="row"]')
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (barX.length) tl.from(barX, { scaleX: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
      if (barY.length) tl.from(barY, { scaleY: 0, duration: 0.5, stagger: 0.12, ease: 'power2.inOut' }, 0.2)
      if (dots.length) tl.from(dots, { scale: 0.4, autoAlpha: 0, duration: 0.45, stagger: 0.09 }, 0.1)
      if (rows.length) tl.from(rows, { y: 14, autoAlpha: 0, duration: 0.55, stagger: 0.07 }, 0.15)
    })
    return () => mm.revert()
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/** Horizontal journey tracker: compact for cards, labelled for headers. */
export function JourneyBar({ status, timeline = [], labelled = false }: { status: string; timeline?: TimelineEvent[]; labelled?: boolean }) {
  const ref = useEntrance<HTMLDivElement>([status])
  const cancelled = status === 'cancelled'
  const current = stepIndex(status)
  const times = stepTimes(timeline)
  const pct = progressOf(status) * 100
  return (
    <div ref={ref} className="min-w-0">
      <div role="progressbar" aria-label="Delivery progress" aria-valuemin={0} aria-valuemax={fulfilmentSteps.length - 1} aria-valuenow={cancelled ? 0 : current} aria-valuetext={statusLabels[status]} className="relative mx-[0.6875rem] h-1.5 rounded-full bg-sand">
        <div data-anim="fill-x" style={{ width: `${pct}%` }} className={`absolute inset-y-0 left-0 origin-left rounded-full ${cancelled ? 'bg-muted/40' : 'bg-[linear-gradient(90deg,var(--color-forest-mid),var(--color-success))]'}`} />
        {fulfilmentSteps.map((s, i) => {
          const done = !cancelled && i <= current
          return (
            <span
              key={s}
              data-anim="dot"
              aria-hidden="true"
              style={{ left: `${(i / (fulfilmentSteps.length - 1)) * 100}%` }}
              className={`absolute top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ring-surface transition-colors ${labelled ? 'size-[1.375rem] ring-4' : 'size-2.5 ring-2'} ${done ? (i === current && !isDone(status) ? 'bg-forest text-white' : 'bg-success text-white') : 'bg-sand-deep text-transparent'}`}
            >
              {labelled && done && <Check className="size-3" strokeWidth={3} />}
            </span>
          )
        })}
      </div>
      {labelled && (
        <p className="mt-4 text-[0.875rem] font-semibold text-ink sm:hidden">
          {cancelled ? 'Order cancelled' : `Step ${Math.max(1, current + 1)} of ${fulfilmentSteps.length}: ${statusLabels[status] ?? status}`}
        </p>
      )}
      {labelled && (
        <ol className="mt-4 hidden grid-cols-6 gap-2 sm:grid">
          {fulfilmentSteps.map((s, i) => (
            <li key={s} className={`min-w-0 text-[0.75rem] leading-snug ${i === 0 ? 'text-left' : i === fulfilmentSteps.length - 1 ? 'text-right' : 'text-center'}`}>
              <span className={`block font-semibold ${!cancelled && i <= current ? 'text-ink' : 'text-muted'}`}>{statusLabels[s]}</span>
              <span className="block text-muted tabular-nums">{times[s] && !cancelled ? orderDate(times[s]) : ' '}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

const isDone = (status: string) => status === 'delivered'

/** Vertical delivery timeline with each step, when it happened and any customer-facing notes. */
export function TrackingTimeline({ status, timeline }: { status: string; timeline: TimelineEvent[] }) {
  const ref = useEntrance<HTMLOListElement>([status, timeline.length])
  const cancelled = status === 'cancelled'
  const current = stepIndex(status)
  const times = stepTimes(timeline)
  const notes = timeline.filter(e => e.note)
  const steps: string[] = cancelled ? [...fulfilmentSteps.filter(s => times[s]), 'cancelled'] : [...fulfilmentSteps]

  return (
    <ol ref={ref} className="relative flex flex-col">
      {steps.map((s, i) => {
        const reached = s === 'cancelled' || (!cancelled && stepIndex(s) <= current) || (cancelled && Boolean(times[s]))
        const active = s === status
        const Icon = stepIcons[s] ?? PackageCheck
        const last = i === steps.length - 1
        const stepNotes = notes.filter(n => n.status === s)
        return (
          <li key={s} data-anim="row" className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span aria-hidden="true" className="absolute top-12 bottom-1 left-[1.3125rem] w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-sand">
                {reached && stepIndex(steps[i + 1]) <= current && !cancelled && <span data-anim="fill-y" className="absolute inset-0 origin-top bg-[linear-gradient(180deg,var(--color-success),var(--color-forest-mid))]" />}
              </span>
            )}
            <span
              data-anim="dot"
              className={`relative z-[1] grid size-[2.625rem] shrink-0 place-items-center rounded-2xl transition-colors ${s === 'cancelled' ? 'bg-ink/[0.06] text-muted ring-1 ring-ink/10' : active && !isDone(status) ? 'bg-forest text-white shadow-[0_0.75rem_1.5rem_-0.75rem_rgb(41_76_104/0.8)]' : reached ? 'bg-success-soft text-success ring-1 ring-success/20' : 'bg-surface text-muted/60 ring-1 ring-border'}`}
            >
              {active && !isDone(status) && s !== 'cancelled' && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-2xl bg-forest/25 [animation-duration:2.2s] motion-reduce:hidden" />}
              {reached && !active ? <Check aria-hidden="true" className="size-[1.125rem]" strokeWidth={2.5} /> : <Icon aria-hidden="true" className="size-[1.125rem]" />}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className={`font-semibold ${reached ? 'text-ink' : 'text-muted'}`}>
                  {statusLabels[s]}
                  {active && <span className="sr-only"> (current status)</span>}
                </p>
                {times[s] && <time dateTime={times[s]} className="text-[0.8125rem] text-muted tabular-nums">{orderDate(times[s], true)}</time>}
              </div>
              {(active || s === 'cancelled') && <p className="mt-1 text-[0.875rem] leading-relaxed text-muted">{statusDescriptions[s]}</p>}
              {stepNotes.map(n => (
                <p key={n.at} className="mt-2 rounded-xl border border-border bg-cream/60 px-3.5 py-2.5 text-[0.875rem] leading-relaxed text-ink">
                  {n.note}
                </p>
              ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Monospace tracking ID with copy-to-clipboard. */
export function CopyCode({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }
  return (
    <button type="button" onClick={() => void copy()} className="group inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 font-mono text-[0.875rem] font-semibold tracking-wide text-ink transition-colors hover:border-forest/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper">
      <span className="truncate">{value}</span>
      {copied ? <Check aria-hidden="true" className="size-4 text-success" /> : <Copy aria-hidden="true" className="size-4 text-muted group-hover:text-forest" />}
      <span className="sr-only" aria-live="polite">{copied ? `${label} copied` : `Copy ${label}`}</span>
    </button>
  )
}
