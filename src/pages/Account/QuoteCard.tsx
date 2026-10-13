import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import QuoteStatus from '../../components/commerce/QuoteStatus.tsx'
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
  const meta = [quote.projectType && projectTypeLabels[quote.projectType as keyof typeof projectTypeLabels], quote.city].filter(Boolean)
  const extra = quote.items.length - VISIBLE_ITEMS

  return (
    <article aria-labelledby={`quote-${quote.reference}`} className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 transition-shadow hover:shadow-[var(--shadow-card)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
      <div className="min-w-0">
        <h3 id={`quote-${quote.reference}`} className="font-mono text-[0.9375rem] font-bold text-ink">
          {quote.reference}
        </h3>
        {quote.items.length ? (
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {quote.items.slice(0, VISIBLE_ITEMS).map((item) => {
              const product = find(item.productSlug)
              const qty = formatItemQuantity(item)
              return (
                <li key={item.productSlug} className="text-[0.9375rem]">
                  {product ? (
                    <Link to={productPath(product)} className="font-semibold text-ink hover:text-forest hover:underline">
                      {product.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-muted">Product no longer listed</span>
                  )}
                  {qty && <span className="text-muted"> · {qty}</span>}
                </li>
              )
            })}
            {extra > 0 && <li className="text-[0.875rem] text-muted">+{extra} more</li>}
          </ul>
        ) : (
          <p className="mt-1 font-semibold text-ink">General enquiry</p>
        )}
        <p className="mt-1 text-[0.875rem] text-muted">{meta.join(' · ')}</p>
        <p className="mt-1 text-[0.8125rem] text-muted">
          Submitted <time dateTime={quote.createdAt}>{dateFormat.format(new Date(quote.createdAt))}</time>
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <QuoteStatus status={quote.status} />
        {detailsHref && (
          <Link to={detailsHref} className="inline-flex min-h-11 w-fit items-center gap-1.5 text-[0.875rem] font-semibold text-forest hover:underline">
            View details<span className="sr-only"> for {quote.reference}</span> <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </article>
  )
}
