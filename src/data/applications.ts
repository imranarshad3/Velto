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
    intro: 'Bathrooms stay wet, so follow the right order: protect the walls and floors, then fit and seal the tiles.',
    steps: [
      { title: 'Prepare the surfaces', text: 'Make sure surfaces are clean, level and in good shape. Fix any damage first.' },
      { title: 'Waterproof wet areas', text: 'Waterproof shower areas and floors before fitting tiles.' },
      { title: 'Fix the tiles', text: 'Choose tile glue that suits the tiles and the surface.' },
      { title: 'Grout and seal', text: 'Fill the gaps between tiles with grout. Seal the edges and joins.' },
    ],
    categories: ['waterproofing', 'tile-adhesives', 'grouts-sealants'],
    image: img('/images/categories/tile-adhesives.webp', 1536, 1024, 'Illustrative concept: notched trowel spreading tile adhesive'),
  },
  kitchens: {
    intro: 'Kitchen walls and floors need to handle daily use and cleaning. Plan the tile glue, grout and sealant together.',
    steps: [
      { title: 'Prepare the substrate', text: 'Make sure the walls and floors are dry, firm and flat enough for tiles.' },
      { title: 'Tile walls and floors', text: 'Choose tile glue that suits the tiles and the wall or floor.' },
      { title: 'Grout the joints', text: 'Choose grout that suits the area and how you will clean it.' },
      { title: 'Seal perimeter joints', text: 'Seal the edges around worktops, sinks and corners.' },
    ],
    categories: ['tile-adhesives', 'grouts-sealants', 'surface-treatments'],
    image: img('/images/categories/grouts-sealants.webp', 1536, 1024, 'Illustrative concept: gloved hand pressing grout into tile joints'),
  },
  roofs: {
    intro: 'Flat roofs and terraces face sun and rain. Fix any damage, then add a full waterproof layer.',
    steps: [
      { title: 'Inspect and repair', text: 'Fill cracks and fix damaged concrete before adding the waterproof layer.' },
      { title: 'Prepare and prime', text: 'Clean the surface and add primer if the product guide says to.' },
      { title: 'Apply waterproofing', text: 'Apply the waterproof layer around edges, drains and joins.' },
      { title: 'Protect the finish', text: 'Add a top layer if the area needs more protection or people will walk on it.' },
    ],
    categories: ['concrete-repair', 'waterproofing', 'surface-treatments'],
    image: img('/images/categories/waterproofing.webp', 1536, 1024, 'Illustrative concept: roller applying blue waterproofing coating'),
  },
  floors: {
    intro: 'Good floors start underneath: repair and level the base before tiling or applying a seamless finish.',
    steps: [
      { title: 'Repair defects', text: 'Patch damaged or uneven concrete.' },
      { title: 'Level the base', text: 'Add a levelling layer if the floor is uneven.' },
      { title: 'Apply the finish', text: 'Fit tiles or add a floor coating that suits how the room is used.' },
      { title: 'Seal joints', text: 'Keep the floor joints clear and seal them as directed.' },
    ],
    categories: ['concrete-repair', 'flooring-solutions', 'tile-adhesives'],
    image: img('/images/categories/flooring-solutions.webp', 1536, 1024, 'Illustrative concept: glossy seamless floor in an industrial hall'),
  },
  pools: {
    intro: 'Pools hold water all the time. The waterproof layer, tile glue and grout must work together.',
    steps: [
      { title: 'Prepare the structure', text: 'Make sure the pool shell is firm, dry and clean.' },
      { title: 'Waterproof', text: 'Use a waterproofing product made for areas that stay underwater.' },
      { title: 'Fix the tiles', text: 'Use tile glue made for wet areas and underwater use.' },
      { title: 'Grout the joints', text: 'Choose grout made for pools and other areas that hold water.' },
    ],
    categories: ['waterproofing', 'tile-adhesives', 'grouts-sealants'],
    image: img('/images/banners/waterproofing-crop.webp', 1536, 1024, 'Illustrative concept: roller applying a waterproofing coat'),
  },
  'exterior-walls': {
    intro: 'Outside walls face sun and rain. Fix damage first, then protect and seal the wall.',
    steps: [
      { title: 'Repair', text: 'Fill cracks and fix chipped or damaged areas.' },
      { title: 'Prepare and prime', text: 'Clean the wall and add primer if the product guide says to.' },
      { title: 'Protect', text: 'Add a coating that helps protect the wall from water and weather.' },
      { title: 'Seal joints', text: 'Seal the joins between the wall and other materials.' },
    ],
    categories: ['concrete-repair', 'surface-treatments', 'grouts-sealants'],
    image: img('/images/categories/surface-treatments.webp', 1536, 1024, 'Illustrative concept: roller applying a coating to a wall'),
  },
}

export const guidanceNote = 'These are general steps only. Follow the product guide and local building rules.'
