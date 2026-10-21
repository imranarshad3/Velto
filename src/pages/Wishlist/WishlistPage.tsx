import { Heart, ShoppingBasket } from 'lucide-react'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { useCart } from '../../features/cart/cartStore.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useWishlist } from '../../features/wishlist/wishlistStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

export default function WishlistPage() {
  const { find } = useCatalog()
  const auth = useAppAuth()
  const slugs = useWishlist((s) => s.slugs)
  const add = useCart((s) => s.add)
  const show = useToasts((s) => s.show)
  const products = slugs.map((slug) => find(slug)).filter((p) => p !== undefined)

  const addAll = () => {
    const results = products.map((p) => add(p.slug))
    const added = results.filter((r) => r === 'added').length
    show(results.includes('full') ? 'Your cart is full; some products were not added.' : `${added} ${added === 1 ? 'product' : 'products'} added to your cart`, { label: 'View cart', to: '/cart' })
  }

  return (
    <>
      <title>Wishlist — VELTO</title>
      <PageHeader
        eyebrow="Saved for later"
        title="Wishlist"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
        description={auth.signedIn ? 'Saved products, synced to your account.' : 'Saved products are kept in this browser. Sign in to keep them across devices.'}
      />
      <div className="bg-canvas">
        <div className="container-page py-[var(--content-pad)] pb-[var(--section-gap)]">
          {products.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No saved products yet"
              actions={
                <ButtonLink to="/products#product-results">
                  Browse products
                </ButtonLink>
              }
            >
              Tap the heart on any product to save it here.
            </EmptyState>
          ) : (
            <>
              <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                    <Heart className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-[clamp(1.25rem,1.15rem+0.4vw,1.5rem)] leading-tight">
                      {products.length} saved {products.length === 1 ? 'product' : 'products'}
                    </h2>
                    <p className="text-[0.875rem] text-muted">Move them to your cart to request one combined quote.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <ButtonLink to="/products#product-results" variant="secondary">
                    Keep browsing
                  </ButtonLink>
                  <button type="button" onClick={addAll} className={buttonClass('primary', 'md', 'flex-1 sm:flex-none')}>
                    <ShoppingBasket aria-hidden="true" className="size-4" /> Add all to cart
                  </button>
                </div>
              </div>
              <ul className="mt-[var(--heading-gap)] grid grid-cols-1 gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 lg:grid-cols-3 md:gap-[var(--grid-gap-lg)]">
                {products.map((product) => (
                  <li key={product.slug} className="min-w-0">
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}
