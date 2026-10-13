import type { ReactNode } from 'react'
import Breadcrumb, { type Crumb } from '../../components/ui/Breadcrumb.tsx'

export default function AdminHeading({ title, crumbs = [], children, actions }: { title: string; crumbs?: Crumb[]; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      <Breadcrumb items={[{ label: 'Admin', to: '/admin' }, ...crumbs]} />
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)] leading-tight break-words">{title}</h1>
          {children && <div className="mt-1 text-muted">{children}</div>}
        </div>
        {actions}
      </div>
    </div>
  )
}
