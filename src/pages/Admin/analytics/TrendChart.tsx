import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

export interface TrendPoint {
  day: string
  value: number
}

const dayLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const longDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const fmt = new Intl.NumberFormat('en-GB')
const asDate = (day: string) => new Date(`${day}T00:00:00Z`)

/** Rounds up to a 1/2/5 × 10ⁿ step so axis ticks are readable integers. */
function niceMax(max: number) {
  if (max <= 4) return 4
  const step = 10 ** Math.floor(Math.log10(max / 4))
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => s * 4 >= max) ?? step * 10
  return Math.ceil(nice) * 4
}

/** Measures an element in CSS pixels so SVG geometry stays crisp at any size and zoom. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0, rem: 16 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height, rem }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

/**
 * Single-series daily trend (area + 2px line) with a snapping crosshair tooltip, arrow-key navigation and a
 * data table fallback. One series per chart: different measures get separate charts, never a second axis.
 */
export default function TrendChart({ label, unit, data, color }: { label: string; unit: [singular: string, plural: string]; data: TrendPoint[]; color: string }) {
  const [box, { width, height, rem }] = useSize<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const descId = useId()
  const gradientId = useId()

  const total = data.reduce((n, p) => n + p.value, 0)
  const max = niceMax(Math.max(0, ...data.map((p) => p.value)))
  const pad = { top: rem * 0.75, right: rem * 0.75, bottom: rem * 1.75, left: rem * 2.5 }
  const plotW = Math.max(0, width - pad.left - pad.right)
  const plotH = Math.max(0, height - pad.top - pad.bottom)
  const x = (i: number) => pad.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2)
  const y = (v: number) => pad.top + plotH - (v / max) * plotH

  const pts = width ? data.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`) : []
  const base = (pad.top + plotH).toFixed(1)
  const line = pts.length ? `M${pts.join('L')}` : ''
  const area = pts.length ? `M${x(0).toFixed(1)},${base}L${pts.join('L')}L${x(data.length - 1).toFixed(1)},${base}Z` : ''

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))
  const xLabels = data.length > 1 ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : [0]
  const describe = (p: TrendPoint) => `${longDay.format(asDate(p.day))}: ${fmt.format(p.value)} ${p.value === 1 ? unit[0] : unit[1]}`

  const onPointer = (e: PointerEvent<SVGSVGElement>) => {
    if (!data.length || !plotW) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left - pad.left) / plotW
    setActive(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))))
  }
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const last = data.length - 1
    const next = { ArrowRight: (active ?? -1) + 1, ArrowLeft: (active ?? last + 1) - 1, Home: 0, End: last }[e.key]
    if (next === undefined) return
    e.preventDefault()
    setActive(Math.min(last, Math.max(0, next)))
  }

  const point = active !== null ? data[active] : null
  const tipLeft = point ? Math.min(Math.max(x(active!), rem * 5), width - rem * 5) : 0

  return (
    <figure className="m-0">
      <div ref={box} className="relative h-[clamp(11rem,9rem+8vw,15rem)] w-full">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            tabIndex={0}
            aria-label={`${label}: ${fmt.format(total)} ${total === 1 ? unit[0] : unit[1]} over ${data.length} days. Use arrow keys to read daily values.`}
            aria-describedby={descId}
            onPointerMove={onPointer}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            className="block touch-pan-y rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeDasharray={t === 0 ? undefined : '2 4'} />
                <text x={pad.left - rem * 0.5} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[0.6875rem] tabular-nums">
                  {fmt.format(t)}
                </text>
              </g>
            ))}
            {xLabels.map((i, n) => (
              <text key={i} x={x(i)} y={height - rem * 0.5} textAnchor={n === 0 ? 'start' : n === xLabels.length - 1 ? 'end' : 'middle'} className="fill-muted text-[0.6875rem]">
                {dayLabel.format(asDate(data[i].day))}
              </text>
            ))}
            <path d={area} fill={`url(#${CSS.escape(gradientId)})`} />
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {point && (
              <g aria-hidden="true">
                <line x1={x(active!)} x2={x(active!)} y1={pad.top} y2={pad.top + plotH} stroke="var(--color-ink)" strokeOpacity="0.25" />
                <circle cx={x(active!)} cy={y(point.value)} r={4.5} fill={color} stroke="var(--color-surface)" strokeWidth={2} />
              </g>
            )}
          </svg>
        )}
        {point && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-[0.8125rem] whitespace-nowrap shadow-[var(--shadow-lift)]"
            style={{ left: tipLeft }}
          >
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full" style={{ background: color }} />
              <strong className="text-[0.9375rem] text-ink tabular-nums">{fmt.format(point.value)}</strong>
              <span className="text-muted">{point.value === 1 ? unit[0] : unit[1]}</span>
            </p>
            <p className="mt-0.5 text-muted">{longDay.format(asDate(point.day))}</p>
          </div>
        )}
        {total === 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-[0.875rem] font-medium text-muted">No {unit[1]} recorded in this period</p>
        )}
      </div>
      <p id={descId} className="sr-only" aria-live="polite">
        {point ? describe(point) : ''}
      </p>
      <details className="mt-2 text-[0.8125rem]">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-forest hover:underline">Show data table</summary>
        <div className="mt-2 max-h-[16rem] overflow-auto rounded-lg border border-border">
          <table className="w-full text-left tabular-nums">
            <caption className="sr-only">{label}, daily values</caption>
            <thead className="sticky top-0 bg-cream">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Day</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold capitalize">{unit[1]}</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((p) => (
                <tr key={p.day} className="border-t border-border">
                  <td className="px-3 py-1.5">{longDay.format(asDate(p.day))}</td>
                  <td className="px-3 py-1.5 text-right">{fmt.format(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
