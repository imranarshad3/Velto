import { Link } from 'react-router'
import { ArrowRight, ClipboardCheck, ImageOff, Info, Lock, MessagesSquare, Minus, Plus, Send, ShoppingBasket, Trash } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import Img from '../../components/ui/Img.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { buttonArrow, buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { productPath } from '../../data/catalog.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { useCart } from '../../features/cart/cartStore.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { cardPrice } from '../../features/catalog/price.ts'
import { checkoutAvailable } from '../../features/cart/checkout.ts'
import { quantityUnits, type QuantityUnit } from '../../features/quotes/schema.ts'

const categoryName = new Map(demoCategories.map((c) => [c.slug, c.name]))

const MAX_QTY = 1_000_000

const steps = [
  { icon: Send, title: 'Send one request', text: 'Your whole basket goes to our team as a single quote request.' },
  { icon: MessagesSquare, title: 'We review it', text: 'We check suitability, pack sizes and availability for your project.' },
  { icon: ClipboardCheck, title: 'Receive your quote', text: 'Pricing and delivery are confirmed with you directly.' },
]

const stepperButton =
  'grid size-11 shrink-0 place-items-center text-ink transition-colors duration-200 hover:bg-forest-soft hover:text-forest disabled:pointer-events-none disabled:text-muted/40 focus-visible:relative focus-visible:z-10'

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
  const withQuantity = available.filter((l) => l.item.quantity).length

  const setQuantity = (slug: string, value: number | undefined) =>
    update(slug, { quantity: value !== undefined && Number.isFinite(value) && value > 0 ? Math.min(value, MAX_QTY) : undefined })

  return (
    <>
      <title>Cart — VELTO</title>
      <PageHeader
        eyebrow="Quote basket"
        title="Your Cart"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Cart' }]}
        description="Collect the products you need, then send them as one quote request. Pricing and availability are confirmed in your quote."
      />
      <div className="bg-canvas">
        <div className="container-page py-[var(--content-pad)] pb-[var(--section-gap)]">
          {items.length === 0 ? (
            <EmptyState
              icon={ShoppingBasket}
              title="Your cart is empty"
              actions={
                <>
                  <ButtonLink to="/products">
                    Browse products <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
                  </ButtonLink>
                  <ButtonLink to="/wishlist" variant="secondary">
                    View wishlist
                  </ButtonLink>
                </>
              }
            >
              Add products from the catalogue to request one combined quote.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start xl:gap-12">
              <section aria-labelledby="cart-items-title" className="min-w-0">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-[0.75rem] font-bold tracking-[0.18em] text-copper uppercase">In your basket</p>
                    <h2 id="cart-items-title" className="mt-1 font-display text-[clamp(1.5rem,1.3rem+0.7vw,1.875rem)] leading-tight">
                      {items.length} {items.length === 1 ? 'product' : 'products'}
                    </h2>
                  </div>
                  <button type="button" onClick={clear} className={buttonClass('ghost', 'sm', 'text-muted hover:bg-danger-soft hover:text-danger')}>
                    <Trash aria-hidden="true" className="size-4" /> Clear cart
                  </button>
                </div>

                {unavailable.length > 0 && (
                  <div role="note" className="mt-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-copper/25 bg-copper-soft/60 p-4 text-[0.9375rem]">
                    <Info aria-hidden="true" className="size-5 shrink-0 text-copper" />
                    <p className="min-w-0 flex-1">
                      {unavailable.length === 1 ? 'One product is' : `${unavailable.length} products are`} no longer listed and will not be included.
                    </p>
                    <button type="button" onClick={() => unavailable.forEach((l) => remove(l.item.slug))} className={buttonClass('secondary', 'sm')}>
                      Remove
                    </button>
                  </div>
                )}

                <ul className="mt-5 flex flex-col gap-4">
                  {available.map(({ item, product }) => {
                    const p = product!
                    const id = `cart-${p.slug}`
                    const price = cardPrice(p)
                    const qty = item.quantity
                    return (
                      <li
                        key={p.slug}
                        className="group grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-5 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-300 ease-[var(--ease-premium)] hover:border-forest/25 hover:shadow-[var(--shadow-card)] sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-5 xl:grid-cols-[7rem_minmax(0,1fr)_auto] xl:items-center"
                      >
                        <Link
                          to={productPath(p)}
                          tabIndex={-1}
                          aria-hidden="true"
                          className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_35%,var(--color-surface),var(--color-cream)_75%)] p-2 ring-1 ring-border ring-inset"
                        >
                          {p.image ? (
                            <Img image={p.image} alt="" className="max-h-full w-auto object-contain transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                          ) : (
                            <ImageOff aria-hidden="true" className="size-6 text-muted/70" />
                          )}
                        </Link>
                        <div className="min-w-0 self-center">
                          <p className="text-[0.6875rem] font-bold tracking-[0.14em] text-copper uppercase">{categoryName.get(p.categorySlug)}</p>
                          <Link to={productPath(p)} className="mt-1 block font-display text-[clamp(1.125rem,1.05rem+0.3vw,1.3125rem)] leading-snug text-ink transition-colors hover:text-forest">
                            {p.name}
                          </Link>
                          <p className="mt-0.5 text-[0.875rem] text-muted">{p.usage}</p>
                          {price ? (
                            <p className="mt-2 flex flex-wrap items-center gap-2 text-[0.875rem]">
                              <span className="font-bold text-ink tabular-nums">{price.label}</span>
                              {price.demo && (
                                <span className="rounded-full bg-copper-soft px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.08em] text-copper-hover uppercase">DEMO price</span>
                              )}
                              <span className="text-[0.8125rem] text-muted">Final pricing in your quote</span>
                            </p>
                          ) : (
                            <p className="mt-2 text-[0.8125rem] font-semibold text-muted">Pricing on request</p>
                          )}
                        </div>

                        <div className="col-span-2 flex flex-wrap items-end gap-3 border-t border-border pt-4 xl:col-span-1 xl:flex-nowrap xl:border-0 xl:pt-0">
                          <div className="flex min-w-0 flex-col gap-1.5">
                            <label htmlFor={`${id}-qty`} className="text-[0.75rem] font-semibold text-muted">
                              Quantity <span className="font-normal">(optional)</span>
                            </label>
                            <div className="flex h-12 items-center overflow-hidden rounded-xl border border-border bg-surface shadow-[inset_0_0.0625rem_0.125rem_rgb(32_44_54/0.04)] focus-within:border-forest">
                              <button type="button" onClick={() => setQuantity(p.slug, qty && qty > 1 ? Math.ceil(qty) - 1 : undefined)} disabled={!qty} className={stepperButton} aria-label={`Decrease quantity of ${p.name}`}>
                                <Minus aria-hidden="true" className="size-4" />
                              </button>
                              <input
                                id={`${id}-qty`}
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                placeholder="–"
                                value={qty ?? ''}
                                onChange={(e) => setQuantity(p.slug, e.target.valueAsNumber)}
                                className="h-full w-[4.5rem] [appearance:textfield] border-x border-border bg-transparent text-center text-[1rem] font-semibold text-ink tabular-nums placeholder:text-muted/60 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <button type="button" onClick={() => setQuantity(p.slug, Math.floor(qty ?? 0) + 1)} disabled={(qty ?? 0) >= MAX_QTY} className={stepperButton} aria-label={`Increase quantity of ${p.name}`}>
                                <Plus aria-hidden="true" className="size-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5 xl:flex-none">
                            <label htmlFor={`${id}-unit`} className="text-[0.75rem] font-semibold text-muted">
                              Unit
                            </label>
                            <select
                              id={`${id}-unit`}
                              value={item.unit ?? ''}
                              onChange={(e) => update(p.slug, { unit: (e.target.value || undefined) as QuantityUnit | undefined })}
                              className={`${inputClass} min-w-[7rem] xl:w-[8rem]`}
                            >
                              <option value="">Unit</option>
                              {quantityUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u[0].toUpperCase() + u.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(p.slug)}
                            className="grid size-12 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                            aria-label={`Remove ${p.name} from cart`}
                          >
                            <Trash aria-hidden="true" className="size-[1.125rem]" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                <p className="mt-5 flex items-start gap-2 text-[0.8125rem] text-muted">
                  <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>DEMO prices are illustrative catalogue figures for review only. Your quote confirms real pricing, pack sizes and availability.</span>
                </p>
              </section>

              <aside aria-labelledby="cart-summary-title" className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
                <section className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-float)]">
                  <div className="relative isolate overflow-hidden bg-forest-deep px-6 py-6 text-white">
                    <p className="text-[0.6875rem] font-bold tracking-[0.2em] text-gold uppercase">Quote-based ordering</p>
                    <h2 id="cart-summary-title" className="mt-1.5 font-display text-[1.75rem] leading-tight">
                      Summary
                    </h2>
                    <dl className="mt-5 grid grid-cols-2 gap-[var(--grid-gap)]">
                      <div className="rounded-xl bg-white/8 p-3 ring-1 ring-white/10">
                        <dt className="text-[0.75rem] text-white/70">Products</dt>
                        <dd className="mt-0.5 font-display text-[1.75rem] leading-none tabular-nums">{available.length}</dd>
                      </div>
                      <div className="rounded-xl bg-white/8 p-3 ring-1 ring-white/10">
                        <dt className="text-[0.75rem] text-white/70">With quantities</dt>
                        <dd className="mt-0.5 font-display text-[1.75rem] leading-none tabular-nums">{withQuantity}</dd>
                      </div>
                      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-white/12 pt-3 text-[0.9375rem]">
                        <dt className="text-white/70">Pricing</dt>
                        <dd className="font-semibold">On request</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="p-6">
                    <ButtonLink to="/quote?source=cart" size="lg" className="w-full whitespace-normal text-center">
                      Ask for a price for these items <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
                    </ButtonLink>
                    {canCheckout ? (
                      <ButtonLink to="/checkout" variant="secondary" className="mt-3 w-full">
                        Checkout
                      </ButtonLink>
                    ) : (
                      <p className="mt-4 flex gap-2.5 rounded-xl bg-canvas p-3 text-[0.8125rem] leading-relaxed text-muted">
                        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-forest" />
                        <span>
                          Online checkout opens once verified prices and secure payments are available.{' '}
                          <Link to="/checkout" className="font-semibold text-forest underline underline-offset-2">
                            Learn more
                          </Link>
                        </span>
                      </p>
                    )}

                    <h3 className="mt-6 text-[0.75rem] font-bold tracking-[0.16em] text-muted uppercase">How it works</h3>
                    <ol className="mt-3 flex flex-col gap-3.5">
                      {steps.map(({ icon: Icon, title, text }) => (
                        <li key={title} className="flex gap-3">
                          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[0.9375rem] font-semibold text-ink">{title}</span>
                            <span className="block text-[0.8125rem] text-muted">{text}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>
                <p className="px-1 text-[0.8125rem] text-muted">Your cart is saved in this browser.</p>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
