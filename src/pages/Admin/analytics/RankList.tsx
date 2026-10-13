import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { fmt } from './format.ts'

export interface RankItem {
  slug: string
  name: string
  value: number
  /** Value shown at the bar end; defaults to the formatted value. */
  display?: ReactNode
  detail?: ReactNode
}

/** Top-N ranking with a single-hue bar per product (bars share one scale, so lengths compare). */
export default function RankList({ id, title, description, icon: Icon, items, color, empty }: { id: string; title: string; description: string; icon: LucideIcon; items: RankItem[]; color: string; empty: ReactNode }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <section aria-labelledby={id} className="surface-card flex min-w-0 flex-col p-5">
      <header className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
          <Icon aria-hidden="true" className="size-[1.125rem]" />
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-[1rem] leading-snug font-semibold text-ink">
            {title}
          </h2>
          <p className="text-[0.8125rem] text-muted">{description}</p>
        </div>
      </header>
      {items.length ? (
        <ol className="mt-4 flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={item.slug}>
              <Link to={`/admin/products/${item.slug}`} className="group -mx-2 grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-2 rounded-lg px-2 py-2 transition-colors hover:bg-cream">
                <span className="text-[0.8125rem] font-semibold text-muted tabular-nums">{i + 1}</span>
                <span className="flex min-w-0 items-baseline justify-between gap-3">
                  <span title={item.name} className="truncate text-[0.9375rem] font-medium text-ink group-hover:text-forest">{item.name}</span>
                  <span className="shrink-0 text-[0.9375rem] font-semibold text-ink tabular-nums">{item.display ?? fmt.format(item.value)}</span>
                </span>
                <span aria-hidden="true" className="col-start-2 mt-1.5 h-1.5 overflow-clip rounded-full bg-sand">
                  <span className="block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: color }} />
                </span>
                {item.detail && <span className="col-start-2 mt-1 truncate text-[0.75rem] text-muted">{item.detail}</span>}
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-4 grid flex-1 place-items-center rounded-xl border border-dashed border-border bg-canvas px-4 py-8 text-center text-[0.875rem] text-muted">{empty}</div>
      )}
    </section>
  )
}
