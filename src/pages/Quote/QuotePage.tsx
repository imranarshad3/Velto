import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import Img from '../../components/ui/Img.tsx'
import { brandStoryImage } from '../../data/images.ts'
import { useCart } from '../../features/cart/cartStore.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { useQuoteResult } from '../../features/quotes/resultStore.ts'
import type { SubmitQuoteResponse } from '../../features/quotes/schema.ts'
import { quantityUnits, type QuantityUnit } from '../../features/quotes/units.ts'
import QuoteForm, { type InitialItem } from './QuoteForm.tsx'
import QuoteSidebar from './QuoteSidebar.tsx'

export default function QuotePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { find } = useCatalog()
  const cartItems = useCart((s) => s.items)
  const removeFromCart = useCart((s) => s.remove)
  const setResult = useQuoteResult((s) => s.set)

  const fromCart = params.get('source') === 'cart'
  const requested = params.get('product')
  // Initial items are captured once; later cart changes don't reset what the user is editing.
  const [initialItems] = useState<InitialItem[]>(() => {
    if (fromCart) {
      return cartItems
        .filter((item) => find(item.slug))
        .map((item) => ({ productSlug: item.slug, quantity: item.quantity, quantityUnit: item.unit }))
    }
    if (!requested || !find(requested)) return []
    // Product cards pass the quantity chosen on the card; ignore anything out of range.
    const qty = Number(params.get('qty'))
    const unit = params.get('unit') as QuantityUnit
    return [Number.isInteger(qty) && qty >= 1 && qty <= 1_000_000 && quantityUnits.includes(unit) ? { productSlug: requested, quantity: qty, quantityUnit: unit } : { productSlug: requested }]
  })

  const onSuccess = (result: SubmitQuoteResponse, submittedSlugs: string[]) => {
    setResult(result)
    if (fromCart) submittedSlugs.forEach(removeFromCart)
    navigate('/quote/confirmation', { replace: true })
  }

  return (
    <>
      <title>Ask for Price — VELTO</title>
      <section aria-labelledby="quote-title" className="relative isolate overflow-hidden border-b border-border/70 bg-cream">
        <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 pt-2 pb-[clamp(2rem,4.5vw,3.5rem)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center lg:gap-14">
          <div className="min-w-0">
            <Breadcrumb items={[{ label: 'Home', to: '/' }, ...(fromCart ? [{ label: 'Cart', to: '/cart' }] : []), { label: 'Ask for Price' }]} />
            <p className="animate-rise mt-3 flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-copper uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-copper/60" />
              Ask for a price
            </p>
            <h1 id="quote-title" className="animate-rise mt-3 font-display text-[clamp(2.375rem,1.6rem+2.9vw,3.875rem)] leading-[1.02] tracking-[-0.015em] text-ink [--delay:0.05s]">
              Let’s build something stronger.
            </h1>
            <p className="animate-rise mt-4 max-w-[34rem] text-[clamp(0.9375rem,0.9rem+0.3vw,1.125rem)] leading-relaxed text-muted [--delay:0.1s]">
              Tell us about your project and the products you need. We’ll review your request and come back to you with
              pricing and availability.
            </p>
          </div>
          <div className="animate-rise relative hidden [--delay:0.15s] md:block">
            <div aria-hidden="true" className="absolute -inset-3 -z-10 rounded-[calc(var(--radius-panel)+0.75rem)] border border-sand-deep/80" />
            <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-panel)] shadow-[var(--shadow-float)]">
              <Img image={brandStoryImage} priority className="size-full object-cover" />
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgb(21_43_64/0.55),transparent_55%)]" />
              <p className="glass-dark absolute bottom-4 left-4 right-4 rounded-xl px-4 py-3 text-[0.875rem] font-semibold text-white lg:right-auto">
                One request · pricing and availability confirmed by our team
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-canvas">
        <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[var(--content-pad)] pb-[var(--section-gap)] lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start xl:gap-12">
          <QuoteForm
            initialItems={initialItems}
            unknownProduct={Boolean(requested && !find(requested))}
            onSuccess={onSuccess}
            aside={(slugs) => <QuoteSidebar products={slugs.map((slug) => find(slug)).filter((p) => p !== undefined)} />}
          />
        </div>
      </div>
    </>
  )
}
