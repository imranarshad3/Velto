import { UserProfile } from '@clerk/react'
import { useAppAuth } from '../../lib/auth/context.ts'
import { clerkAppearance } from '../../lib/auth/clerkAppearance.ts'
import AccountHeading from './AccountHeading.tsx'

/** Profile, email, password and sessions are managed by Clerk's secure components. */
export default function ProfilePage() {
  const auth = useAppAuth()

  return (
    <>
      <title>Profile — NOVARO</title>
      <AccountHeading title="Profile & security" crumbs={[{ label: 'Profile' }]}>
        Manage your name, email addresses, password and signed-in devices.
      </AccountHeading>
      {auth.mode === 'clerk' ? (
        <div className="overflow-x-auto">
          <UserProfile routing="path" path="/account/profile" appearance={clerkAppearance} />
        </div>
      ) : (
        <dl className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">Name</dt>
            <dd className="font-semibold">{auth.user?.name}</dd>
          </div>
          <div>
            <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">Email</dt>
            <dd className="font-semibold break-all">{auth.user?.email}</dd>
          </div>
          {import.meta.env.DEV && <p className="text-[0.875rem] text-muted sm:col-span-2">Local dev mode: profile editing is provided by Clerk in real deployments.</p>}
        </dl>
      )}
    </>
  )
}
