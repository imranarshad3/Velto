import type { LucideIcon } from 'lucide-react'
import {
  Bath,
  BookOpen,
  BrickWall,
  Calculator,
  ClipboardList,
  Compass,
  CookingPot,
  FileText,
  Grid2x2,
  House,
  LayoutGrid,
  MessagesSquare,
  WavesLadder,
} from 'lucide-react'
import type { ImageAsset } from './images.ts'

export interface IconItem {
  title: string
  text: string
  icon: LucideIcon
}

/** Service-oriented benefits only: no certifications, statistics or performance superlatives. */
export const whyChooseFeatures: IconItem[] = [
  { title: 'Organised by category', text: 'Find products by material and job type.', icon: LayoutGrid },
  { title: 'Application guidance', text: 'Match products to the surface you are working on.', icon: Compass },
  { title: 'Technical resources', text: 'Data sheets and installation guides as they are published.', icon: BookOpen },
  { title: 'Project quotes', text: 'Ask for quantities and pricing for larger jobs.', icon: ClipboardList },
]

export interface Application {
  slug: string
  name: string
  text: string
  icon: LucideIcon
}

export const applications: Application[] = [
  { slug: 'bathrooms', name: 'Bathrooms', text: 'Tiling, grouting and wet-area waterproofing.', icon: Bath },
  { slug: 'kitchens', name: 'Kitchens', text: 'Wall and floor tiling, joints and sealing.', icon: CookingPot },
  { slug: 'roofs', name: 'Roofs', text: 'Roof and terrace waterproofing systems.', icon: House },
  { slug: 'floors', name: 'Floors', text: 'Levelling, tiling and floor finishes.', icon: Grid2x2 },
  { slug: 'pools', name: 'Pools', text: 'Waterproofing and tiling for water-retaining areas.', icon: WavesLadder },
  { slug: 'exterior-walls', name: 'Exterior Walls', text: 'Repair, protection and surface treatments.', icon: BrickWall },
]

export interface InspirationItem {
  title: string
  caption: string
  image: ImageAsset
}

/** General inspiration only. These are not completed VELTO projects. */
export const inspiration: InspirationItem[] = [
  {
    title: 'Contemporary homes',
    caption: 'Concrete, stone and glass facades',
    image: {
      src: '/images/hero/architecture.webp',
      alt: 'Illustrative concept: modern two-storey house with landscaped garden',
      width: 426,
      height: 234,
    },
  },
  {
    title: 'Industrial floors',
    caption: 'Seamless, easy-clean floor finishes',
    image: {
      src: '/images/categories/flooring-solutions.webp',
      alt: 'Illustrative concept: glossy seamless floor in an industrial hall',
      width: 363,
      height: 234,
    },
  },
  {
    title: 'Repair & restoration',
    caption: 'Bringing damaged concrete back into service',
    image: {
      src: '/images/categories/concrete-repair.webp',
      alt: 'Illustrative concept: trowel patching a damaged concrete surface',
      width: 357,
      height: 234,
    },
  },
]

export interface Resource {
  title: string
  text: string
  icon: LucideIcon
  /** In-page or implemented destination. Omit while the resource is unavailable. */
  href?: string
}

export const resources: Resource[] = [
  { title: 'Product data sheets', text: 'Technical data for each product.', icon: FileText, href: '/resources/documents?kind=data_sheet' },
  { title: 'Installation guides', text: 'Step-by-step application instructions.', icon: BookOpen, href: '/resources/documents?kind=installation_guide' },
  { title: 'Coverage calculator', text: 'Estimate quantities for your area.', icon: Calculator, href: '/resources/coverage-calculator' },
  { title: 'Quote help', text: 'Tell us about your project requirements.', icon: MessagesSquare, href: '#quote' },
]
