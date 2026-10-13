import type { ReactNode } from 'react'
import Breadcrumb, { type Crumb } from '../../components/ui/Breadcrumb.tsx'

interface AccountHeadingProps {
  title: string
  crumbs: Crumb[]
  children?: ReactNode
  actions?: ReactNode
  /** Short copper label above the title. */
  eyebrow?: string
  /** Render the title in the monospace reference style (quote references). */
  mono?: boolean
}

export default function AccountHeading({ title, crumbs, children, actions, eyebrow = 'My account', mono = false }: AccountHeadingProps) {
  return (
    <header className="mb-[clamp(1.5rem,3vw,2.25rem)] border-b border-border/80 pb-[clamp(1.25rem,2.5vw,1.75rem)]">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'My Account', to: '/account' }, ...crumbs]} />
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 max-w-[44rem]">
          <p className="animate-rise flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-copper uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-copper/60" />
            {eyebrow}
          </p>
          <h1
            className={`animate-rise mt-2 text-ink [--delay:0.05s] ${mono ? 'font-mono text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-bold tracking-[0.02em] break-all' : 'font-display text-[clamp(2.125rem,1.6rem+2vw,3.25rem)] leading-[1.04] tracking-[-0.015em]'}`}
          >
            {title}
          </h1>
          {children && <div className="animate-rise mt-3 text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed text-muted [--delay:0.1s]">{children}</div>}
        </div>
        {actions && <div className="animate-rise flex flex-wrap gap-3 [--delay:0.15s]">{actions}</div>}
      </div>
    </header>
  )
}
