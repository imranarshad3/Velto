/**
 * Local image registry. Storefront imagery is AI-generated editorial illustration,
 * not verified project photography or official manufacturer packaging.
 * See public/images/ASSET_PROVENANCE.md for the generation prompts and sources.
 */
export interface ImageAsset {
  src: string
  alt: string
  width: number
  height: number
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
  width: 935,
  height: 324,
}

export const professionalImage: ImageAsset = {
  src: '/images/banners/professional-contractor.webp',
  alt: 'Illustrative concept: contractor in safety gear levelling a floor surface',
  width: 420,
  height: 430,
}

export const waterproofingImage: ImageAsset = {
  src: '/images/banners/waterproofing-crop.webp',
  alt: 'Illustrative concept: roller applying a blue waterproofing coat to a rooftop',
  width: 448,
  height: 380,
}

export const categoryImage = (slug: string, width: number) => ({
  src: `/images/categories/${slug}.webp`,
  width,
  height: 234,
})
