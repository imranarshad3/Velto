import { useEffect, useRef, useState } from 'react'
import { CircleCheck, Copy } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
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
    <div className="rounded-xl border border-border bg-canvas p-4">
      <p className="text-[0.75rem] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <code className="font-mono text-[1rem] font-bold break-all text-ink">{value}</code>
        <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[0.875rem] font-semibold hover:border-forest">
          <Copy aria-hidden="true" className="size-4" />
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
    <section aria-labelledby="quote-success-title" className="animate-rise rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(1.25rem,4vw,2.5rem)]">
      <CircleCheck aria-hidden="true" className="size-12 text-forest" />
      <h1 id="quote-success-title" ref={headingRef} tabIndex={-1} className="mt-4 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-tight focus:outline-none">
        Request received
      </h1>
      <p className="mt-2 max-w-[38rem] text-muted">
        Thank you. Our team will review your request and contact you using the details you provided.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <CopyValue label="Reference" value={result.reference} />
        {result.guestToken && (
          <>
            <CopyValue label="Tracking code" value={result.guestToken} />
            <p role="note" className="rounded-xl bg-sand/70 p-4 text-[0.875rem] text-ink">
              <strong>Save your tracking code now.</strong> It is shown only once and is needed, with your reference, to
              check this request’s status. Keep it private — anyone with both can see the request status.
            </p>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to={signedIn ? `/account/quotes/${result.reference}` : '/track'}>
          {signedIn ? 'View this request' : 'Track this request'}
        </ButtonLink>
        <ButtonLink to="/quote" variant="secondary">
          Submit another request
        </ButtonLink>
        <ButtonLink to="/products" variant="ghost">
          Browse products
        </ButtonLink>
      </div>
    </section>
  )
}
