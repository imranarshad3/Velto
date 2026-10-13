import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { LoaderCircle } from 'lucide-react'
import QuoteStatus from '../../components/commerce/QuoteStatus.tsx'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import { productPath } from '../../data/catalog.ts'
import { adminApi } from '../../features/admin/api.ts'
import type { AdminQuoteDetail } from '../../features/admin/types.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { dateTimeFormat, formatItemQuantity } from '../../features/quotes/format.ts'
import { QuoteApiError } from '../../features/quotes/api.ts'
import { projectTypeLabels, quoteStatuses, quoteStatusLabels, type QuoteStatus as Status } from '../../features/quotes/schema.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'

function UpdateForm({ quote, onSaved }: { quote: AdminQuoteDetail; onSaved: () => void }) {
  const { getToken } = useAppAuth()
  const show = useToasts((s) => s.show)
  const [status, setStatus] = useState<Status>(quote.status)
  const [note, setNote] = useState('')
  const [internalNotes, setInternalNotes] = useState(quote.internalNotes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
      await adminApi.updateQuote(token, quote.reference, { status, note: note || undefined, internalNotes })
      setNote('')
      show(`${quote.reference} updated`)
      onSaved()
    } catch (err) {
      setError(err instanceof QuoteApiError ? err.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} aria-labelledby="update-title" className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-forest/30 bg-surface p-5">
      <h2 id="update-title" className="font-display text-[1.375rem]">
        Update request
      </h2>
      {error && (
        <p role="alert" className="rounded-lg bg-danger/5 p-3 text-[0.9375rem] font-semibold text-danger">
          {error}
        </p>
      )}
      <Field id="admin-status" label="Status" required>
        {(a) => (
          <select {...a} value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inputClass}>
            {quoteStatuses.map((s) => (
              <option key={s} value={s}>
                {quoteStatusLabels[s]}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field id="admin-note" label="Message to customer" hint="Shown in the customer’s quote history.">
        {(a) => <textarea {...a} value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className={`${inputClass} py-3`} />}
      </Field>
      <Field id="admin-internal" label="Internal notes" hint="Staff only. Never shown to customers.">
        {(a) => <textarea {...a} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={4} maxLength={5000} className={`${inputClass} py-3`} />}
      </Field>
      <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-forest px-6 font-semibold text-white hover:bg-forest-dark disabled:opacity-70">
        {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />} Save changes
      </button>
    </form>
  )
}

export default function AdminQuoteDetailPage() {
  const { reference = '' } = useParams()
  const { find } = useCatalog()
  const [state, reload] = useAuthedRemote(async (t) => (await adminApi.quote(t, reference)).quote, `admin-quote:${reference}`)

  return (
    <>
      <title>{`${reference} — Admin — NOVARO`}</title>
      <AdminHeading title={reference} crumbs={[{ label: 'Quotes', to: '/admin/quotes' }, { label: reference }]} />
      <RemoteState state={state} reload={reload} skeleton={3}>
        {(quote) => (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
            <div className="flex flex-col gap-5">
              <section aria-labelledby="customer-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="customer-title" className="font-display text-[1.375rem]">
                    Customer
                  </h2>
                  <Badge tone={quote.owner === 'account' ? 'soft' : 'sand'}>{quote.owner === 'account' ? 'Account' : 'Guest'}</Badge>
                </div>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Name', quote.fullName],
                    ['Company', quote.company ?? '—'],
                    ['Email', quote.email],
                    ['Phone', quote.phone],
                    ['Location', [quote.deliveryLocation, quote.city].filter(Boolean).join(', ')],
                    ['Project type', quote.projectType ? projectTypeLabels[quote.projectType as keyof typeof projectTypeLabels] : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">{k}</dt>
                      <dd className="break-words">
                        {k === 'Email' ? (
                          <a href={`mailto:${v}`} className="text-forest underline">
                            {v}
                          </a>
                        ) : k === 'Phone' ? (
                          <a href={`tel:${v}`} className="text-forest underline">
                            {v}
                          </a>
                        ) : (
                          v
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section aria-labelledby="admin-items-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <h2 id="admin-items-title" className="font-display text-[1.375rem]">
                  Products
                </h2>
                {quote.items.length ? (
                  <ul className="mt-2 divide-y divide-border">
                    {quote.items.map((item) => {
                      const p = find(item.productSlug)
                      return (
                        <li key={item.productSlug} className="flex flex-wrap justify-between gap-2 py-2.5">
                          {p ? (
                            <Link to={productPath(p)} className="font-semibold hover:text-forest hover:underline">
                              {p.name}
                            </Link>
                          ) : (
                            <span className="font-mono">{item.productSlug}</span>
                          )}
                          <span className="text-muted">{formatItemQuantity(item) ?? 'No quantity'}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-muted">General enquiry.</p>
                )}
              </section>
              <section aria-labelledby="admin-desc-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <h2 id="admin-desc-title" className="font-display text-[1.375rem]">
                  Project details
                </h2>
                <p className="mt-2 whitespace-pre-line">{quote.description}</p>
              </section>
            </div>
            <div className="flex flex-col gap-5">
              <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <QuoteStatus status={quote.status} />
              </div>
              <UpdateForm key={quote.updatedAt} quote={quote} onSaved={reload} />
              <section aria-labelledby="admin-history-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <h2 id="admin-history-title" className="font-display text-[1.375rem]">
                  History
                </h2>
                <ol className="mt-3 flex flex-col gap-3">
                  {[...quote.events].reverse().map((e, i) => (
                    <li key={i} className="text-[0.9375rem]">
                      <span className="font-semibold">{quoteStatusLabels[e.status]}</span> <span className="text-muted">· {e.actor}</span>
                      <span className="block text-[0.8125rem] text-muted">{dateTimeFormat.format(new Date(e.createdAt))}</span>
                      {e.note && <span className="mt-1 block rounded-lg bg-sand/70 p-2">{e.note}</span>}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        )}
      </RemoteState>
    </>
  )
}
