import { Link } from 'react-router'
import { CalendarDays, FileText, MapPin, Package } from 'lucide-react'
import QuoteStatus from '../../components/commerce/QuoteStatus.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { productPath } from '../../data/catalog.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { dateFormat, formatItemQuantity } from '../../features/quotes/format.ts'
import { projectTypeLabels, type QuoteSummary } from '../../features/quotes/schema.ts'

const VISIBLE_ITEMS = 3

interface QuoteCardProps {
  quote: QuoteSummary
  /** Link to the full request (account quotes only). */
  detailsHref?: string
}

export default function QuoteCard({ quote, detailsHref }: QuoteCardProps) {
  const { find } = useCatalog()
  const projectType = quote.projectType && projectTypeLabels[quote.projectType as keyof typeof projectTypeLabels]
  const extra = quote.items.length - VISIBLE_ITEMS

  return (
    <article
      aria-labelledby={`quote-${quote.reference}`}
      className={`group/card relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-soft)] transition-[box-shadow,transform,border-color] duration-300 ease-[var(--ease-premium)] ${detailsHref ? 'hover:-translate-y-0.5 hover:border-forest/25 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0' : ''}`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${quote.status === 'quoted' ? 'bg-forest' : quote.status === 'closed' ? 'bg-border' : 'bg-copper/70'}`} />

      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/70 bg-[linear-gradient(90deg,var(--color-cream),var(--color-surface))] py-3 pr-5 pl-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
            <FileText aria-hidden="true" className="size-[1.125rem]" />
          </span>
          <h3 id={`quote-${quote.reference}`} className="min-w-0 font-mono text-[0.9375rem] font-bold tracking-[0.02em] break-all text-ink">
            {quote.reference}
          </h3>
        </div>
        <p className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
          <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
          Submitted <time dateTime={quote.createdAt}>{dateFormat.format(new Date(quote.createdAt))}</time>
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] py-5 pr-5 pl-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-8">
        <div className="min-w-0">
          {quote.items.length ? (
            <ul className="flex flex-col gap-1.5">
              {quote.items.slice(0, VISIBLE_ITEMS).map((item) => {
                const product = find(item.productSlug)
                const qty = formatItemQuantity(item)
                return (
                  <li key={item.productSlug} className="flex min-w-0 items-baseline gap-2 text-[0.9375rem]">
                    <span aria-hidden="true" className="size-1.5 shrink-0 translate-y-[-0.125rem] rounded-full bg-gold" />
                    <span className="min-w-0">
                      {product ? (
                        <Link to={productPath(product)} className="font-semibold text-ink underline-offset-4 hover:text-forest hover:underline">
                          {product.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-muted">Product no longer listed</span>
                      )}
                      {qty && <span className="text-muted tabular-nums"> · {qty}</span>}
                    </span>
                  </li>
                )
              })}
              {extra > 0 && <li className="pl-3.5 text-[0.875rem] font-medium text-forest">+{extra} more</li>}
            </ul>
          ) : (
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Package aria-hidden="true" className="size-4 text-muted" /> General enquiry
            </p>
          )}
          {(projectType || quote.city) && (
            <ul aria-label="Project" className="mt-3 flex flex-wrap gap-2">
              {projectType && <li className="rounded-full bg-sand px-2.5 py-1 text-[0.75rem] font-semibold text-ink">{projectType}</li>}
              {quote.city && (
                <li className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[0.75rem] font-medium text-muted">
                  <MapPin aria-hidden="true" className="size-3" /> {quote.city}
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:border-l md:border-border/70 md:pl-8">
          <QuoteStatus status={quote.status} />
          {detailsHref && (
            <Link to={detailsHref} className={buttonClass('secondary', 'sm', 'w-fit')}>
              View details<span className="sr-only"> for {quote.reference}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
