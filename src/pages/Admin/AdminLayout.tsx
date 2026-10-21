import { workspaceApi } from '../../features/cms/api.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import { canAccess } from '../../features/cms/permissions.ts'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { useState } from 'react'
import { ChartNoAxesCombined, ChevronDown, FolderCog, PanelLeftClose, PanelLeftOpen, ClipboardList, FileText, Grid2X2, Image, Kanban, LayoutDashboard, Mail, Package, PanelsTopLeft, Settings, ShieldAlert, UserCog, Users } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import { useIsAdmin } from '../../features/admin/useIsAdmin.ts'
import { useAdminShell } from '../../features/admin/shellStore.ts'
import { useMediaQuery } from '../../lib/useMediaQuery.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/website', label: 'Website Editor', icon: PanelsTopLeft },
  { to: '/admin/pages', label: 'Pages & Sections', icon: FileText },
  { to: '/admin/media', label: 'Media Library', icon: Image },
  { to: '/admin/pipeline', label: 'Sales Pipeline', icon: Kanban },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/admin/orders', label: 'Orders', icon: Package },
  { to: '/admin/quotes', label: 'Project consultations', icon: ClipboardList },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Grid2X2 },
  { to: '/admin/resources', label: 'Resources', icon: FileText },
  { to: '/admin/customers', label: 'CRM / Customers', icon: Users },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/team', label: 'Team', icon: UserCog },
]

const darkFocus = 'focus-visible:outline-mint'
/** Site-building and pipeline tools grouped under one collapsible "Management" menu. */
const managementPaths = new Set(['/admin/website', '/admin/pages', '/admin/media', '/admin/pipeline', '/admin/settings'])
type NavEntry = (typeof nav)[number]

function NavItem({ to, label, icon: Icon, end, nested = false }: NavEntry & { nested?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative inline-flex min-h-11 w-full items-center gap-3 rounded-full px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-[background-color,color] duration-200 lg:rounded-xl lg:px-3 ${nested ? 'lg:text-[0.875rem]' : ''} ${darkFocus} ${
          isActive
            ? `bg-white text-forest-deep lg:bg-white/10 lg:text-white lg:ring-1 lg:ring-white/10 lg:before:absolute lg:before:top-1/2 lg:before:h-5 lg:before:w-1 lg:before:-translate-y-1/2 lg:before:rounded-r-full lg:before:bg-mint ${nested ? 'lg:before:-left-[calc(1rem+1px)]' : 'lg:before:-left-4'}`
            : 'text-white/75 ring-1 ring-white/15 hover:bg-white/10 hover:text-white lg:ring-0'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon aria-hidden="true" className={`size-[1.125rem] shrink-0 ${isActive ? 'text-forest lg:text-mint' : 'text-white/60 group-hover:text-white'}`} />
          {label}
        </>
      )}
    </NavLink>
  )
}

/** Animated grid-rows collapse; collapsed links are inert so they leave the tab order. */
function ManagementPanel({ id, items, open, className = '' }: { id: string; items: NavEntry[]; open: boolean; className?: string }) {
  return (
    <div id={id} inert={!open} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} ${className}`}>
      <ul className="min-h-0 overflow-hidden max-lg:no-scrollbar max-lg:flex max-lg:gap-1.5 max-lg:overflow-x-auto max-lg:px-[var(--page-gutter)] max-lg:pb-3 lg:mt-1 lg:ml-5 lg:flex lg:flex-col lg:gap-0.5 lg:border-l lg:border-white/15 lg:pl-3">
        {items.map(item => <li key={item.to} className="shrink-0"><NavItem {...item} nested /></li>)}
      </ul>
    </div>
  )
}

function ManagementGroup({ items, open, onToggle }: { items: NavEntry[]; open: boolean; onToggle: () => void }) {
  const { pathname } = useLocation()
  const active = items.some(item => pathname.startsWith(item.to))
  return (
    <li className="shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="management-desktop management-mobile"
        onClick={onToggle}
        className={`group relative inline-flex min-h-11 w-full items-center gap-3 rounded-full px-4 text-[0.9375rem] font-medium whitespace-nowrap ring-1 ring-white/15 transition-[background-color,color] duration-200 hover:bg-white/10 hover:text-white lg:rounded-xl lg:px-3 lg:ring-0 ${darkFocus} ${active ? 'text-white' : 'text-white/75'}`}
      >
        <FolderCog aria-hidden="true" className={`size-[1.125rem] shrink-0 ${active ? 'text-mint' : 'text-white/60 group-hover:text-white'}`} />
        Management
        <ChevronDown aria-hidden="true" className={`ml-auto size-4 text-white/60 transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      <ManagementPanel id="management-desktop" className="max-lg:hidden" items={items} open={open} />
    </li>
  )
}

export default function AdminLayout() {
  const auth = useAppAuth()
  const location = useLocation()
  // Management starts open on its own pages and re-opens when navigation lands on one of them.
  const inManagement = [...managementPaths].some(path => location.pathname.startsWith(path))
  const [open, setOpen] = useState(inManagement)
  const [seenPath, setSeenPath] = useState(location.pathname)
  const { sidebarCollapsed, toggleSidebar } = useAdminShell()
  // Collapsing only applies to the desktop sidebar; below lg the nav is a compact strip.
  const collapsed = useMediaQuery('(min-width: 64rem)') && sidebarCollapsed
  // Visual editing tools take the full viewport instead of the padded, max-width page column.
  const fullBleed = /^\/admin\/website\/?$/.test(location.pathname)
  if (seenPath !== location.pathname) {
    setSeenPath(location.pathname)
    if (inManagement) setOpen(true)
  }
  const isAdmin = useIsAdmin()
  const [access] = useAuthedRemote(workspaceApi.access, 'workspace-access')
  const role = access.kind === 'ready' ? access.data.role : null

  const loading = (
    <div aria-busy="true" aria-label="Checking access" className="container-page grid gap-[var(--grid-gap)] py-[clamp(2rem,4vw,3rem)] lg:grid-cols-[15rem_minmax(0,1fr)]">
      <Skeleton className="hidden h-[24rem] lg:block" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-40" />
      </div>
    </div>
  )
  if (auth.enabled && !auth.loaded) return loading
  if (auth.enabled && !auth.signedIn) return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(location.pathname)}`} replace />
  if (auth.enabled && isAdmin === null) return loading
  if (!auth.enabled || !isAdmin) {
    return (
      <div className="relative isolate grid min-h-[calc(100dvh-var(--header-height))] place-items-center overflow-clip bg-canvas px-[var(--page-gutter)] py-[var(--section-gap)]">
        <title>Not authorised — VELTO</title>
        <meta name="robots" content="noindex" />
        <div className="surface-card relative w-full max-w-[34rem] overflow-clip px-[clamp(1.5rem,5vw,3rem)] py-[clamp(2.25rem,6vw,3.5rem)] text-center shadow-[var(--shadow-float)]">
          <span className="relative mx-auto grid size-20 place-items-center rounded-full bg-cream ring-1 ring-sand-deep">
            <span className="grid size-14 place-items-center rounded-full bg-forest-soft text-forest ring-1 ring-forest/20">
              <ShieldAlert aria-hidden="true" className="size-6" />
            </span>
          </span>
          <p className="mt-6 text-[0.75rem] font-semibold tracking-[0.18em] text-forest uppercase">Staff area</p>
          <h1 className="mt-2 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.25rem)] leading-tight">You don’t have access to this area</h1>
          <p className="mx-auto mt-3 max-w-[26rem] leading-relaxed text-muted">The admin area is for VELTO staff. If you need access, ask an existing administrator.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/">Back to the store</ButtonLink>
            {auth.signedIn && (
              <ButtonLink to="/account" variant="secondary">
                My account
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    )
  }

  const allowed = nav.filter(item => !role || canAccess(role, ({website:'cms',pages:'cms',pipeline:'leads'} as Record<string,string>)[item.to.split('/')[2]] ?? item.to.split('/')[2] ?? 'overview'))
  const managed = allowed.filter(item => managementPaths.has(item.to))
  const topLevel = allowed.filter(item => !managementPaths.has(item.to))
  const groupAt = topLevel[0]?.to === '/admin' ? 1 : 0
  // Editors and sales staff land on their first permitted area instead of the admin-only overview.
  if (role && role !== 'admin' && location.pathname.replace(/\/$/, '') === '/admin' && allowed[0]) return <Navigate to={allowed[0].to} replace />

  return (
    <div className={`min-h-[calc(100dvh-var(--header-height))] bg-canvas transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none lg:grid ${fullBleed ? 'lg:h-[calc(100dvh-var(--header-height)-1px)] lg:min-h-0 lg:overflow-hidden' : ''} ${collapsed ? 'lg:grid-cols-[0rem_minmax(0,1fr)]' : 'lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]'}`}>
      <meta name="robots" content="noindex" />
      <aside inert={collapsed ? true : undefined} className={`relative isolate overflow-clip bg-forest-deep text-white lg:sticky lg:top-[calc(var(--header-height)+1px)] lg:h-[calc(100dvh-var(--header-height)-1px)] lg:overflow-y-auto lg:self-start ${collapsed ? 'invisible' : ''}`}>
        <div className="flex h-full flex-col lg:min-w-[15.5rem] lg:px-4 lg:py-6">
          <nav aria-label="Admin" className="min-w-0 lg:flex-1">
            <p className="hidden px-3 pb-2 text-[0.6875rem] font-semibold tracking-[0.16em] text-white/60 uppercase lg:block">Workspace</p>
            <ul className="no-scrollbar flex gap-1.5 overflow-x-auto px-[var(--page-gutter)] py-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-0">
              {topLevel.slice(0, groupAt).map(item => <li key={item.to} className="shrink-0"><NavItem {...item} /></li>)}
              {managed.length > 0 && <ManagementGroup items={managed} open={open} onToggle={() => setOpen(o => !o)} />}
              {topLevel.slice(groupAt).map(item => <li key={item.to} className="shrink-0"><NavItem {...item} /></li>)}
            </ul>
            {/* Below lg the strip scrolls sideways, so the expanded group opens as its own row. */}
            {managed.length > 0 && <ManagementPanel id="management-mobile" className="lg:hidden" items={managed} open={open} />}
          </nav>
          <button type="button" onClick={toggleSidebar} className={`mt-4 hidden min-h-11 items-center gap-3 rounded-xl px-3 text-[0.875rem] font-medium text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex ${darkFocus}`}>
            <PanelLeftClose aria-hidden="true" className="size-[1.125rem]" /> Collapse sidebar
          </button>
        </div>
      </aside>

      <div className={`relative min-w-0 ${fullBleed ? 'min-h-0 lg:h-full lg:overflow-clip' : 'px-[var(--page-gutter)] pt-[clamp(1.25rem,3vw,2.5rem)] pb-[clamp(3rem,6vw,5rem)] lg:px-[clamp(1.75rem,3vw,3.5rem)]'}`}>
        {collapsed && !fullBleed && (
          <button type="button" onClick={toggleSidebar} aria-label="Expand admin sidebar" className="fixed bottom-6 left-4 z-30 hidden size-11 place-items-center rounded-full bg-forest-deep text-white shadow-[var(--shadow-float)] hover:bg-forest lg:grid">
            <PanelLeftOpen aria-hidden="true" className="size-5" />
          </button>
        )}
        <div className={fullBleed ? 'lg:h-full' : 'mx-auto w-full max-w-[96rem]'}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
