import type { ReactNode } from 'react'
import Breadcrumb, { type Crumb } from '../../components/ui/Breadcrumb.tsx'

export default function AccountHeading({ title, crumbs, children, actions }: { title: string; crumbs: Crumb[]; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'My Account', to: '/account' }, ...crumbs]} />
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2rem,1.5rem+2vw,2.75rem)] leading-tight">{title}</h1>
          {children && <div className="mt-1 text-muted">{children}</div>}
        </div>
        {actions}
      </div>
    </div>
  )
}
