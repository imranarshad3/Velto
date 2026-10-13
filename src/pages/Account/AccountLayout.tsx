import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { ClipboardList, Heart, LayoutDashboard, LogOut, Package, ShieldCheck, UserCog } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { useIsAdmin } from '../../features/admin/useIsAdmin.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const nav = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/quotes', label: 'My quotes', icon: ClipboardList },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/profile', label: 'Profile & security', icon: UserCog },
]

/** UI guard only: every account API call is authorised server-side from the verified session. */
export default function AccountLayout() {
  const auth = useAppAuth()
  const location = useLocation()
  const isAdmin = useIsAdmin()

  if (!auth.enabled) {
    return (
      <div className="container-page py-[var(--section-gap)]">
        <title>My Account — NOVARO</title>
        <div className="mx-auto max-w-[36rem] rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center">
          <h1 className="font-display text-[2rem]">Accounts are coming soon</h1>
          <p className="mt-2 text-muted">You can request quotes as a guest and track them with your reference and tracking code.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/quote">Request a quote</ButtonLink>
            <ButtonLink to="/track" variant="secondary">
              Track a request
            </ButtonLink>
          </div>
        </div>
      </div>
    )
  }
  if (!auth.loaded) return <div aria-busy="true" aria-label="Loading your account" className="container-page my-10 h-64 animate-pulse rounded-[var(--radius-card)] bg-sand" />
  if (!auth.signedIn) return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(location.pathname)}`} replace />

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-[clamp(1.5rem,3vw,2.5rem)] pb-[var(--section-gap)] lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-10">
      <nav aria-label="Account" className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
        <p className="hidden truncate px-3 pb-3 text-[0.875rem] text-muted lg:block">
          Signed in as <span className="font-semibold text-ink">{auth.user?.name ?? auth.user?.email ?? 'customer'}</span>
        </p>
        <ul className="no-scrollbar -mx-[var(--page-gutter)] flex gap-2 overflow-x-auto px-[var(--page-gutter)] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="shrink-0">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex min-h-11 w-full items-center gap-2.5 rounded-full border px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors lg:rounded-lg lg:border-transparent ${isActive ? 'border-forest bg-forest text-white' : 'border-border bg-surface hover:border-forest hover:text-forest lg:bg-transparent lg:hover:bg-sand'}`
                }
              >
                <Icon aria-hidden="true" className="size-[1.125rem]" /> {label}
              </NavLink>
            </li>
          ))}
          {isAdmin && (
            <li className="shrink-0">
              <NavLink to="/admin" className="inline-flex min-h-11 w-full items-center gap-2.5 rounded-full border border-copper/40 bg-surface px-4 text-[0.9375rem] font-medium whitespace-nowrap text-copper hover:border-copper lg:rounded-lg lg:border-transparent lg:bg-transparent lg:hover:bg-sand">
                <ShieldCheck aria-hidden="true" className="size-[1.125rem]" /> Admin
              </NavLink>
            </li>
          )}
          <li className="shrink-0 lg:mt-3 lg:border-t lg:border-border lg:pt-3">
            <button type="button" onClick={() => void auth.signOut()} className="inline-flex min-h-11 w-full items-center gap-2.5 rounded-full border border-border bg-surface px-4 text-[0.9375rem] font-medium whitespace-nowrap text-muted hover:text-danger lg:rounded-lg lg:border-transparent lg:bg-transparent">
              <LogOut aria-hidden="true" className="size-[1.125rem]" /> Sign out
            </button>
          </li>
        </ul>
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
