import { useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AppAuth } from './context.ts'

/**
 * LOCAL TESTING ONLY (vite dev + VITE_DEV_FAKE_AUTH=1). Signs in as a fake user whose token
 * (`dev:<id>`) is accepted only by a local server started with NOVARO_DEV_FAKE_AUTH=1.
 */
const KEY = 'novaro-dev-user'
const users = ['dev_customer_a', 'dev_customer_b', 'dev_admin']

const read = () => {
  try {
    const id = localStorage.getItem(KEY)
    return id && users.includes(id) ? id : null
  } catch {
    return null
  }
}

export default function DevAuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(read)

  const select = (id: string | null) => {
    try {
      if (id) localStorage.setItem(KEY, id)
      else localStorage.removeItem(KEY)
    } catch {
      /* storage unavailable */
    }
    setUserId(id)
  }

  const value = useMemo<AppAuth>(
    () => ({
      mode: 'dev',
      enabled: true,
      loaded: true,
      signedIn: Boolean(userId),
      user: userId ? { id: userId, name: userId.replace('dev_', '').replace('_', ' '), email: `${userId}@example.test`, imageUrl: null } : null,
      getToken: async () => (userId ? `dev:${userId}` : null),
      signOut: async () => select(null),
    }),
    [userId],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <div className="fixed bottom-2 left-2 z-50 flex max-w-[calc(100vw-1rem)] flex-wrap items-center gap-1 rounded-lg bg-ink/90 p-1 text-[0.75rem] text-white">
        <span className="px-1 font-bold">DEV AUTH</span>
        {users.map((id) => (
          <button key={id} type="button" onClick={() => select(id)} className={`min-h-8 rounded px-2 ${userId === id ? 'bg-copper' : 'hover:bg-white/15'}`}>
            {id.replace('dev_', '')}
          </button>
        ))}
        <button type="button" onClick={() => select(null)} className="min-h-8 rounded px-2 hover:bg-white/15">
          sign out
        </button>
      </div>
    </AuthContext.Provider>
  )
}
