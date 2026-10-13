import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export default function EmptyState({ icon: Icon, title, children, actions }: { icon: LucideIcon; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-[clamp(2.5rem,6vw,4rem)] text-center">
      <span className="grid size-16 place-items-center rounded-full bg-sand text-forest">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <h2 className="mt-5 font-display text-[clamp(1.5rem,1.3rem+0.8vw,2rem)]">{title}</h2>
      {children && <div className="mt-2 max-w-[30rem] text-[0.9375rem] text-muted">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
