import type { ReactNode } from 'react'
import Breadcrumb, { type Crumb } from './Breadcrumb.tsx'

interface PageHeaderProps {
  title: string
  crumbs: Crumb[]
  eyebrow?: string
  description?: ReactNode
  actions?: ReactNode
}

/** Standard cream page header used by utility and content pages. */
export default function PageHeader({ title, crumbs, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <section aria-labelledby="page-title" className="bg-[#f6f1e9]">
      <div className="container-page pt-2 pb-[clamp(1.75rem,4vw,3rem)]">
        <Breadcrumb items={crumbs} />
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[44rem]">
            {eyebrow && <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-copper uppercase">{eyebrow}</p>}
            <h1 id="page-title" className="animate-rise mt-1 font-display text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] leading-[1.05] text-ink">
              {title}
            </h1>
            {description && <div className="animate-rise mt-3 text-[clamp(0.9375rem,0.9rem+0.25vw,1.0625rem)] text-muted">{description}</div>}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
    </section>
  )
}
