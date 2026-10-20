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
  { title: 'Easy to browse', text: 'Find products by material and job type.', icon: LayoutGrid },
  { title: 'Help for each area', text: 'Find products for the area you are working on.', icon: Compass },
  { title: 'Product guides', text: 'Find product details and step-by-step guides.', icon: BookOpen },
  { title: 'Project prices', text: 'Ask for the amount you need and a price for your project.', icon: ClipboardList },
]

export interface Application {
  slug: string
  name: string
  text: string
  icon: LucideIcon
}

export const applications: Application[] = [
  { slug: 'bathrooms', name: 'Bathrooms', text: 'Tiles, grout and waterproofing for wet areas.', icon: Bath },
  { slug: 'kitchens', name: 'Kitchens', text: 'Tiles, grout and sealant for walls and floors.', icon: CookingPot },
  { slug: 'roofs', name: 'Roofs', text: 'Waterproofing for roofs and terraces.', icon: House },
  { slug: 'floors', name: 'Floors', text: 'Level, tile or coat your floors.', icon: Grid2x2 },
  { slug: 'pools', name: 'Pools', text: 'Waterproofing and tiles for pools and water features.', icon: WavesLadder },
  { slug: 'exterior-walls', name: 'Exterior Walls', text: 'Repair and protect outside walls.', icon: BrickWall },
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
      width: 1536,
      height: 1024,
    },
  },
  {
    title: 'Industrial floors',
    caption: 'Seamless, easy-clean floor finishes',
    image: {
      src: '/images/categories/flooring-solutions.webp',
      alt: 'Illustrative concept: glossy seamless floor in an industrial hall',
      width: 1536,
      height: 1024,
    },
  },
  {
    title: 'Repair & restoration',
    caption: 'Bringing damaged concrete back into service',
    image: {
      src: '/images/categories/concrete-repair.webp',
      alt: 'Illustrative concept: trowel patching a damaged concrete surface',
      width: 1536,
      height: 1024,
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
  { title: 'Product details', text: 'Key details for each product.', icon: FileText, href: '/resources/documents?kind=data_sheet' },
  { title: 'Installation guides', text: 'Simple steps to use each product.', icon: BookOpen, href: '/resources/documents?kind=installation_guide' },
  { title: 'Coverage calculator', text: 'Work out how much you need for your area.', icon: Calculator, href: '/resources/coverage-calculator' },
  { title: 'Quote help', text: 'Tell us what you need for your project.', icon: MessagesSquare, href: '#quote' },
]
