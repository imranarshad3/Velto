/**
 * Local image registry. Every file under public/images/ is an ILLUSTRATIVE CONCEPT CROP
 * (see NOVARO_Claude_Code_Kit/designs/homepage/M02_references/IMAGE_GUIDE.md), not official
 * product photography. Replace files in place with licensed photos before launch; keep filenames.
 * `*-crop` / `concept-pack-*` files are derived copies with mockup text, prices and stats removed.
 */
export interface ImageAsset {
  src: string
  alt: string
  width: number
  height: number
}

export const heroImage: ImageAsset = {
  src: '/images/hero/hero-architecture-crop.webp',
  alt: 'Illustrative concept: modern concrete house with construction chemical packs on a stone ledge',
  width: 1002,
  height: 810,
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
