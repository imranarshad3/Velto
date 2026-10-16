import type { ImageAsset } from './images.ts'

export type Area = 'interior' | 'exterior'

/**
 * VELTO concept catalogue with store-owner-approved selling prices.
 * No verified stock, ratings, pack sizes or performance figures.
 * Every entry has an illustrative VELTO concept packshot, not verified manufacturer photography.
 */
export interface CatalogProduct {
  id: string
  /** URL segment for /products/:slug. */
  slug: string
  name: string
  categorySlug: string
  categoryName?: string
  images?: ImageAsset[]
  stockQuantity?: number | null
  usage: string
  applications: string[]
  areas: Area[]
  image?: ImageAsset
  /** False until the record is confirmed by the manufacturer/store operator. */
  verified: boolean
  /** Shown only when `verified`; absent means "pricing on request". */
  price?: { amount: number; currency: string }
  /** Illustrative DEMO price for the bundled catalogue only. Display-only: never used for cart, quote or order totals. */
  demoPrice?: { amount: number; currency: string }
  // Supplier-verified fields. Optional and intentionally unset: never mocked.
  description?: string
  benefits?: string[]
  specifications?: Specification[]
  packSizes?: string[]
  coverage?: string
  documents?: ProductDocument[]
  faq?: { question: string; answer: string }[]
}

export interface Specification {
  label: string
  value: string
}

export interface ProductDocument {
  title: string
  url: string
  fileType: string
}

export const areaLabels: Record<Area, string> = { interior: 'Interior', exterior: 'Exterior' }

/** VELTO concept collection. Selling prices confirmed by the store owner. */
export const catalog: CatalogProduct[] = [
  { id: 'demo-tile-adhesive', slug: 'tile-adhesive', name: 'VELTO Tile Bond', categorySlug: 'tile-adhesives', usage: 'DEMO tile adhesive concept for floor and wall projects.', applications: ['bathrooms', 'kitchens', 'floors'], areas: ['interior', 'exterior'], price: { amount: 2450, currency: 'PKR' } },
  { id: 'demo-waterproofing', slug: 'waterproofing', name: 'VELTO Aqua Shield', categorySlug: 'waterproofing', usage: 'DEMO waterproofing coating concept for wet-area projects.', applications: ['roofs', 'bathrooms'], areas: ['interior', 'exterior'], price: { amount: 6850, currency: 'PKR' } },
  { id: 'demo-grout', slug: 'grout', name: 'VELTO Joint Finish', categorySlug: 'grouts-sealants', usage: 'DEMO grout concept for tile finishing projects.', applications: ['bathrooms', 'kitchens', 'floors'], areas: ['interior'], price: { amount: 1250, currency: 'PKR' } },
  { id: 'demo-repair-mortar', slug: 'repair-mortar', name: 'VELTO Repair Base', categorySlug: 'concrete-repair', usage: 'DEMO repair mortar concept for concrete projects.', applications: ['floors', 'exterior-walls'], areas: ['interior', 'exterior'], price: { amount: 3250, currency: 'PKR' } },
].map((entry) => ({
  ...entry,
  areas: entry.areas as Area[],
  verified: true,
  description: `${entry.name} is part of the VELTO demonstration collection. Product imagery is an AI-generated packaging concept. Selling prices are confirmed by the store owner. Packaging remains illustrative; suitability, pack sizes and technical specifications must be confirmed before purchase or use.`,
  image: {
    src: `/images/products/testing-${entry.slug}.webp`,
    alt: `DEMO concept packaging for ${entry.name}; not a verified product photograph`,
    width: 1024,
    height: 1024,
  },
}))

export const findProduct = (slug: string | undefined) => catalog.find((product) => product.slug === slug)

export const productPath = (product: CatalogProduct) => `/products/${product.slug}`
