import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export default function EmptyState({ icon: Icon, title, children, actions }: { icon: LucideIcon; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="relative isolate flex flex-col items-center overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface px-6 py-[clamp(3rem,7vw,5rem)] text-center shadow-[var(--shadow-soft)]">
      <span className="relative grid size-20 place-items-center rounded-full bg-cream ring-1 ring-sand-deep before:absolute before:-inset-3 before:rounded-full before:ring-1 before:ring-sand-deep/60">
        <span className="grid size-14 place-items-center rounded-full bg-[linear-gradient(180deg,var(--color-forest-mid),var(--color-forest))] text-white shadow-[var(--shadow-button)]">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      </span>
      <h2 className="mt-7 font-display text-[clamp(1.625rem,1.35rem+0.9vw,2.125rem)] leading-tight">{title}</h2>
      {children && <div className="mt-3 max-w-[32rem] text-[0.9375rem] leading-relaxed text-muted">{children}</div>}
      {actions && <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
