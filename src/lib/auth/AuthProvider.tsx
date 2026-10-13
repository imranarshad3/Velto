import { lazy, Suspense, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/react'
import { AuthContext, clerkPublishableKey, guestAuth, type AppAuth } from './context.ts'

// Inline `import.meta.env.DEV` so production builds drop the dev-only module entirely.
const DevAuthProvider =
  import.meta.env.DEV && import.meta.env.VITE_DEV_FAKE_AUTH === '1' ? lazy(() => import('./DevAuthProvider.tsx')) : null

function ClerkBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const value = useMemo<AppAuth>(
    () => ({
      mode: 'clerk',
      enabled: true,
      loaded: isLoaded,
      signedIn: Boolean(isSignedIn),
      user: user
        ? { id: user.id, name: user.fullName ?? user.firstName ?? null, email: user.primaryEmailAddress?.emailAddress ?? null, imageUrl: user.imageUrl ?? null }
        : null,
      getToken: (options) => getToken(options?.skipCache ? { skipCache: true } : undefined),
      signOut: () => signOut(),
    }),
    [isLoaded, isSignedIn, getToken, user, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Clerk when VITE_CLERK_PUBLISHABLE_KEY is set; otherwise guest-only. Dev fake auth only in `vite dev`. */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  if (DevAuthProvider) {
    return (
      <Suspense fallback={null}>
        <DevAuthProvider>{children}</DevAuthProvider>
      </Suspense>
    )
  }
  if (!clerkPublishableKey) return <AuthContext.Provider value={guestAuth}>{children}</AuthContext.Provider>

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      routerPush={(to: string) => navigate(to)}
      routerReplace={(to: string) => navigate(to, { replace: true })}
    >
      <ClerkBridge>{children}</ClerkBridge>
    </ClerkProvider>
  )
}
