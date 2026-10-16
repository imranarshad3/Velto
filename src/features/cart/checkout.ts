import type { CatalogProduct } from '../../data/catalog.ts'

/** Cash on Delivery is supported; online payments remain unavailable. */
export const paymentsConfigured = false
export const checkoutAvailable = (products: CatalogProduct[]) => products.length > 0 && products.every(p => p.verified && p.price?.currency === 'PKR' && p.price.amount > 0)
