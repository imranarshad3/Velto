import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { adminApi } from './api.ts'

/** Server-confirmed admin status (UI hint only; every admin request is re-authorised server-side). */
export function useIsAdmin(): boolean | null {
  const { signedIn } = useAppAuth()
  const [state] = useAuthedRemote(async (t) => (await adminApi.me(t)).isAdmin, 'admin-me')
  if (!signedIn) return false
  return state.kind === 'ready' ? state.data : state.kind === 'error' ? false : null
}
