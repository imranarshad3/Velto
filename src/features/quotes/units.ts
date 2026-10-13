/** Quantity units shared by the quote schema, cart and product pages. Kept zod-free so storefront chunks stay small. */
export const quantityUnits = ['bags', 'buckets', 'kg', 'litres', 'units'] as const
export type QuantityUnit = (typeof quantityUnits)[number]
