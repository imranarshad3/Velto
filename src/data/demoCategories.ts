import type { LucideIcon } from 'lucide-react'
import { categoryImage } from './images.ts'
import { Droplets, FlaskConical, Hammer, Layers, LayoutGrid, PaintRoller, SprayCan, Wrench } from 'lucide-react'

/**
 * DEMO category list for the homepage preview.
 * Product counts are intentionally omitted until they come from the catalog database.
 * Images are illustrative concept crops (public/images/categories/); the texture is the load-error fallback.
 */
export interface Category {
  slug: string
  name: string
  icon: LucideIcon
  /** Placeholder material texture used when no licensed image exists. */
  texture: 'tile' | 'water' | 'grout' | 'concrete' | 'floor' | 'admix' | 'surface' | 'tools'
  image?: { src: string; alt: string; width: number; height: number }
  productCount?: number
}

export const demoCategories: Category[] = [
  { slug: 'tile-adhesives', name: 'Tile Adhesives', icon: LayoutGrid, texture: 'tile', image: { ...categoryImage('tile-adhesives', 366), alt: 'Notched trowel spreading adhesive between floor tiles' } },
  { slug: 'waterproofing', name: 'Waterproofing', icon: Droplets, texture: 'water', image: { ...categoryImage('waterproofing', 420), alt: 'Roller applying blue waterproofing coating' } },
  { slug: 'grouts-sealants', name: 'Grouts & Sealants', icon: SprayCan, texture: 'grout', image: { ...categoryImage('grouts-sealants', 351), alt: 'Gloved hand pressing grout into tile joints' } },
  { slug: 'concrete-repair', name: 'Concrete Repair', icon: Hammer, texture: 'concrete', image: { ...categoryImage('concrete-repair', 357), alt: 'Trowel patching a damaged concrete surface' } },
  { slug: 'flooring-solutions', name: 'Flooring Solutions', icon: Layers, texture: 'floor', image: { ...categoryImage('flooring-solutions', 363), alt: 'Glossy seamless floor in an industrial hall' } },
  { slug: 'admixtures', name: 'Admixtures', icon: FlaskConical, texture: 'admix', image: { ...categoryImage('admixtures', 351), alt: 'Concrete mix being poured on site' } },
  { slug: 'surface-treatments', name: 'Surface Treatments', icon: PaintRoller, texture: 'surface', image: { ...categoryImage('surface-treatments', 582), alt: 'Roller applying a coating to a wall' } },
  { slug: 'tools-accessories', name: 'Tools & Accessories', icon: Wrench, texture: 'tools', image: { ...categoryImage('tools-accessories', 405), alt: 'Trowels, level and hand tools laid on concrete' } },
]
