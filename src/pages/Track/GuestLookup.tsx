import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import { lookupGuestQuote, QuoteApiError } from '../../features/quotes/api.ts'
import { guestStatusSchema, type QuoteSummary } from '../../features/quotes/schema.ts'
import { buttonClass } from '../../components/ui/button.ts'
import QuoteCard from '../Account/QuoteCard.tsx'

/** Guest tracking: needs the reference AND the one-time tracking code; nothing is stored in the URL. */
export default function GuestLookup() {
  const [reference, setReference] = useState('')
  const [token, setToken] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuoteSummary | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setResult(null)
    const parsed = guestStatusSchema.safeParse({ reference, token })
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
      return
    }
    setErrors({})
    setLoading(true)
    try {
      setResult((await lookupGuestQuote(parsed.data.reference, parsed.data.token)).quote)
    } catch (error) {
      setMessage(error instanceof QuoteApiError ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-labelledby="guest-lookup-title" className="surface-card rounded-[var(--radius-panel)] p-[clamp(1.25rem,3vw,2.25rem)] shadow-[var(--shadow-lift)]">
      <h2 id="guest-lookup-title" className="font-display text-[1.5rem]">
        Track a guest request
      </h2>
      <p className="mt-1 text-[0.875rem] text-muted">Use the reference and tracking code shown after you submitted.</p>
      <form noValidate onSubmit={onSubmit} className="mt-5 grid gap-[var(--grid-gap)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] md:items-start">
        <Field id="guest-reference" label="Reference" required error={errors.reference}>
          {(a) => <input {...a} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="NQ-…" autoComplete="off" spellCheck={false} className={inputClass} />}
        </Field>
        <Field id="guest-token" label="Tracking code" required error={errors.token}>
          {(a) => <input {...a} value={token} onChange={(e) => setToken(e.target.value)} type="password" autoComplete="off" spellCheck={false} className={inputClass} />}
        </Field>
        <button type="submit" disabled={loading} className={buttonClass('primary', 'md', 'md:mt-[1.8rem]')}>
          {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />} Check status
        </button>
      </form>
      <div aria-live="polite" className="mt-4">
        {message && <p className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-[0.9375rem] font-semibold text-danger">{message}</p>}
        {result && <QuoteCard quote={result} />}
      </div>
    </section>
  )
}
