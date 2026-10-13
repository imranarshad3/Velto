import { Link } from 'react-router'
import { ArrowRight, ImageOff, Info, Lock, ShoppingBasket, Trash } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import Img from '../../components/ui/Img.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { productPath } from '../../data/catalog.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { useCart } from '../../features/cart/cartStore.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { checkoutAvailable } from '../../features/cart/checkout.ts'
import { quantityUnits, type QuantityUnit } from '../../features/quotes/schema.ts'

const categoryName = new Map(demoCategories.map((c) => [c.slug, c.name]))

export default function CartPage() {
  const { find } = useCatalog()
  const items = useCart((s) => s.items)
  const update = useCart((s) => s.update)
  const remove = useCart((s) => s.remove)
  const clear = useCart((s) => s.clear)

  const lines = items.map((item) => ({ item, product: find(item.slug) }))
  const available = lines.filter((l) => l.product)
  const unavailable = lines.filter((l) => !l.product)
  const canCheckout = checkoutAvailable(available.map((l) => l.product!))

  return (
    <>
      <title>Cart — NOVARO</title>
      <PageHeader
        title="Your Cart"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Cart' }]}
        description="Collect the products you need, then send them as one quote request. Pricing and availability are confirmed in your quote."
      />
      <div className="container-page py-[clamp(2rem,4vw,3.5rem)] pb-[var(--section-gap)]">
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="Your cart is empty"
            actions={
              <>
                <ButtonLink to="/products">Browse products</ButtonLink>
                <ButtonLink to="/wishlist" variant="secondary">
                  View wishlist
                </ButtonLink>
              </>
            }
          >
            Add products from the catalogue to request one combined quote.
          </EmptyState>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:gap-10">
            <section aria-labelledby="cart-items-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="cart-items-title" className="font-display text-[1.5rem]">
                  {items.length} {items.length === 1 ? 'product' : 'products'}
                </h2>
                <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-[0.875rem] font-semibold text-muted hover:text-danger">
                  <Trash aria-hidden="true" className="size-4" /> Clear cart
                </button>
              </div>

              {unavailable.length > 0 && (
                <div role="note" className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-sand/60 p-4 text-[0.9375rem]">
                  <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-copper" />
                  <p className="flex-1">
                    {unavailable.length === 1 ? 'One product is' : `${unavailable.length} products are`} no longer listed and will not be included.
                  </p>
                  <button type="button" onClick={() => unavailable.forEach((l) => remove(l.item.slug))} className="min-h-11 shrink-0 font-semibold text-forest underline">
                    Remove
                  </button>
                </div>
              )}

              <ul className="mt-4 flex flex-col gap-3">
                {available.map(({ item, product }) => {
                  const p = product!
                  const id = `cart-${p.slug}`
                  return (
                    <li key={p.slug} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center">
                      <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-border bg-white p-1.5">
                        {p.image ? <Img image={p.image} alt="" className="max-h-full w-auto object-contain" /> : <ImageOff aria-hidden="true" className="size-6 text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[0.75rem] font-semibold text-copper">{categoryName.get(p.categorySlug)}</p>
                        <Link to={productPath(p)} className="font-bold text-ink hover:text-forest hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-[0.875rem] text-muted">{p.usage}</p>
                        <p className="mt-1 text-[0.8125rem] font-semibold text-muted">Pricing on request</p>
                      </div>
                      <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2 sm:col-span-1 sm:flex sm:justify-end">
                        <div className="flex min-w-0 flex-col gap-1">
                          <label htmlFor={`${id}-qty`} className="text-[0.75rem] font-semibold text-muted">
                            Quantity <span className="font-normal">(optional)</span>
                          </label>
                          <input
                            id={`${id}-qty`}
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            value={item.quantity ?? ''}
                            onChange={(e) => {
                              const value = e.target.valueAsNumber
                              update(p.slug, { quantity: Number.isFinite(value) && value > 0 ? Math.min(value, 1_000_000) : undefined })
                            }}
                            className={`${inputClass} sm:w-[6.5rem]`}
                          />
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <label htmlFor={`${id}-unit`} className="text-[0.75rem] font-semibold text-muted">
                            Unit
                          </label>
                          <select
                            id={`${id}-unit`}
                            value={item.unit ?? ''}
                            onChange={(e) => update(p.slug, { unit: (e.target.value || undefined) as QuantityUnit | undefined })}
                            className={`${inputClass} sm:w-[7.5rem]`}
                          >
                            <option value="">Unit</option>
                            {quantityUnits.map((u) => (
                              <option key={u} value={u}>
                                {u[0].toUpperCase() + u.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button type="button" onClick={() => remove(p.slug)} className="grid size-12 place-items-center rounded-lg text-muted hover:bg-sand hover:text-danger" aria-label={`Remove ${p.name} from cart`}>
                          <Trash aria-hidden="true" className="size-[1.125rem]" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <aside aria-labelledby="cart-summary-title" className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
              <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <h2 id="cart-summary-title" className="font-display text-[1.5rem]">
                  Summary
                </h2>
                <dl className="mt-4 flex flex-col gap-2 border-y border-border py-4 text-[0.9375rem]">
                  <div className="flex justify-between">
                    <dt className="text-muted">Products</dt>
                    <dd className="font-semibold">{available.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Pricing</dt>
                    <dd className="font-semibold">On request</dd>
                  </div>
                </dl>
                <ButtonLink to="/quote?source=cart" className="mt-5 w-full">
                  Request a quote for these items <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
                {canCheckout ? (
                  <ButtonLink to="/checkout" variant="secondary" className="mt-3 w-full">
                    Checkout
                  </ButtonLink>
                ) : (
                  <p className="mt-4 flex gap-2 text-[0.8125rem] text-muted">
                    <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Online checkout opens once verified prices and secure payments are available.{' '}
                      <Link to="/checkout" className="font-semibold text-forest underline">
                        Learn more
                      </Link>
                    </span>
                  </p>
                )}
              </section>
              <p className="px-1 text-[0.8125rem] text-muted">Your cart is saved in this browser.</p>
            </aside>
          </div>
        )}
      </div>
    </>
  )
}
