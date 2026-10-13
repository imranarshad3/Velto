import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
function pageItems(page: number, count: number): (number | 'gap')[] {
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (['gap', p] as const) : [p]))
}

const base =
  'grid size-11 place-items-center rounded-lg text-[0.9375rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

export default function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Pagination">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          <button type="button" className={`${base} border border-border bg-surface hover:border-forest`} onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page">
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
        </li>
        {pageItems(page, pageCount).map((item, i) =>
          item === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={`${base} ${item === page ? 'bg-forest text-white' : 'border border-border bg-surface text-ink hover:border-forest'}`}
                onClick={() => onChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" className={`${base} border border-border bg-surface hover:border-forest`} onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="Next page">
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
