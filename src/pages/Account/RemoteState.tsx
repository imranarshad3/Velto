import { RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Remote } from '../../features/quotes/useMyQuotes.ts'

/** Loading skeleton / error with retry / content for remote data. */
export default function RemoteState<T>({ state, reload, children, skeleton = 2 }: { state: Remote<T>; reload: () => void; children: (data: T) => ReactNode; skeleton?: number }) {
  if (state.kind === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-3">
        {Array.from({ length: skeleton }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-[var(--radius-card)] bg-sand" />
        ))}
      </div>
    )
  }
  if (state.kind === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-5">
        <p className="font-semibold text-danger">{state.message}</p>
        <button type="button" onClick={reload} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 font-semibold hover:border-forest">
          <RefreshCw aria-hidden="true" className="size-4" /> Try again
        </button>
      </div>
    )
  }
  return <>{children(state.data)}</>
}
