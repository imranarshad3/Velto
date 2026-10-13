import { UserRound } from 'lucide-react'
import type { AppUser } from '../../lib/auth/context.ts'

function initialsOf(user: AppUser | null) {
  const source = user?.name?.trim() || user?.email?.split('@')[0] || ''
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase() || null
}

/** Initials (or the Clerk avatar) in a forest disc. */
export default function AccountAvatar({ user, size = 'md' }: { user: AppUser | null; size?: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'size-16 text-[1.25rem]' : 'size-11 text-[0.9375rem]'
  const initials = initialsOf(user)
  return (
    <span aria-hidden="true" className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(160deg,var(--color-forest-mid),var(--color-forest-dark))] font-bold tracking-[0.04em] text-white ring-2 ring-gold/50 ring-offset-2 ring-offset-surface ${cls}`}>
      {user?.imageUrl ? <img src={user.imageUrl} alt="" width={64} height={64} className="size-full object-cover" /> : (initials ?? <UserRound className="size-1/2" />)}
    </span>
  )
}
