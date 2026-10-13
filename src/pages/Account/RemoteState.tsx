import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import Skeleton from '../../components/ui/Skeleton.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import type { Remote } from '../../features/quotes/useMyQuotes.ts'

/** Loading skeleton / error with retry / content for remote data. */
export default function RemoteState<T>({ state, reload, children, skeleton = 2 }: { state: Remote<T>; reload: () => void; children: (data: T) => ReactNode; skeleton?: number }) {
  if (state.kind === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-3">
        {Array.from({ length: skeleton }, (_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <Skeleton className="h-3.5 w-2/5 rounded-full" />
              <Skeleton className="h-3 w-4/5 rounded-full" />
              <Skeleton className="h-3 w-3/5 rounded-full" />
            </div>
            <Skeleton className="hidden h-8 w-28 shrink-0 rounded-full sm:block" />
          </div>
        ))}
      </div>
    )
  }
  if (state.kind === 'error') {
    return (
      <div role="alert" className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-danger/20 bg-danger-soft/60 p-5 sm:flex-row sm:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-danger shadow-[var(--shadow-soft)]">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">Something went wrong</p>
          <p className="mt-0.5 text-[0.9375rem] text-danger">{state.message}</p>
        </div>
        <button type="button" onClick={reload} className={buttonClass('secondary', 'sm', 'w-fit')}>
          <RefreshCw aria-hidden="true" className="size-4" /> Try again
        </button>
      </div>
    )
  }
  return <>{children(state.data)}</>
}
