import { z } from 'zod'
import { productImageSchema } from './productSchema.js'

/** Admin category input, shared by the admin page and the API. Mirrors public.categories CHECK constraints. */
export const categoryInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens').max(80),
  name: z.string().trim().min(2, 'Enter a name').max(80),
  description: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(300).nullable().default(null)),
  image: z.preprocess((v) => (v === '' || v === undefined ? null : v), productImageSchema.nullable()),
  visible: z.boolean().default(true),
})
export type CategoryInput = z.input<typeof categoryInputSchema>
export type CategoryData = z.output<typeof categoryInputSchema>

export const categoryOrderSchema = z.object({ slugs: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).min(1).max(200) })
export const categoryDeleteSchema = z.object({ moveTo: z.string().regex(/^[a-z0-9-]{1,80}$/).nullable().default(null) })

/** Public category, as served with /api/catalog (visible categories only). */
export interface StoreCategory {
  slug: string
  name: string
  description: string | null
  image: z.output<typeof productImageSchema> | null
  sortOrder: number
}

export interface AdminCategory extends StoreCategory {
  visible: boolean
  productCount: number
  updatedAt: string
}

/** Names of the original built-in categories, used to seed stores that predate the categories table. */
export const builtInCategoryNames: Record<string, string> = {
  'tile-adhesives': 'Tile Adhesives',
  waterproofing: 'Waterproofing',
  'grouts-sealants': 'Grouts & Sealants',
  'concrete-repair': 'Concrete Repair',
  'flooring-solutions': 'Flooring Solutions',
  admixtures: 'Admixtures',
  'surface-treatments': 'Surface Treatments',
  'tools-accessories': 'Tools & Accessories',
}

export const categoryNameFromSlug = (slug: string) =>
  builtInCategoryNames[slug] ?? slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
