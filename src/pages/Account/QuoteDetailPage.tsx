import { Link, useParams } from 'react-router'
import { Building2, ImageOff, Mail, MapPin, Phone } from 'lucide-react'
import QuoteStatus from '../../components/commerce/QuoteStatus.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import { productPath } from '../../data/catalog.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { dateFormat, dateTimeFormat, formatItemQuantity } from '../../features/quotes/format.ts'
import { projectTypeLabels, quoteStatusLabels } from '../../features/quotes/schema.ts'
import { useMyQuote } from '../../features/quotes/useMyQuotes.ts'
import AccountHeading from './AccountHeading.tsx'
import RemoteState from './RemoteState.tsx'

export default function QuoteDetailPage() {
  const { reference = '' } = useParams()
  const [state, reload] = useMyQuote(reference)
  const { find } = useCatalog()

  if (state.kind === 'error' && state.status === 404) {
    return (
      <>
        <title>Quote not found — VELTO</title>
        <AccountHeading title="Quote not found" crumbs={[{ label: 'My Quotes', to: '/account/quotes' }, { label: 'Not found' }]}>
          We couldn’t find that request in your account.
        </AccountHeading>
        <ButtonLink to="/account/quotes">Back to my quotes</ButtonLink>
      </>
    )
  }

  return (
    <>
      <title>{`${reference} — My Quotes — VELTO`}</title>
      <AccountHeading title={reference} crumbs={[{ label: 'My Quotes', to: '/account/quotes' }, { label: reference }]} />
      <RemoteState state={state} reload={reload} skeleton={3}>
        {(quote) => (
          <div className="grid gap-[var(--grid-gap)] xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
            <div className="flex flex-col gap-5">
              <section aria-labelledby="status-title" className="surface-card p-5">
                <h2 id="status-title" className="mb-3 font-display text-[1.375rem]">
                  Status
                </h2>
                <QuoteStatus status={quote.status} />
                <p className="mt-3 text-[0.8125rem] text-muted">
                  Submitted {dateFormat.format(new Date(quote.createdAt))} · Last updated {dateFormat.format(new Date(quote.updatedAt))}
                </p>
              </section>

              <section aria-labelledby="items-title" className="surface-card p-5">
                <h2 id="items-title" className="font-display text-[1.375rem]">
                  Products
                </h2>
                {quote.items.length ? (
                  <ul className="mt-3 divide-y divide-border">
                    {quote.items.map((item) => {
                      const product = find(item.productSlug)
                      return (
                        <li key={item.productSlug} className="flex items-center gap-3 py-3">
                          <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-white p-1">
                            {product?.image ? <Img image={product.image} alt="" className="max-h-full w-auto object-contain" /> : <ImageOff aria-hidden="true" className="size-5 text-muted" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            {product ? (
                              <Link to={productPath(product)} className="font-semibold hover:text-forest hover:underline">
                                {product.name}
                              </Link>
                            ) : (
                              <span className="font-semibold text-muted">Product no longer listed</span>
                            )}
                          </div>
                          <span className="text-[0.9375rem] text-muted">{formatItemQuantity(item) ?? 'Quantity not specified'}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-muted">General enquiry (no products selected).</p>
                )}
              </section>

              <section aria-labelledby="project-title" className="surface-card p-5">
                <h2 id="project-title" className="font-display text-[1.375rem]">
                  Project
                </h2>
                <dl className="mt-3 grid gap-[var(--grid-gap)] sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">Type</dt>
                    <dd>{quote.projectType ? projectTypeLabels[quote.projectType as keyof typeof projectTypeLabels] : 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">Location</dt>
                    <dd>{[quote.deliveryLocation, quote.city].filter(Boolean).join(', ')}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">Details</p>
                <p className="mt-1 whitespace-pre-line">{quote.description}</p>
              </section>
            </div>

            <div className="flex flex-col gap-5">
              <section aria-labelledby="history-title" className="surface-card p-5">
                <h2 id="history-title" className="font-display text-[1.375rem]">
                  History
                </h2>
                <ol className="mt-3 flex flex-col gap-4 border-l-2 border-forest-soft pl-4">
                  {[...quote.events].reverse().map((event, i) => (
                    <li key={i} className="relative">
                      <span aria-hidden="true" className="absolute top-1.5 -left-[1.4375rem] size-3 rounded-full border-2 border-surface bg-forest" />
                      <p className="font-semibold">{quoteStatusLabels[event.status]}</p>
                      <p className="text-[0.8125rem] text-muted">
                        <time dateTime={event.createdAt}>{dateTimeFormat.format(new Date(event.createdAt))}</time>
                      </p>
                      {event.note && <p className="mt-1 rounded-lg bg-sand/70 p-2.5 text-[0.9375rem]">{event.note}</p>}
                    </li>
                  ))}
                </ol>
              </section>
              <section aria-labelledby="contact-title" className="surface-card p-5">
                <h2 id="contact-title" className="font-display text-[1.375rem]">
                  Your contact details
                </h2>
                <ul className="mt-3 flex flex-col gap-2 text-[0.9375rem] break-words">
                  <li className="font-semibold">{quote.fullName}</li>
                  {quote.company && (
                    <li className="flex gap-2">
                      <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" /> {quote.company}
                    </li>
                  )}
                  <li className="flex gap-2">
                    <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" /> <span className="min-w-0 break-all">{quote.email}</span>
                  </li>
                  <li className="flex gap-2">
                    <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" /> {quote.phone}
                  </li>
                  <li className="flex gap-2">
                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" /> {quote.city}
                  </li>
                </ul>
              </section>
            </div>
          </div>
        )}
      </RemoteState>
    </>
  )
}
