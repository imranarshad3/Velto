import { Link } from 'react-router'
import { UserButton } from '@clerk/react'
import { Store } from 'lucide-react'
import { useAppAuth } from '../../lib/auth/context.ts'

const darkFocus = 'focus-visible:outline-mint'

/** Slim app bar for the admin console; replaces the storefront header on /admin routes. */
export default function AdminTopBar() {
  const auth = useAppAuth()
  const who = auth.user?.name || auth.user?.email || null

  return (
    <header data-admin-bar className="sticky top-0 z-40 border-b border-white/10 bg-forest-deep text-white">
      <div className="flex h-[var(--admin-bar-height)] items-center gap-3 px-[var(--page-gutter)] lg:px-6">
        <Link to="/admin" aria-label="VELTO admin console home" className={`inline-flex min-h-11 items-center gap-2.5 rounded-md ${darkFocus}`}>
          <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 shrink-0 text-mint">
            <path d="M3 29V5l9 6v18z" fill="currentColor" />
            <path d="M12 11l17-8v24l-9 2V15z" fill="currentColor" opacity="0.7" />
          </svg>
          <span className="flex items-baseline gap-2 leading-none">
            <span className="text-[1rem] font-bold tracking-[0.12em]">VELTO</span>
            <span className="text-[0.6875rem] font-semibold tracking-[0.18em] text-mint uppercase">Admin</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <Link
            to="/"
            className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-[0.875rem] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white ${darkFocus}`}
          >
            <Store aria-hidden="true" className="size-[1.125rem]" />
            <span className="sr-only sm:not-sr-only">View store</span>
          </Link>
          {auth.signedIn && (
            <div className="flex min-w-0 items-center gap-3 border-l border-white/10 pl-3">
              {who && <span className="hidden max-w-[14rem] truncate text-[0.875rem] font-medium text-white/80 md:block">{who}</span>}
              {auth.mode === 'clerk' ? (
                <UserButton userProfileMode="navigation" userProfileUrl="/account/profile" />
              ) : (
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-mint text-[0.8125rem] font-bold text-forest-deep uppercase">
                  {(who ?? 'S').slice(0, 1)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
