import { useEffect, useRef, useState } from 'react'
import { Check, Copy, ShieldAlert } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import type { SubmitQuoteResponse } from '../../features/quotes/schema.ts'

interface QuoteSuccessProps {
  result: SubmitQuoteResponse
  signedIn: boolean
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-sand-deep bg-cream/60 p-4 sm:p-5">
      <p className="text-[0.6875rem] font-bold tracking-[0.18em] text-muted uppercase">{label}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <code className="min-w-0 font-mono text-[clamp(1rem,0.95rem+0.4vw,1.25rem)] font-bold tracking-[0.04em] break-all text-ink">{value}</code>
        <button type="button" onClick={copy} className={buttonClass(copied ? 'ghost' : 'secondary', 'sm')}>
          {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
        </button>
      </div>
    </div>
  )
}

export default function QuoteSuccess({ result, signedIn }: QuoteSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="quote-success-title" className="animate-rise mx-auto max-w-[46rem] overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-float)]">
      <div className="relative isolate bg-forest-deep px-[clamp(1.25rem,4vw,2.5rem)] pt-[clamp(1.75rem,4vw,2.5rem)] pb-8 text-white">
        <span className="grid size-14 place-items-center rounded-full bg-gold text-forest-deep ring-8 ring-white/10">
          <Check aria-hidden="true" className="size-7" strokeWidth={2.5} />
        </span>
        <h1 id="quote-success-title" ref={headingRef} tabIndex={-1} className="mt-5 font-display text-[clamp(1.875rem,1.5rem+1.4vw,2.75rem)] leading-tight focus:outline-none">
          Request received
        </h1>
        <p className="mt-2 max-w-[38rem] text-white/75">
          Thank you. Our team will review your request and contact you using the details you provided.
        </p>
      </div>

      <div className="flex flex-col gap-3 p-[clamp(1.25rem,4vw,2.5rem)] pb-0">
        <CopyValue label="Reference" value={result.reference} />
        {result.guestToken && (
          <>
            <CopyValue label="Tracking code" value={result.guestToken} />
            <p role="note" className="flex gap-3 rounded-2xl border border-copper/25 bg-copper-soft p-4 text-[0.875rem] leading-relaxed text-ink">
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-copper" />
              <span>
              <strong>Save your tracking code now.</strong> It is shown only once and is needed, with your reference, to
              check the request status. Keep it private — anyone with both can see the status.
              </span>
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3 p-[clamp(1.25rem,4vw,2.5rem)]">
        <ButtonLink to={signedIn ? `/account/quotes/${result.reference}` : '/track'}>
          {signedIn ? 'View this request' : 'Track this request'}
        </ButtonLink>
        <ButtonLink to="/quote" variant="secondary">
          Submit another request
        </ButtonLink>
        <ButtonLink to="/products#product-results" variant="ghost">
          Browse products
        </ButtonLink>
      </div>
    </section>
  )
}
