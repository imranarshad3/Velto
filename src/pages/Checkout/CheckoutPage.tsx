import { ArrowRight, ClipboardCheck, CreditCard, FileCheck2, Lock, MessagesSquare, Send, ShieldCheck } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { useCart } from '../../features/cart/cartStore.ts'

const requirements = [
  { icon: FileCheck2, title: 'Verified catalogue and prices', text: 'Product names, pack sizes and prices confirmed by the manufacturer and store.' },
  { icon: CreditCard, title: 'Payment provider', text: 'A payment gateway for your region, with server-verified payment confirmations.' },
  { icon: ShieldCheck, title: 'Server-side order checks', text: 'Totals, tax and delivery calculated on the server, never trusted from the browser.' },
]

const steps = [
  { icon: Send, title: 'Send your cart as a quote request', text: 'One request covers every product in your cart.' },
  { icon: MessagesSquare, title: 'We review it', text: 'Our team checks products, quantities and availability.' },
  { icon: ClipboardCheck, title: 'We confirm directly', text: 'Pricing, availability and delivery are confirmed with you.' },
]

/** Checkout is intentionally blocked until verified pricing and payments exist; no fake payment forms. */
export default function CheckoutPage() {
  const count = useCart((s) => s.items.length)

  return (
    <>
      <title>Checkout — VELTO</title>
      <meta name="robots" content="noindex" />
      <PageHeader eyebrow="Secure ordering" title="Checkout" crumbs={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <div className="bg-canvas">
        <div className="container-page py-[var(--content-pad)] pb-[var(--section-gap)]">
          <section
            aria-labelledby="checkout-status-title"
            className="mx-auto grid max-w-[64rem] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-float)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
          >
            <div className="p-[clamp(1.5rem,4vw,3rem)]">
              <span className="relative grid size-16 place-items-center rounded-full bg-cream ring-1 ring-sand-deep">
                <span className="grid size-11 place-items-center rounded-full bg-copper-soft text-copper">
                  <Lock aria-hidden="true" className="size-5" />
                </span>
              </span>
              <h2 id="checkout-status-title" className="mt-5 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.08]">
                Online checkout isn’t available yet
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                We don’t take online payments until prices are verified and payments can be processed securely. Until then, send your
                cart as a quote request and we’ll confirm pricing, availability and delivery directly.
              </p>

              <h3 className="mt-8 text-[0.75rem] font-bold tracking-[0.16em] text-muted uppercase">Checkout opens once we have</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {requirements.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4 rounded-[var(--radius-card)] border border-border bg-canvas/70 p-4">
                    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{title}</span>
                      <span className="mt-0.5 block text-[0.875rem] text-muted">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative isolate flex flex-col overflow-hidden bg-forest-deep p-[clamp(1.5rem,4vw,3rem)] text-white">
              <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
                <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
                Available now
              </p>
              <h3 className="mt-3 font-display text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] leading-tight">What happens instead</h3>
              <ol className="mt-6 flex flex-col gap-5">
                {steps.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className="flex gap-4">
                    <span aria-hidden="true" className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-gold ring-1 ring-white/15">
                      <Icon className="size-5" />
                      <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-gold text-[0.6875rem] font-bold text-forest-deep">{i + 1}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{title}</span>
                      <span className="mt-0.5 block text-[0.875rem] text-white/75">{text}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-auto flex flex-col gap-3 pt-8">
                {count > 0 ? (
                  <ButtonLink to="/quote?source=cart" variant="light" size="lg" className="w-full whitespace-normal text-center">
                    Request a quote for your cart ({count}) <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
                  </ButtonLink>
                ) : (
                  <ButtonLink to="/products" variant="light" size="lg" className="w-full">
                    Browse products <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
                  </ButtonLink>
                )}
                <ButtonLink to="/cart" variant="outline-light" className="w-full">
                  Back to cart
                </ButtonLink>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
