import type { CSSProperties } from 'react'
import type { PageContent } from './types.js'

export type ImageFit = 'contain' | 'cover'
export type ImagePosition = 'center' | 'top' | 'right' | 'bottom' | 'left'
export type ImageRatio = 'square' | 'landscape' | 'portrait'
export interface ImageSize { width: string; height: string; fit?: ImageFit; position?: ImagePosition; ratio?: ImageRatio }
/** Dimensions for images that must fill an art-directed frame regardless of optional CMS sizing. */
export const imageFrameStyle: CSSProperties = { width: '100%', height: '100%', maxWidth: '100%', aspectRatio: 'auto' }
/** Empty dimensions retain the original layout. Only bounded, relative CSS lengths are accepted. */
export function validImageDimension(value: string, axis: 'width' | 'height') {
  if (value === '') return true
  const match = /^(\d+(?:\.\d{1,2})?)(rem|%)$/.exec(value)
  if (!match) return false
  const number = Number(match[1])
  return number > 0 && (match[2] === '%' ? axis === 'width' && number <= 100 : number <= 120)
}
export function imageSizeStyle(size?: ImageSize): CSSProperties | undefined {
  if (!size || (!size.width && !size.height && !size.fit && !size.position && !size.ratio)) return undefined
  if (!validImageDimension(size.width, 'width') || !validImageDimension(size.height, 'height')) return undefined
  const position: Record<ImagePosition, string> = {
    center: 'center', top: 'center top', right: 'right center', bottom: 'center bottom', left: 'left center',
  }
  const ratios: Record<ImageRatio, string> = { square: '1 / 1', landscape: '4 / 3', portrait: '3 / 4' }
  return {
    ...(size.width ? { width: size.width, maxWidth: '100%' } : {}),
    ...(size.height ? { height: size.height } : { height: 'auto' }),
    ...(size.fit ? { objectFit: size.fit } : {}),
    ...(size.position ? { objectPosition: position[size.position] } : {}),
    aspectRatio: size.ratio ? ratios[size.ratio] : 'auto',
  }
}
/** Attach sizes to image objects by field identity, so reused URLs can have independent sizes. */
export function sizeContentImages<T>(data: T, prefix: string, sizes: PageContent['imageSizes']): T {
  if (!sizes) return data
  const visit = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) return value.map((item, i) => visit(item, `${path}.${i}`))
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype && !('$$typeof' in value)) {
      const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item, `${path}.${key}`)]))
      if (typeof result.src === 'string' && sizes[`${path}.src`]) result.displaySize = sizes[`${path}.src`]
      return result
    }
    return value
  }
  return visit(data, prefix) as T
}
