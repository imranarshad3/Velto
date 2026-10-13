import { KeyRound, LifeBuoy, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import PageHeader from '../../components/ui/PageHeader.tsx'
import GuestLookup from './GuestLookup.tsx'

const steps = [
  { icon: KeyRound, title: 'Reference + tracking code', text: 'Both were shown on the confirmation screen when you submitted your request.' },
  { icon: UserRound, title: 'Signed in?', text: 'Every request linked to your account is listed in My quotes.', to: '/account/quotes', link: 'Open My quotes' },
  { icon: LifeBuoy, title: 'Lost your code?', text: 'Contact us with your reference and the email you used.', to: '/contact', link: 'Contact us' },
]

export default function TrackPage() {
  return (
    <>
      <title>Track a Request — VELTO</title>
      <PageHeader
        eyebrow="Request status"
        title="Track a request"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Track a Request' }]}
        description="Guest requests can be checked with the reference and tracking code shown when you submitted. Signed-in customers can see every request in My quotes."
      />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[var(--content-pad)] pb-[var(--section-gap)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <div className="min-w-0">
          <GuestLookup />
        </div>
        <aside aria-label="How tracking works" className="h-fit rounded-[var(--radius-panel)] border border-border bg-cream/70 p-6">
          <h2 className="font-display text-[1.375rem]">How it works</h2>
          <ol className="mt-5 flex flex-col gap-5">
            {steps.map(({ icon: Icon, title, text, to, link }) => (
              <li key={title} className="flex gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface text-forest ring-1 ring-border">
                  <Icon aria-hidden="true" className="size-[1.125rem]" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-ink">{title}</p>
                  <p className="mt-0.5 text-[0.875rem] leading-relaxed text-muted">{text}</p>
                  {to && (
                    <Link to={to} className="mt-1 inline-flex min-h-11 items-center text-[0.875rem] font-semibold text-forest underline-offset-4 hover:underline">
                      {link} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  )
}
