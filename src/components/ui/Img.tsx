import { useState } from 'react'
import type { ImageAsset } from '../../data/images.ts'

interface ImgProps {
  image: ImageAsset
  className?: string
  /** Pass "" when the image is decorative. */
  alt?: string
  /** Above-the-fold (LCP) image: eager load with high fetch priority. */
  priority?: boolean
}

/** Lazy, CLS-safe image that collapses to the parent's background colour if the file fails to load. */
export default function Img({ image, className = '', alt = image.alt, priority = false }: ImgProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <img
      src={image.src}
      alt={alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
