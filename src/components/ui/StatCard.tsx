import { MoveRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  /** Small supporting line under the label. */
  hint?: ReactNode
  /** Makes the whole card a link. */
  to?: string
  tone?: 'forest' | 'copper' | 'gold' | 'ink'
}

const tones = {
  forest: 'bg-forest-soft text-forest',
  copper: 'bg-forest-soft text-forest',
  gold: 'bg-copper-soft text-copper-hover',
  ink: 'bg-sand text-ink',
}

/** KPI tile for the account and admin dashboards. */
export default function StatCard({ icon: Icon, label, value, hint, to, tone = 'forest' }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
        {to && <span aria-hidden="true" className="text-[1.25rem] leading-none text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-forest"><MoveRight size={16}  /></span>}
      </div>
      <p className="mt-5 font-display text-[clamp(2rem,1.7rem+1vw,2.5rem)] leading-[1.08] text-ink tabular-nums">{value}</p>
      <p className="mt-2 text-[0.875rem] font-semibold text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-[0.8125rem] text-muted">{hint}</p>}
    </>
  )
  const cls =
    'group relative block h-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] transition-[box-shadow,transform,border-color] duration-300'

  return to ? (
    <Link to={to} className={`${cls} hover:-translate-y-0.5 hover:border-forest/25 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
