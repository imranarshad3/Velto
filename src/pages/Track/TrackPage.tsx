import { useState } from 'react'
import { KeyRound, LifeBuoy, Package, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { FilterTabs } from '../Admin/ui.tsx'
import GuestLookup from './GuestLookup.tsx'
import OrderLookup from './OrderLookup.tsx'

const steps = [
  { icon: Package, title: 'Orders', text: 'Use the order reference (VEL-…) or tracking ID (VT…) with the email or phone used at checkout.', to: '/account/orders', link: 'My orders' },
  { icon: KeyRound, title: 'Quote requests', text: 'Both were shown on the confirmation screen when you submitted your request.' },
  { icon: UserRound, title: 'Signed in?', text: 'Orders and quote requests linked to your account update automatically there.', to: '/account', link: 'Open my account' },
  { icon: LifeBuoy, title: 'Need help?', text: 'Contact us with your reference and the email you used.', to: '/contact', link: 'Contact us' },
]

type Mode = 'order' | 'quote'

export default function TrackPage() {
  const [mode, setMode] = useState<Mode>('order')
  return (
    <>
      <title>Track an Order — VELTO</title>
      <PageHeader
        eyebrow="Order & request status"
        title="Track your order"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Track' }]}
        description="Follow your delivery step by step with your order reference or tracking ID. Quote requests can be checked here too."
      />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[var(--content-pad)] pb-[var(--section-gap)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-5">
          <FilterTabs<Mode> label="What do you want to track?" value={mode} onChange={setMode} options={[{ value: 'order', label: 'Order delivery' }, { value: 'quote', label: 'Quote request' }]} />
          {mode === 'order' ? <OrderLookup /> : <GuestLookup />}
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
