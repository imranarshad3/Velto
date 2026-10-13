import type { ImageAsset } from './images.ts'

/**
 * Application detail content: a general planning sequence and the product categories usually involved.
 * Deliberately non-specific (no product claims or performance figures); the page tells readers to follow
 * each product's technical data sheet.
 */
export interface ApplicationDetail {
  intro: string
  steps: { title: string; text: string }[]
  categories: string[]
  image: ImageAsset
}

const img = (src: string, width: number, height: number, alt: string): ImageAsset => ({ src, width, height, alt })

export const applicationDetails: Record<string, ApplicationDetail> = {
  bathrooms: {
    intro: 'Bathrooms combine constant moisture with tiled finishes, so the order of work matters: protect the structure first, then tile and seal.',
    steps: [
      { title: 'Prepare the surfaces', text: 'Make substrates sound, clean and level; repair defects before anything else.' },
      { title: 'Waterproof wet areas', text: 'Apply a waterproofing layer to shower zones and floors before tiling.' },
      { title: 'Fix the tiles', text: 'Use an adhesive suited to the tile type, size and substrate.' },
      { title: 'Grout and seal', text: 'Fill joints with grout and seal movement and perimeter joints.' },
    ],
    categories: ['waterproofing', 'tile-adhesives', 'grouts-sealants'],
    image: img('/images/categories/tile-adhesives.webp', 366, 234, 'Illustrative concept: notched trowel spreading tile adhesive'),
  },
  kitchens: {
    intro: 'Kitchen walls and floors see heavy use and frequent cleaning. Plan adhesives, grouts and joint sealing together.',
    steps: [
      { title: 'Prepare the substrate', text: 'Check walls and floors are sound, dry and flat enough for tiling.' },
      { title: 'Tile walls and floors', text: 'Choose adhesives suited to the tiles and the surface behind them.' },
      { title: 'Grout the joints', text: 'Select a grout appropriate for the area and how it will be cleaned.' },
      { title: 'Seal perimeter joints', text: 'Seal around worktops, sinks and changes of plane.' },
    ],
    categories: ['tile-adhesives', 'grouts-sealants', 'surface-treatments'],
    image: img('/images/categories/grouts-sealants.webp', 351, 234, 'Illustrative concept: gloved hand pressing grout into tile joints'),
  },
  roofs: {
    intro: 'Flat roofs and terraces are exposed to sun and rain. Repair the structure, then build up a continuous waterproofing system.',
    steps: [
      { title: 'Inspect and repair', text: 'Fill cracks and repair damaged concrete before waterproofing.' },
      { title: 'Prepare and prime', text: 'Clean the surface and prime where the system requires it.' },
      { title: 'Apply waterproofing', text: 'Build the waterproofing layer, detailing upstands, drains and joints.' },
      { title: 'Protect the finish', text: 'Add protective or finishing layers where foot traffic or exposure needs them.' },
    ],
    categories: ['concrete-repair', 'waterproofing', 'surface-treatments'],
    image: img('/images/categories/waterproofing.webp', 420, 234, 'Illustrative concept: roller applying blue waterproofing coating'),
  },
  floors: {
    intro: 'Good floors start underneath: repair and level the base before tiling or applying a seamless finish.',
    steps: [
      { title: 'Repair defects', text: 'Patch damaged or uneven concrete.' },
      { title: 'Level the base', text: 'Use a levelling layer where the floor needs to be flatter.' },
      { title: 'Apply the finish', text: 'Tile, or apply a floor coating or treatment suited to the use.' },
      { title: 'Seal joints', text: 'Respect and seal movement joints in the floor.' },
    ],
    categories: ['concrete-repair', 'flooring-solutions', 'tile-adhesives'],
    image: img('/images/categories/flooring-solutions.webp', 363, 234, 'Illustrative concept: glossy seamless floor in an industrial hall'),
  },
  pools: {
    intro: 'Pools and water features hold water permanently, so waterproofing, tile fixing and grouting need to work as one system.',
    steps: [
      { title: 'Prepare the structure', text: 'Ensure the shell is sound, cured and clean.' },
      { title: 'Waterproof', text: 'Apply waterproofing suited to permanently submerged areas.' },
      { title: 'Fix the tiles', text: 'Use adhesives intended for wet and submerged conditions.' },
      { title: 'Grout the joints', text: 'Choose grout suited to water-retaining areas.' },
    ],
    categories: ['waterproofing', 'tile-adhesives', 'grouts-sealants'],
    image: img('/images/banners/waterproofing-crop.webp', 448, 380, 'Illustrative concept: roller applying a waterproofing coat'),
  },
  'exterior-walls': {
    intro: 'External walls face weather year-round. Repair first, then protect the surface and seal its joints.',
    steps: [
      { title: 'Repair', text: 'Fill cracks and repair spalled or damaged areas.' },
      { title: 'Prepare and prime', text: 'Clean the surface and prime where required.' },
      { title: 'Protect', text: 'Apply a protective coating or water-repellent treatment.' },
      { title: 'Seal joints', text: 'Seal movement joints and junctions with other materials.' },
    ],
    categories: ['concrete-repair', 'surface-treatments', 'grouts-sealants'],
    image: img('/images/categories/surface-treatments.webp', 582, 234, 'Illustrative concept: roller applying a coating to a wall'),
  },
}

export const guidanceNote = 'General planning guidance only. Always follow the product’s technical data sheet and local building practice.'
