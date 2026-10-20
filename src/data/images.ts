/**
 * Local image registry. Storefront imagery is AI-generated editorial illustration,
 * not verified project photography or official manufacturer packaging.
 * See public/images/ASSET_PROVENANCE.md for the generation prompts and sources.
 */
export interface ImageAsset {
  displaySize?: import('../features/cms/imageSizing.js').ImageSize
  src: string
  alt: string
  width: number
  height: number
}

const refreshedImages: Record<string, readonly [number, number]> = {
  '/images/categories/tile-adhesives.webp': [1536, 1024],
  '/images/categories/waterproofing.webp': [1536, 1024],
  '/images/categories/grouts-sealants.webp': [1536, 1024],
  '/images/categories/concrete-repair.webp': [1536, 1024],
  '/images/categories/flooring-solutions.webp': [1536, 1024],
  '/images/categories/surface-treatments.webp': [1536, 1024],
  '/images/hero/architecture.webp': [1536, 1024],
  '/images/banners/brand-story-crop.webp': [1536, 1024],
  '/images/banners/waterproofing-crop.webp': [1536, 1024],
  '/images/banners/professional-contractor.webp': [1672, 941],
}

/** Refresh cached local artwork and intrinsic dimensions, including old CMS references.
 * Uploaded images retain their original URL and metadata.
 */
export function resolveImageAsset(image: ImageAsset): ImageAsset {
  const dimensions = Object.hasOwn(refreshedImages, image.src) ? refreshedImages[image.src] : undefined
  if (!dimensions) return image
  return { ...image, src: `${image.src}?v=20261020`, width: dimensions[0], height: dimensions[1] }
}

export const heroImage: ImageAsset = {
  src: '/images/hero/hero-architecture-crop.webp',
  alt: 'Illustrative concept: contemporary limestone and concrete villa beside a reflecting pool',
  width: 1122,
  height: 1402,
}

export const brandStoryImage: ImageAsset = {
  src: '/images/banners/brand-story-crop.webp',
  alt: 'Illustrative concept: contemporary concrete and timber building at dusk',
  width: 1536,
  height: 1024,
}

export const professionalImage: ImageAsset = {
  src: '/images/banners/professional-contractor.webp',
  alt: 'Illustrative concept: contractor in safety gear levelling a floor surface',
  width: 1672,
  height: 941,
}

export const waterproofingImage: ImageAsset = {
  src: '/images/banners/waterproofing-crop.webp',
  alt: 'Illustrative concept: roller applying a blue waterproofing coat to a rooftop',
  width: 1536,
  height: 1024,
}

export const categoryImage = (slug: string, width: number) => ({
  src: `/images/categories/${slug}.webp`,
  width: ['admixtures', 'tools-accessories'].includes(slug) ? width : 1536,
  height: ['admixtures', 'tools-accessories'].includes(slug) ? 234 : 1024,
})
