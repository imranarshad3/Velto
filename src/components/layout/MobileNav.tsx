import { useContentData } from '../../features/cms/context.ts'
import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { storefrontNav, primaryNav as defaultPrimaryNav, utilityNav } from '../../data/navigation.ts'
import AccountControl from './AccountControl.tsx'
import Logo from '../ui/Logo.tsx'
import { buttonClass } from '../ui/button.ts'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

/** Off-canvas menu built on native <dialog>: focus trapping, Escape and inert background come from the browser. */
export default function MobileNav({ open, onClose }: MobileNavProps) {
  const primaryNav = storefrontNav(useContentData('site', 'Navigation.data', defaultPrimaryNav))
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      closeRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Close after navigating via a menu link.
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  return (
    <dialog
      ref={dialogRef}
      id="mobile-menu"
      aria-labelledby="mobile-menu-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(86vw,22rem)] max-w-none bg-canvas p-0 text-ink backdrop:bg-ink/50 open:animate-[slide-in-left_0.3s_ease-out] backdrop:open:animate-[fade-in_0.3s_ease-out]"
    >
      <div className="flex min-h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id="mobile-menu-title" className="sr-only">
            Menu
          </h2>
          <Logo showTagline={false} />
          <button
            type="button"
            onClick={onClose}
            ref={closeRef}
            className="grid size-11 place-items-center rounded-lg text-ink hover:bg-sand"
            aria-label="Close menu"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 px-4 py-5" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) onClose() }}>
          <Link to="/products" className="mb-6 flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface px-4 text-[0.9375rem] text-muted hover:border-forest">
            <Search aria-hidden="true" className="size-5" /> Find a product
          </Link>
          <p className="mb-3 px-4 text-[0.6875rem] font-bold tracking-[0.16em] text-muted uppercase">Explore VELTO</p>
          <ul className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative flex min-h-12 items-center rounded-xl px-4 text-[1.0625rem] font-semibold transition-colors hover:bg-sand ${isActive ? 'bg-forest-soft text-forest before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-full before:bg-copper' : 'text-ink'}`
                  }
                >
                  <span className="flex-1">{item.label}</span><ArrowUpRight aria-hidden="true" className="size-4 text-sage" />
                </NavLink>
              </li>
            ))}
          </ul>
          <ul className="mt-4 flex flex-col border-t border-border pt-4">
            {utilityNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className="flex min-h-11 items-center rounded-lg px-3 text-[0.9375rem] text-muted hover:bg-sand hover:text-ink"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) onClose() }}>
          <Link to="/quote" className={buttonClass('primary', 'md', 'w-full')}>
            Ask for Price
          </Link>
          <AccountControl variant="menu" />
        </div>
      </div>
    </dialog>
  )
}
