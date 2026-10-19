import { LayoutGrid } from 'lucide-react'
import { demoCategories, type Category } from '../../data/demoCategories.ts'
import type { StoreCategory } from './categorySchema.ts'

const builtIn = new Map(demoCategories.map((c) => [c.slug, c]))

/** Admin-managed category → card shape. Built-in slugs keep their icon and placeholder texture. */
export const toDisplayCategory = (c: StoreCategory): Category => {
  const base = builtIn.get(c.slug)
  return {
    slug: c.slug,
    name: c.name,
    description: c.description ?? undefined,
    icon: base?.icon ?? LayoutGrid,
    texture: base?.texture ?? 'tile',
    image: c.image ?? undefined,
  }
}
