import { useId, useState } from 'react'
import { ArrowRight, Check, Minus, Plus, ShoppingBasket } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow, buttonClass } from '../../components/ui/button.ts'
import type { CatalogProduct } from '../../data/catalog.ts'
import { MAX_CART_ITEMS, useCart } from '../../features/cart/cartStore.ts'
import { cardPrice } from '../../features/catalog/price.ts'
import { useToasts } from '../../features/ui/toastStore.ts'

const MIN_QTY = 1
const MAX_QTY = 9999
const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(MIN_QTY, Math.round(n)))

const fieldLabel = 'text-[0.6875rem] font-bold tracking-[0.14em] text-muted uppercase'
const stepButton =
  'grid size-11 shrink-0 place-items-center rounded-lg text-ink transition-colors hover:bg-forest-soft hover:text-forest disabled:pointer-events-none disabled:opacity-35'

/** Price, quantity and cart/quote actions. Adds to the existing quote basket with the chosen quantity and unit. */
export default function BuyBox({ product }: { product: CatalogProduct; quoteHref: string }) {
  const id = useId()
  const price = cardPrice(product)
  const cartItem = useCart((s) => s.items.find((i) => i.slug === product.slug))
  const show = useToasts((s) => s.show)
  const [quantity, setQuantity] = useState<number>(() => cartItem?.quantity ? clampQty(cartItem.quantity) : MIN_QTY)
  const [draft, setDraft] = useState(String(quantity))
  const unit = 'units' as const

  const setQty = (n: number) => {
    const next = clampQty(n)
    setQuantity(next)
    setDraft(String(next))
  }

  const addToCart = () => {
    const { add, update } = useCart.getState()
    const result = add(product.slug)
    if (result === 'full') {
      show(`Your cart holds up to ${MAX_CART_ITEMS} products. Complete your current cart first.`, { label: 'View cart', to: '/cart' })
      return
    }
    update(product.slug, { quantity, unit })
    show(
      result === 'added'
        ? `${product.name} added to your cart`
        : `${product.name} is already in your cart. Quantity updated to ${quantity} ${unit}.`,
      { label: 'View cart', to: '/cart' },
    )
  }

  const inCart = Boolean(cartItem)
  const CartIcon = inCart ? Check : ShoppingBasket

  return (
    <div className="@container relative overflow-hidden rounded-[var(--radius-panel)] border border-forest/15 bg-surface shadow-[var(--shadow-soft)]">

      <div className="flex flex-col gap-3 border-b border-border px-[clamp(1.125rem,2.5vw,1.75rem)] pt-[clamp(1.125rem,2.5vw,1.5rem)] pb-5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.12em] text-muted uppercase">
            Price
            {price?.demo && <span className="rounded-sm bg-sand px-1 py-0.5 text-[0.625rem] font-bold tracking-[0.08em] text-copper">DEMO</span>}
          </p>
          <p className="mt-1 font-extrabold leading-none text-ink tabular-nums">
            {price ? (
              <span className="text-[clamp(1.875rem,1.5rem+1.4vw,2.5rem)] tracking-[-0.01em]">
                {price.label}
                {price.demo && <span className="sr-only"> (illustrative demo price)</span>}
              </span>
            ) : (
              <span className="text-[clamp(1.375rem,1.2rem+0.8vw,1.75rem)]">Pricing on request</span>
            )}
          </p>
        </div>
        <p className="max-w-[32rem] text-[0.8125rem] leading-relaxed text-muted">
          {price?.demo
            ? 'Illustrative DEMO price only. Confirmed pricing and availability are provided with your quote.'
            : price
              ? 'Delivery is Rs. 300 per order. Pay with Cash on Delivery.'
              : 'Ask for a price for pricing, pack options and availability.'}
        </p>
      </div>

      <div className="flex flex-col gap-5 p-[clamp(1.125rem,2.5vw,1.75rem)]">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @[24rem]:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-qty`} className={fieldLabel}>
              Quantity
            </label>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-canvas p-0.5 focus-within:border-forest">
              <button type="button" className={stepButton} onClick={() => setQty(quantity - 1)} disabled={quantity <= MIN_QTY} aria-label="Decrease quantity">
                <Minus aria-hidden="true" className="size-4" />
              </button>
              <input
                id={`${id}-qty`}
                type="number"
                inputMode="numeric"
                min={MIN_QTY}
                max={MAX_QTY}
                step={1}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  const n = e.target.valueAsNumber
                  if (Number.isFinite(n) && n >= MIN_QTY) setQuantity(clampQty(n))
                }}
                onBlur={() => setQty(Number(draft) || MIN_QTY)}
                className="min-h-11 w-full min-w-[3.5rem] flex-1 bg-transparent text-center text-[1.0625rem] font-bold text-ink tabular-nums focus-visible:outline focus-visible:outline-forest @[24rem]:w-[4.5rem] @[24rem]:flex-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
              />
              <button type="button" className={stepButton} onClick={() => setQty(quantity + 1)} disabled={quantity >= MAX_QTY} aria-label="Increase quantity">
                <Plus aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 @[28rem]:grid-cols-2">
          <ButtonLink to={`/checkout?product=${product.slug}&qty=${quantity}`} size="lg" className="w-full px-5">
            Buy now<span className="sr-only"> for {quantity} {unit}</span> <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
          </ButtonLink>
          <button type="button" onClick={addToCart} className={buttonClass('secondary', 'lg', 'w-full px-5')}>
            <CartIcon aria-hidden="true" className="size-[1.125rem]" />
            {inCart ? 'Update cart' : 'Add to cart'}
          </button>
        </div>

        <p role="status" className="-mt-1 text-[0.8125rem] text-muted">
          {cartItem ? (
            <span className="inline-flex items-center gap-1.5 text-forest">
              <Check aria-hidden="true" className="size-3.5" />
              In your cart
              {cartItem.quantity ? ` · ${cartItem.quantity} ${cartItem.unit ?? ''}`.trimEnd() : ''}
            </span>
          ) : (
            'You can adjust quantities and units any time in your cart.'
          )}
        </p>
      </div>
    </div>
  )
}
