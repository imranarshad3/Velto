import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import Img from '../../components/ui/Img.tsx'
import { brandStoryImage } from '../../data/images.ts'
import { useCart } from '../../features/cart/cartStore.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { useQuoteResult } from '../../features/quotes/resultStore.ts'
import type { SubmitQuoteResponse } from '../../features/quotes/schema.ts'
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
    return requested && find(requested) ? [{ productSlug: requested }] : []
  })

  const onSuccess = (result: SubmitQuoteResponse, submittedSlugs: string[]) => {
    setResult(result)
    if (fromCart) submittedSlugs.forEach(removeFromCart)
    navigate('/quote/confirmation', { replace: true })
  }

  return (
    <>
      <title>Request a Quote — NOVARO</title>
      <section aria-labelledby="quote-title" className="bg-[#f6f1e9]">
        <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 pt-2 pb-[clamp(2rem,4vw,3rem)] md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-center">
          <div>
            <Breadcrumb items={[{ label: 'Home', to: '/' }, ...(fromCart ? [{ label: 'Cart', to: '/cart' }] : []), { label: 'Request a Quote' }]} />
            <p className="mt-2 text-[0.75rem] font-semibold tracking-[0.16em] text-copper uppercase">Request a quote</p>
            <h1 id="quote-title" className="animate-rise mt-2 font-display text-[clamp(2.25rem,1.5rem+3vw,3.75rem)] leading-[1.04] text-ink">
              Let’s build something stronger.
            </h1>
            <p className="animate-rise mt-4 max-w-[34rem] text-[clamp(0.9375rem,0.9rem+0.25vw,1.0625rem)] text-muted">
              Tell us about your project and the products you need. We’ll review your request and come back to you with
              pricing and availability.
            </p>
          </div>
          <div className="relative hidden aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] md:block">
            <Img image={brandStoryImage} priority className="size-full object-cover" />
          </div>
        </div>
      </section>

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:gap-10">
        <QuoteForm
          initialItems={initialItems}
          unknownProduct={Boolean(requested && !find(requested))}
          onSuccess={onSuccess}
          aside={(slugs) => <QuoteSidebar products={slugs.map((slug) => find(slug)).filter((p) => p !== undefined)} />}
        />
      </div>
    </>
  )
}
