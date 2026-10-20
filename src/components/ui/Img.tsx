import { useImageSize } from '../../features/cms/context.ts'
import { imageFrameStyle, imageSizeStyle } from '../../features/cms/imageSizing.ts'
import { useState } from 'react'
import type { ImageAsset } from '../../data/images.ts'

interface ImgProps {
  cmsImage?: { page: string; field: string }
  image: ImageAsset
  className?: string
  /** Pass "" when the image is decorative. */
  alt?: string
  /** Above-the-fold (LCP) image: eager load with high fetch priority. */
  priority?: boolean
  /** Fill a fixed media frame; CMS width/height overrides must not leave empty bands in the frame. */
  fit?: boolean
}

/** Lazy, CLS-safe image that collapses to the parent's background colour if the file fails to load. */
export default function Img({ image, className = '', alt = image.alt, priority = false, cmsImage, fit = false }: ImgProps) {
  const cmsStyle = useImageSize(cmsImage?.page ?? '', cmsImage?.field ?? '')
  const [failed, setFailed] = useState<string | null>(null)
  if (!image.src || failed === image.src) return null

  return (
    <img
      src={image.src}
      style={fit ? { ...imageFrameStyle, ...cmsStyle } : cmsStyle ?? imageSizeStyle(image.displaySize)}
      alt={alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(image.src)}
      className={className}
    />
  )
}
