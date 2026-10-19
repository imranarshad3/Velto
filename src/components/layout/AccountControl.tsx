import { Link } from 'react-router'
import { UserButton } from '@clerk/react'
import { UserRound } from 'lucide-react'
import { useAppAuth } from '../../lib/auth/context.ts'
import ButtonLink from '../ui/ButtonLink.tsx'

/** Header/menu account entry: Sign In link, or account link (+ Clerk user menu) when signed in. */
export default function AccountControl({ variant = 'header' }: { variant?: 'header' | 'menu' }) {
  const auth = useAppAuth()
  const menu = variant === 'menu'

  if (auth.enabled && !auth.loaded) return <span className={`inline-block h-11 animate-pulse rounded-lg ${menu ? 'w-full bg-sand' : 'w-24 bg-white/15'}`} aria-hidden="true" />

  if (!auth.signedIn) {
    return (
      <ButtonLink to="/sign-in" variant={menu ? 'primary' : 'light'} className={menu ? 'w-full' : 'px-5 xl:px-7'}>
        Sign In
      </ButtonLink>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${menu ? 'justify-between' : ''}`}>
      <Link to="/account" className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-2 text-[0.9375rem] font-semibold ${menu ? 'text-ink hover:text-forest' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
        <UserRound aria-hidden="true" className="size-5 shrink-0" /> My account
      </Link>
      {auth.mode === 'clerk' && <UserButton userProfileMode="navigation" userProfileUrl="/account/profile" />}
    </div>
  )
}
