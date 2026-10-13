import { ClipboardList } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { useQuoteResult } from '../../features/quotes/resultStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import QuoteSuccess from './QuoteSuccess.tsx'

/** Confirmation after submitting. The result lives in memory only, so a reload shows the generic state. */
export default function QuoteConfirmationPage() {
  const result = useQuoteResult((s) => s.result)
  const auth = useAppAuth()

  return (
    <div className="container-page py-[clamp(1rem,3vw,2rem)] pb-[var(--section-gap)]">
      <title>Quote Request Received — VELTO</title>
      <meta name="robots" content="noindex" />
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Request a Quote', to: '/quote' }, { label: 'Confirmation' }]} />
      <div className="mx-auto mt-4 max-w-[48rem]">
        {result ? (
          <QuoteSuccess result={result} signedIn={auth.signedIn} />
        ) : (
          <section aria-labelledby="no-result-title" className="surface-card rounded-[var(--radius-panel)] p-[clamp(1.5rem,4vw,2.75rem)] text-center [&_svg]:mx-auto [&>div]:justify-center">
            <ClipboardList aria-hidden="true" className="size-10 text-muted" />
            <h1 id="no-result-title" className="mt-4 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-tight">
              No recent request to show
            </h1>
            <p className="mt-2 text-muted">
              Confirmation details are shown once, right after you submit. If you already sent a request, track it with your
              reference and tracking code.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/track">Track a request</ButtonLink>
              <ButtonLink to="/quote" variant="secondary">
                Request a quote
              </ButtonLink>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
