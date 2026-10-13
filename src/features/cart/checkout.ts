import type { CatalogProduct } from '../../data/catalog.ts'

/**
 * Online checkout requires (1) a configured, server-verified payment provider and (2) verified prices for
 * every item. Neither exists yet, so this is false; the checkout page explains what is missing.
 */
export const paymentsConfigured = false

export const checkoutAvailable = (products: CatalogProduct[]) =>
  paymentsConfigured && products.length > 0 && products.every((p) => p.verified)
