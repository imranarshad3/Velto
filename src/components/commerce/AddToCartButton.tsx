import { Check, ShoppingBasket } from 'lucide-react'
import { MAX_CART_ITEMS, useCart } from '../../features/cart/cartStore.ts'
import { useToasts } from '../../features/ui/toastStore.ts'

interface AddToCartButtonProps {
  slug: string
  name: string
  variant?: 'icon' | 'full'
  className?: string
}

/** Adds a product to the quote basket (cart). No prices: the basket becomes a multi-product quote request. */
export default function AddToCartButton({ slug, name, variant = 'icon', className = '' }: AddToCartButtonProps) {
  const inCart = useCart((s) => s.items.some((i) => i.slug === slug))
  const add = useCart((s) => s.add)
  const show = useToasts((s) => s.show)

  const onClick = () => {
    const result = add(slug)
    if (result === 'full') show(`Your cart holds up to ${MAX_CART_ITEMS} products. Request a quote for these first.`, { label: 'View cart', to: '/cart' })
    else show(result === 'added' ? `${name} added to your cart` : `${name} is already in your cart`, { label: 'View cart', to: '/cart' })
  }

  const Icon = inCart ? Check : ShoppingBasket

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 font-semibold transition-colors ${inCart ? 'border-forest bg-forest-soft text-forest' : 'border-ink/15 bg-surface text-ink hover:border-forest hover:text-forest'} ${className}`}
      >
        <Icon aria-hidden="true" className="size-4" /> {inCart ? 'In your cart' : 'Add to cart'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={inCart ? `${name} is in your cart` : `Add ${name} to cart`}
      className={`grid size-11 shrink-0 place-items-center rounded-lg border transition-colors ${inCart ? 'border-forest bg-forest text-white' : 'border-forest text-forest hover:bg-forest hover:text-white'} ${className}`}
    >
      <Icon aria-hidden="true" className="size-[1.125rem]" />
    </button>
  )
}
