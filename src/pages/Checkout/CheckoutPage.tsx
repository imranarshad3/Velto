import { CreditCard, FileCheck2, Lock, ShieldCheck } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { useCart } from '../../features/cart/cartStore.ts'

const requirements = [
  { icon: FileCheck2, title: 'Verified catalogue and prices', text: 'Product names, pack sizes and prices confirmed by the manufacturer and store.' },
  { icon: CreditCard, title: 'Payment provider', text: 'A payment gateway for your region, with server-verified payment confirmations.' },
  { icon: ShieldCheck, title: 'Server-side order checks', text: 'Totals, tax and delivery calculated on the server, never trusted from the browser.' },
]

/** Checkout is intentionally blocked until verified pricing and payments exist; no fake payment forms. */
export default function CheckoutPage() {
  const count = useCart((s) => s.items.length)

  return (
    <>
      <title>Checkout — NOVARO</title>
      <meta name="robots" content="noindex" />
      <PageHeader title="Checkout" crumbs={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <div className="container-page py-[clamp(2rem,4vw,3.5rem)] pb-[var(--section-gap)]">
        <section aria-labelledby="checkout-status-title" className="mx-auto max-w-[52rem] rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(1.25rem,4vw,2.5rem)]">
          <span className="grid size-14 place-items-center rounded-full bg-sand text-copper">
            <Lock aria-hidden="true" className="size-6" />
          </span>
          <h2 id="checkout-status-title" className="mt-4 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-tight">
            Online checkout isn’t available yet
          </h2>
          <p className="mt-2 text-muted">
            We don’t take online payments until prices are verified and payments can be processed securely. Until then, send your
            cart as a quote request and we’ll confirm pricing, availability and delivery directly.
          </p>
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {requirements.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl bg-sand/60 p-4">
                <Icon aria-hidden="true" className="size-6 text-forest" />
                <p className="mt-2 font-semibold">{title}</p>
                <p className="mt-1 text-[0.875rem] text-muted">{text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            {count > 0 ? (
              <ButtonLink to="/quote?source=cart">Request a quote for your cart ({count})</ButtonLink>
            ) : (
              <ButtonLink to="/products">Browse products</ButtonLink>
            )}
            <ButtonLink to="/cart" variant="secondary">
              Back to cart
            </ButtonLink>
          </div>
        </section>
      </div>
    </>
  )
}
