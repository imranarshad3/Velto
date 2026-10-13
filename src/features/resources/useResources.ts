import { useEffect, useState } from 'react'
import { call } from '../quotes/api.ts'
import type { ResourceCatalog } from './types.ts'

export type ResourcesState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: ResourceCatalog }

// One request shared by every page in the session (Resource Center, calculator, product pages).
let pending: Promise<ResourceCatalog> | null = null
const load = () => (pending ??= call<ResourceCatalog>('/api/resources', { method: 'GET' }).catch((error: unknown) => {
  pending = null
  throw error
}))

/** Published technical documents and verified coverage data from the server. */
export function useResources() {
  const [state, setState] = useState<ResourcesState>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    load()
      .then((data) => live && setState({ kind: 'ready', data }))
      .catch((error: unknown) => live && setState({ kind: 'error', message: error instanceof Error ? error.message : 'Resources could not be loaded.' }))
    return () => {
      live = false
    }
  }, [attempt])
  const retry = () => {
    setState({ kind: 'loading' })
    setAttempt((n) => n + 1)
  }
  return [state, retry] as const
}
