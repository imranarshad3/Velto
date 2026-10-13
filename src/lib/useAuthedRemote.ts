import { useEffect, useState } from 'react'
import { QuoteApiError } from '../features/quotes/api.ts'
import { useAppAuth } from './auth/context.ts'

export type Remote<T> = { kind: 'loading' } | { kind: 'error'; message: string; status: number } | { kind: 'ready'; data: T }

const toError = (error: unknown) => ({
  kind: 'error' as const,
  status: error instanceof QuoteApiError ? error.status : 0,
  message: error instanceof QuoteApiError ? error.message : 'Something went wrong. Please try again.',
})

/** Loads data with the current session token. `key` identifies the request; `reload()` retries. */
export function useAuthedRemote<T>(load: (token: string) => Promise<T>, key: string) {
  const { getToken, signedIn } = useAppAuth()
  const [state, setState] = useState<Remote<T>>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    getToken()
      .then((token) => {
        if (!token) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
        return load(token)
      })
      .then((data) => !cancelled && setState({ kind: 'ready', data }))
      .catch((error: unknown) => !cancelled && setState(toError(error)))
    return () => {
      cancelled = true
    }
    // `load` is recreated each render; `key` captures its identity.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, signedIn, key, attempt])

  const reload = () => {
    setState((s) => (s.kind === 'ready' ? s : { kind: 'loading' }))
    setAttempt((n) => n + 1)
  }
  return [state, reload] as const
}
