import { Check } from 'lucide-react'
import { quoteStatusLabels, type QuoteStatus as Status } from '../../features/quotes/schema.ts'

const flow: Status[] = ['submitted', 'reviewing', 'quoted']

/** Status badge plus a three-step progress track; `closed` is shown as a terminal state. */
export default function QuoteStatus({ status }: { status: Status }) {
  const current = flow.indexOf(status)

  return (
    <div className="flex flex-col gap-3">
      <span
        className={`w-fit rounded-full px-3 py-1 text-[0.8125rem] font-bold ${status === 'quoted' ? 'bg-forest text-white' : status === 'closed' ? 'bg-ink/10 text-ink' : 'bg-forest-soft text-forest'}`}
      >
        {quoteStatusLabels[status]}
      </span>
      {status !== 'closed' && status !== 'cancelled' && (
        <ol className="flex items-center gap-2" aria-label="Progress">
          {flow.map((step, i) => {
            const done = i <= current
            return (
              <li key={step} className="flex flex-1 items-center gap-2 text-[0.75rem] text-muted" aria-current={i === current ? 'step' : undefined}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full ${done ? 'bg-forest text-white' : 'border border-border bg-surface'}`}>
                  {done && <Check aria-hidden="true" className="size-3.5" />}
                </span>
                <span className={`hidden sm:inline ${done ? 'font-semibold text-ink' : ''}`}>{quoteStatusLabels[step]}</span>
                {i < flow.length - 1 && <span aria-hidden="true" className={`h-px flex-1 ${i < current ? 'bg-forest' : 'bg-border'}`} />}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
