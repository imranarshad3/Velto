import { Heart } from 'lucide-react'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
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
      <title>Wishlist — NOVARO</title>
      <PageHeader
        title="Wishlist"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
        description={auth.signedIn ? 'Saved products, synced to your account.' : 'Saved products are kept in this browser. Sign in to keep them across devices.'}
        actions={
          products.length > 0 ? (
            <button type="button" onClick={addAll} className="inline-flex min-h-11 items-center rounded-lg bg-forest px-5 font-semibold text-white hover:bg-forest-dark">
              Add all to cart
            </button>
          ) : undefined
        }
      />
      <div className="container-page py-[clamp(2rem,4vw,3.5rem)] pb-[var(--section-gap)]">
        {products.length === 0 ? (
          <EmptyState icon={Heart} title="No saved products yet" actions={<ButtonLink to="/products">Browse products</ButtonLink>}>
            Tap the heart on any product to save it here.
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-4 min-[22rem]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <li key={product.slug}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
