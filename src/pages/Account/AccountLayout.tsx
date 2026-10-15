import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { ArrowRight, ClipboardList, Heart, LayoutDashboard, LogOut, Package, ShieldCheck, UserCog, UserRound } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { useIsAdmin } from '../../features/admin/useIsAdmin.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import AccountAvatar from './AccountAvatar.tsx'

const nav = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/quotes', label: 'My quotes', icon: ClipboardList },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/profile', label: 'Profile & security', icon: UserCog },
]

/** Shared by mobile chips and the desktop rail: forest-soft fill + copper bar when active (matches the mobile menu). */
const itemBase =
  'relative inline-flex min-h-11 w-full items-center gap-2.5 rounded-full border px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-200 lg:rounded-xl lg:border-transparent lg:px-3.5'
const itemActive =
  'border-forest/25 bg-forest-soft font-semibold text-forest lg:before:absolute lg:before:inset-y-2.5 lg:before:left-0 lg:before:w-1 lg:before:rounded-full lg:before:bg-copper'
const itemIdle = 'border-border bg-surface text-ink hover:border-forest/40 hover:text-forest lg:bg-transparent lg:hover:bg-sand/70'

/** UI guard only: every account API call is authorised server-side from the verified session. */
export default function AccountLayout() {
  const auth = useAppAuth()
  const location = useLocation()
  const isAdmin = useIsAdmin()

  if (!auth.enabled) {
    return (
      <div className="relative isolate overflow-hidden bg-cream py-[var(--section-gap)]">
        <title>My Account — VELTO</title>
        <div className="container-page">
          <div className="animate-rise mx-auto flex max-w-[38rem] flex-col items-center rounded-[var(--radius-panel)] border border-border bg-surface px-6 py-[clamp(2.5rem,6vw,4rem)] text-center shadow-[var(--shadow-float)]">
            <span className="grid size-14 place-items-center rounded-2xl bg-forest-soft text-forest">
              <UserRound aria-hidden="true" className="size-6" />
            </span>
            <p className="mt-6 flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-copper uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-copper/60" />
              My account
              <span aria-hidden="true" className="h-px w-8 bg-copper/60" />
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,1.6rem+1.6vw,2.75rem)] leading-tight">Accounts are coming soon</h1>
            <p className="mt-3 max-w-[30rem] leading-relaxed text-muted">You can request quotes as a guest and track them with your reference and tracking code.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/quote">
                Ask for a price <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
              </ButtonLink>
              <ButtonLink to="/track" variant="secondary">
                Track a request
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (!auth.loaded)
    return (
      <div aria-busy="true" aria-label="Loading your account" className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="hidden h-80 lg:block" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  if (!auth.signedIn) return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(location.pathname)}`} replace />

  const user = auth.user
  const displayName = user?.name ?? user?.email ?? 'customer'

  return (
    <div className="relative isolate">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[clamp(16rem,32vw,24rem)] bg-cream [mask-image:linear-gradient(to_bottom,black_40%,transparent)]" />

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] py-[clamp(1.25rem,3vw,2.5rem)] pb-[var(--section-gap)] lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-12">
        <aside className="min-w-0 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
          <div className="lg:surface-card lg:p-2">
            <div className="hidden items-center gap-3 rounded-xl bg-[linear-gradient(160deg,var(--color-cream),var(--color-surface))] p-3 lg:flex">
              <AccountAvatar user={user} />
              <div className="min-w-0">
                <p className="truncate text-[0.75rem] text-muted">Signed in as</p>
                <p className="truncate font-semibold text-ink capitalize">{displayName}</p>
                {user?.name && user.email && <p className="truncate text-[0.8125rem] text-muted">{user.email}</p>}
              </div>
            </div>
            <nav aria-label="Account" className="lg:mt-2 lg:border-t lg:border-border lg:pt-2">
              <ul className="no-scrollbar -mx-[var(--page-gutter)] flex snap-x gap-2 overflow-x-auto px-[var(--page-gutter)] py-0.5 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:p-0">
                {nav.map(({ to, label, icon: Icon, end }) => (
                  <li key={to} className="shrink-0 snap-start">
                    <NavLink to={to} end={end} className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}>
                      {({ isActive }) => (
                        <>
                          <Icon aria-hidden="true" className={`size-[1.125rem] ${isActive ? 'text-forest' : 'text-muted'}`} /> {label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
                {isAdmin && (
                  <li className="shrink-0 snap-start">
                    <NavLink to="/admin" className={`${itemBase} border-copper/40 bg-surface text-copper hover:border-copper lg:bg-transparent lg:hover:bg-copper-soft/60`}>
                      <ShieldCheck aria-hidden="true" className="size-[1.125rem]" /> Admin
                    </NavLink>
                  </li>
                )}
                <li className="shrink-0 snap-start lg:mt-2 lg:border-t lg:border-border lg:pt-2">
                  <button type="button" onClick={() => void auth.signOut()} className={`${itemBase} border-border bg-surface text-muted hover:border-danger/40 hover:text-danger lg:bg-transparent lg:hover:bg-danger-soft/60`}>
                    <LogOut aria-hidden="true" className="size-[1.125rem]" /> Sign out
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
