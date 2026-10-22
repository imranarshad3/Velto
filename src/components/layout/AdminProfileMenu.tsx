import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { LogOut, UserRound } from 'lucide-react'
import { useAppAuth } from '../../lib/auth/context.ts'

export default function AdminProfileMenu({ name, email, imageUrl }: { name: string; email: string; imageUrl: string | null }) {
  const auth = useAppAuth()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const signOut = async () => {
    setSigningOut(true)
    try {
      await auth.signOut()
    } finally {
      setSigningOut(false)
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open admin account menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(value => !value)}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-[0.1875rem] focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        {imageUrl ? <img src={imageUrl} alt="" className="size-9 rounded-full object-cover" /> : <span aria-hidden="true" className="font-semibold uppercase">{name.trim().slice(0, 1) || 'A'}</span>}
      </button>
      {open && (
        <section id={menuId} aria-label="Admin account" className="absolute top-[calc(100%+0.625rem)] right-0 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-surface text-ink shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-3.5 border-b border-border bg-canvas px-4 py-4">
            {imageUrl ? <img src={imageUrl} alt="" className="size-11 shrink-0 rounded-full border border-border object-cover" /> : <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-forest-soft font-semibold text-forest uppercase">{name.trim().slice(0, 1) || 'A'}</span>}
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-semibold">{name}</p>
              {email && <p className="truncate text-[0.8125rem] text-muted">{email}</p>}
              <p className="mt-1 text-[0.6875rem] font-bold tracking-[0.14em] text-forest uppercase">VELTO Admin</p>
            </div>
          </div>
          <div className="grid gap-1 p-2">
            <Link to="/account/profile" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-forest-soft focus-visible:outline-2 focus-visible:outline-forest">
              <UserRound aria-hidden="true" className="size-[1.125rem] text-muted" /> Manage account
            </Link>
            <button type="button" onClick={() => void signOut()} disabled={signingOut} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-[0.9375rem] font-medium text-ink transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-forest disabled:opacity-60">
              <LogOut aria-hidden="true" className="size-[1.125rem]" /> {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
