import type { ReactNode } from 'react'
import Breadcrumb, { type Crumb } from './Breadcrumb.tsx'
import Skeleton from './Skeleton.tsx'

interface PageHeaderProps {
  className?: string
  title: string
  crumbs: Crumb[]
  eyebrow?: string
  description?: ReactNode
  actions?: ReactNode
  /** Optional right-hand content on wide screens (stats, a card, an icon panel). */
  aside?: ReactNode
}

export function PageHeaderSkeleton({ aside = false }: { aside?: boolean }) {
  return (
    <section aria-hidden="true" className="relative isolate overflow-hidden border-b border-border/70 bg-cream">
      <div className="container-page pt-3 pb-[clamp(2.75rem,1.75rem+4vw,5rem)]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <span className="text-muted/40">/</span>
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className={`mt-5 grid items-end gap-8 ${aside ? 'lg:grid-cols-[minmax(0,1fr)_auto]' : ''}`}>
          <div className="max-w-[46rem] space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-[clamp(2.375rem,1.6rem+2.9vw,3.875rem)] w-4/5 rounded-2xl" />
            <Skeleton className="h-5 w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4 rounded-lg" />
          </div>
          {aside && (
            <div className="hidden lg:block">
              <Skeleton className="h-64 w-[clamp(19rem,26vw,24rem)] rounded-[var(--radius-panel)]" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Standard page header for utility and content pages: cream field, blueprint grid and soft brand glow. */
export default function PageHeader({ className = '', title, crumbs, eyebrow, description, actions, aside }: PageHeaderProps) {
  return (
    <section aria-labelledby="page-title" className={`relative isolate overflow-hidden border-b border-border/70 bg-cream ${className}`}>
      <div className="container-page pt-3 pb-[clamp(2.75rem,1.75rem+4vw,5rem)]">
        <Breadcrumb items={crumbs} />
        <div className={`mt-5 grid items-end gap-8 ${aside ? 'lg:grid-cols-[minmax(0,1fr)_auto]' : ''}`}>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
            <div className="max-w-[46rem]">
              {eyebrow && (
                <p className="animate-rise flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-copper uppercase">
                  <span aria-hidden="true" className="h-px w-8 bg-copper/60" />
                  {eyebrow}
                </p>
              )}
              <h1 id="page-title" className="animate-rise mt-2 font-display text-[clamp(2.375rem,1.6rem+2.9vw,3.875rem)] leading-[1.02] tracking-[-0.015em] text-ink [--delay:0.05s] sm:mt-3">
                {title}
              </h1>
              {description && <div className="animate-rise mt-5 max-w-[40rem] text-[clamp(0.9375rem,0.9rem+0.3vw,1.125rem)] leading-relaxed text-muted [--delay:0.1s]">{description}</div>}
            </div>
            {actions && <div className="animate-rise flex flex-wrap gap-3 [--delay:0.15s]">{actions}</div>}
          </div>
          {aside && <div className="animate-rise hidden [--delay:0.15s] lg:block">{aside}</div>}
        </div>
      </div>
    </section>
  )
}
