import type { ImageAsset } from './images.ts'

export type Area = 'interior' | 'exterior'

/**
 * DEMO catalogue. Entries are generic product TYPES, not verified ULTRA SKUs:
 * no trade names, prices, stock, ratings, pack sizes or performance figures.
 * Every entry has an illustrative VELTO concept packshot, not verified manufacturer photography.
 */
export interface CatalogProduct {
  id: string
  /** URL segment for /products/:slug. */
  slug: string
  name: string
  categorySlug: string
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

type CatalogEntry = Omit<CatalogProduct, 'slug' | 'verified'>

const pack = (n: number, alt: string): ImageAsset => ({
  src: `/images/products/concept-pack-0${n}.webp`,
  alt,
  width: 236,
  height: 224,
})

export const areaLabels: Record<Area, string> = { interior: 'Interior', exterior: 'Exterior' }

const entries: CatalogEntry[] = [
  {
    id: 'demo-tile-adhesive',
    name: 'Tile Adhesive',
    categorySlug: 'tile-adhesives',
    usage: 'For fixing floor and wall tiles.',
    applications: ['bathrooms', 'kitchens', 'floors'],
    areas: ['interior', 'exterior'],
    image: pack(1, 'Illustrative concept bag of tile adhesive'),
  },
  {
    id: 'demo-waterproofing',
    name: 'Waterproofing Coating',
    categorySlug: 'waterproofing',
    usage: 'For roofs, terraces and wet areas.',
    applications: ['roofs', 'bathrooms', 'pools'],
    areas: ['interior', 'exterior'],
    image: pack(2, 'Illustrative concept bucket of waterproofing coating'),
  },
  {
    id: 'demo-grout',
    name: 'Tile Grout',
    categorySlug: 'grouts-sealants',
    usage: 'For filling joints between tiles.',
    applications: ['bathrooms', 'kitchens', 'floors'],
    areas: ['interior'],
    image: pack(3, 'Illustrative concept tub of tile grout'),
  },
  {
    id: 'demo-repair-mortar',
    name: 'Repair Mortar',
    categorySlug: 'concrete-repair',
    usage: 'For patching damaged concrete.',
    applications: ['floors', 'exterior-walls'],
    areas: ['interior', 'exterior'],
    image: pack(4, 'Illustrative concept bag of repair mortar'),
  },
  { id: 'demo-large-tile-adhesive', name: 'Large-Format Tile Adhesive', categorySlug: 'tile-adhesives', usage: 'For large floor and wall tiles and slabs.', applications: ['floors', 'kitchens'], areas: ['interior', 'exterior'] },
  { id: 'demo-stone-adhesive', name: 'Natural Stone Adhesive', categorySlug: 'tile-adhesives', usage: 'For fixing natural stone cladding and paving.', applications: ['exterior-walls', 'floors'], areas: ['exterior'] },
  { id: 'demo-pool-tile-adhesive', name: 'Pool Tile Adhesive', categorySlug: 'tile-adhesives', usage: 'For tiling submerged and wet surfaces.', applications: ['pools'], areas: ['exterior'] },
  { id: 'demo-membrane', name: 'Liquid Waterproofing Membrane', categorySlug: 'waterproofing', usage: 'For roofs, balconies and terraces.', applications: ['roofs'], areas: ['exterior'] },
  { id: 'demo-cementitious-wp', name: 'Cementitious Waterproofing', categorySlug: 'waterproofing', usage: 'For basements, tanks and wet rooms.', applications: ['bathrooms', 'pools'], areas: ['interior', 'exterior'] },
  { id: 'demo-wall-wp', name: 'Exterior Wall Waterproofing', categorySlug: 'waterproofing', usage: 'For protecting external walls from rain.', applications: ['exterior-walls'], areas: ['exterior'] },
  { id: 'demo-epoxy-grout', name: 'Epoxy Grout', categorySlug: 'grouts-sealants', usage: 'For joints in kitchens and wet areas.', applications: ['kitchens', 'bathrooms', 'pools'], areas: ['interior', 'exterior'] },
  { id: 'demo-sealant', name: 'Joint Sealant', categorySlug: 'grouts-sealants', usage: 'For sealing movement and perimeter joints.', applications: ['bathrooms', 'kitchens', 'exterior-walls'], areas: ['interior', 'exterior'] },
  { id: 'demo-micro-concrete', name: 'Micro-Concrete', categorySlug: 'concrete-repair', usage: 'For repairing structural concrete sections.', applications: ['floors'], areas: ['interior', 'exterior'] },
  { id: 'demo-bonding-agent', name: 'Bonding Agent', categorySlug: 'concrete-repair', usage: 'For bonding new mortar to old concrete.', applications: ['floors', 'exterior-walls'], areas: ['interior', 'exterior'] },
  { id: 'demo-crack-filler', name: 'Crack Filler', categorySlug: 'concrete-repair', usage: 'For filling cracks in walls and slabs.', applications: ['exterior-walls', 'roofs'], areas: ['interior', 'exterior'] },
  { id: 'demo-self-leveller', name: 'Self-Levelling Underlayment', categorySlug: 'flooring-solutions', usage: 'For creating level surfaces before flooring.', applications: ['floors'], areas: ['interior'] },
  { id: 'demo-epoxy-floor', name: 'Epoxy Floor Coating', categorySlug: 'flooring-solutions', usage: 'For seamless industrial and commercial floors.', applications: ['floors'], areas: ['interior'] },
  { id: 'demo-floor-hardener', name: 'Floor Hardener', categorySlug: 'flooring-solutions', usage: 'For surface finishing of concrete floors.', applications: ['floors'], areas: ['interior', 'exterior'] },
  { id: 'demo-plasticiser', name: 'Plasticiser Admixture', categorySlug: 'admixtures', usage: 'For adjusting the workability of concrete mixes.', applications: ['floors', 'roofs'], areas: ['interior', 'exterior'] },
  { id: 'demo-integral-wp', name: 'Integral Waterproofing Admixture', categorySlug: 'admixtures', usage: 'For adding to concrete and mortar mixes.', applications: ['roofs', 'pools'], areas: ['exterior'] },
  { id: 'demo-curing', name: 'Curing Compound', categorySlug: 'admixtures', usage: 'For applying to freshly placed concrete.', applications: ['floors', 'roofs'], areas: ['exterior'] },
  { id: 'demo-primer', name: 'Surface Primer', categorySlug: 'surface-treatments', usage: 'For preparing surfaces before coating.', applications: ['exterior-walls', 'floors'], areas: ['interior', 'exterior'] },
  { id: 'demo-water-repellent', name: 'Water-Repellent Sealer', categorySlug: 'surface-treatments', usage: 'For treating masonry and stone facades.', applications: ['exterior-walls'], areas: ['exterior'] },
  { id: 'demo-protective-coating', name: 'Protective Wall Coating', categorySlug: 'surface-treatments', usage: 'For coating exposed concrete surfaces.', applications: ['exterior-walls'], areas: ['exterior'] },
  { id: 'demo-notched-trowel', name: 'Notched Trowel', categorySlug: 'tools-accessories', usage: 'For spreading tile adhesive evenly.', applications: ['bathrooms', 'kitchens', 'floors'], areas: ['interior', 'exterior'] },
  { id: 'demo-grout-float', name: 'Grout Float', categorySlug: 'tools-accessories', usage: 'For pressing grout into tile joints.', applications: ['bathrooms', 'kitchens'], areas: ['interior'] },
  { id: 'demo-mixing-paddle', name: 'Mixing Paddle', categorySlug: 'tools-accessories', usage: 'For mixing mortars and adhesives.', applications: ['floors'], areas: ['interior', 'exterior'] },
]

/** DEMO (PKR): illustrative figures so the storefront can be reviewed with prices. Not real ULTRA pricing. */
const demoPrices: Record<string, number> = {
  'demo-tile-adhesive': 1450,
  'demo-waterproofing': 3800,
  'demo-grout': 950,
  'demo-repair-mortar': 1650,
  'demo-large-tile-adhesive': 2100,
  'demo-stone-adhesive': 2350,
  'demo-pool-tile-adhesive': 2900,
  'demo-membrane': 6200,
  'demo-cementitious-wp': 4100,
  'demo-wall-wp': 5400,
  'demo-epoxy-grout': 4800,
  'demo-sealant': 1250,
  'demo-micro-concrete': 2600,
  'demo-bonding-agent': 1800,
  'demo-crack-filler': 850,
  'demo-self-leveller': 3200,
  'demo-epoxy-floor': 9500,
  'demo-floor-hardener': 2750,
  'demo-plasticiser': 1900,
  'demo-integral-wp': 1350,
  'demo-curing': 2200,
  'demo-primer': 2400,
  'demo-water-repellent': 4600,
  'demo-protective-coating': 5800,
  'demo-notched-trowel': 650,
  'demo-grout-float': 750,
  'demo-mixing-paddle': 1100,
}

export const catalog: CatalogProduct[] = entries.map((entry) => ({
  ...entry,
  image: {
    src: `/images/products/${entry.id.replace(/^demo-/, '')}.webp`,
    alt: `Illustrative VELTO concept: ${entry.name}`,
    width: 1024,
    height: 1024,
  },
  slug: entry.id.replace(/^demo-/, ''),
  verified: false,
  ...(demoPrices[entry.id] && { demoPrice: { amount: demoPrices[entry.id], currency: 'PKR' } }),
}))

export const findProduct = (slug: string | undefined) => catalog.find((product) => product.slug === slug)

export const productPath = (product: CatalogProduct) => `/products/${product.slug}`
