import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { ArrowLeft, ClipboardList, LayoutDashboard, Mail, Package, ShieldAlert, Users } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { useIsAdmin } from '../../features/admin/useIsAdmin.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/quotes', label: 'Quotes', icon: ClipboardList },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
]

export default function AdminLayout() {
  const auth = useAppAuth()
  const location = useLocation()
  const isAdmin = useIsAdmin()

  const loading = <div aria-busy="true" aria-label="Checking access" className="container-page my-10 h-64 animate-pulse rounded-[var(--radius-card)] bg-sand" />
  if (auth.enabled && !auth.loaded) return loading
  if (auth.enabled && !auth.signedIn) return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(location.pathname)}`} replace />
  if (auth.enabled && isAdmin === null) return loading
  if (!auth.enabled || !isAdmin) {
    return (
      <div className="container-page grid min-h-[50dvh] place-items-center py-[var(--section-gap)] text-center">
        <title>Not authorised — NOVARO</title>
        <meta name="robots" content="noindex" />
        <div className="max-w-[32rem]">
          <ShieldAlert aria-hidden="true" className="mx-auto size-12 text-copper" />
          <h1 className="mt-4 font-display text-[2rem]">You don’t have access to this area</h1>
          <p className="mt-2 text-muted">The admin area is for NOVARO staff. If you need access, ask an existing administrator.</p>
          <ButtonLink to="/" className="mt-6">
            Back to the store
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-[clamp(1.5rem,3vw,2.5rem)] pb-[var(--section-gap)] lg:grid-cols-[14rem_minmax(0,1fr)] xl:gap-10">
      <meta name="robots" content="noindex" />
      <nav aria-label="Admin" className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
        <p className="hidden px-3 pb-3 text-[0.75rem] font-semibold tracking-[0.16em] text-copper uppercase lg:block">NOVARO Admin</p>
        <ul className="no-scrollbar -mx-[var(--page-gutter)] flex gap-2 overflow-x-auto px-[var(--page-gutter)] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="shrink-0">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex min-h-11 w-full items-center gap-2.5 rounded-full border px-4 text-[0.9375rem] font-medium whitespace-nowrap lg:rounded-lg lg:border-transparent ${isActive ? 'border-forest bg-forest text-white' : 'border-border bg-surface hover:border-forest hover:text-forest lg:bg-transparent lg:hover:bg-sand'}`
                }
              >
                <Icon aria-hidden="true" className="size-[1.125rem]" /> {label}
              </NavLink>
            </li>
          ))}
          <li className="shrink-0 lg:mt-3 lg:border-t lg:border-border lg:pt-3">
            <NavLink to="/" className="inline-flex min-h-11 w-full items-center gap-2.5 rounded-full border border-border bg-surface px-4 text-[0.9375rem] whitespace-nowrap text-muted hover:text-forest lg:rounded-lg lg:border-transparent lg:bg-transparent">
              <ArrowLeft aria-hidden="true" className="size-[1.125rem]" /> Back to store
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
