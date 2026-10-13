import type { ReactNode } from 'react'
import Breadcrumb, { type Crumb } from '../../components/ui/Breadcrumb.tsx'

/** Page header row for admin screens: breadcrumb, title, description and primary actions. */
export default function AdminHeading({ title, crumbs = [], children, actions, meta }: { title: ReactNode; crumbs?: Crumb[]; children?: ReactNode; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="mb-[clamp(1.5rem,3vw,2.25rem)] border-b border-border pb-[clamp(1.25rem,2.5vw,1.75rem)]">
      <Breadcrumb items={[{ label: 'Admin', to: '/admin' }, ...crumbs]} />
      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1 basis-[20rem]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="min-w-0 font-display text-[clamp(1.875rem,1.5rem+1.4vw,2.625rem)] leading-[1.1] break-words text-ink">{title}</h1>
            {meta}
          </div>
          {children && <div className="mt-2 max-w-[46rem] text-[0.9375rem] leading-relaxed text-muted">{children}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
