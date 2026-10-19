import type { CSSProperties } from 'react'
import type { PageContent } from './types.js'

export interface ImageSize { width: string; height: string }
/** Empty dimensions retain the original layout. Only bounded, relative CSS lengths are accepted. */
export function validImageDimension(value: string, axis: 'width' | 'height') {
  if (value === '') return true
  const match = /^(\d+(?:\.\d{1,2})?)(rem|%)$/.exec(value)
  if (!match) return false
  const number = Number(match[1])
  return number > 0 && (match[2] === '%' ? axis === 'width' && number <= 100 : number <= 120)
}
export function imageSizeStyle(size?: ImageSize): CSSProperties | undefined {
  if (!size || (!size.width && !size.height)) return undefined
  if (!validImageDimension(size.width, 'width') || !validImageDimension(size.height, 'height')) return undefined
  return {
    ...(size.width ? { width: size.width, maxWidth: '100%' } : {}),
    ...(size.height ? { height: size.height } : { height: 'auto' }),
    aspectRatio: 'auto',
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
