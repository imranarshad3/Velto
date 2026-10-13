import { useEffect, useState } from 'react'
import { QuoteApiError } from '../features/quotes/api.ts'
import { useAppAuth } from './auth/context.ts'

export type Remote<T> = { kind: 'loading' } | { kind: 'error'; message: string; status: number } | { kind: 'ready'; data: T }

const toError = (error: unknown) => ({
  kind: 'error' as const,
  status: error instanceof QuoteApiError ? error.status : 0,
  message: error instanceof QuoteApiError ? error.message : 'Something went wrong. Please try again.',
})

/** True for a genuinely expired session token: worth one retry with a freshly minted token. */
const isExpired = (error: unknown) => error instanceof QuoteApiError && error.status === 401 && error.code === 'session_invalid'

/**
 * Loads data with a verified session token once auth has finished loading. A cached token can expire in
 * the moment between sign-in and the first request, so an "expired" 401 is retried once with a fresh token.
 * `key` identifies the request; `reload()` retries.
 */
export function useAuthedRemote<T>(load: (token: string) => Promise<T>, key: string) {
  const { getToken, signedIn, loaded } = useAppAuth()
  const [state, setState] = useState<Remote<T>>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!loaded || !signedIn) return
    let cancelled = false
    const run = async (skipCache: boolean) => {
      const token = await getToken({ skipCache })
      if (!token) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
      return load(token)
    }
    setState((s) => (s.kind === 'error' ? { kind: 'loading' } : s))
    run(false)
      .catch((error: unknown) => (isExpired(error) && !cancelled ? run(true) : Promise.reject(error)))
      .then((data) => !cancelled && setState({ kind: 'ready', data }))
      .catch((error: unknown) => !cancelled && setState(toError(error)))
    return () => {
      cancelled = true
    }
    // `load` is recreated each render; `key` captures its identity.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, signedIn, loaded, key, attempt])

  const reload = () => {
    setState((s) => (s.kind === 'ready' ? s : { kind: 'loading' }))
    setAttempt((n) => n + 1)
  }
  return [state, reload] as const
}
