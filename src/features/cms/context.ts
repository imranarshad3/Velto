import { mapContentData } from './data.ts'
import { imageSizeStyle, sizeContentImages } from './imageSizing.ts'
import { createContext, useContext } from 'react'
import type { PageContent } from './types.ts'
export const ContentContext = createContext<Record<string, PageContent>>({})
export function useContent(page: string, section = '') {
  const content = useContext(ContentContext)[page]
  return (key: string, fallback: string) => content?.fields[section ? `${section}.${key}` : key] ?? fallback
}
export function usePageContent(page: string) { return useContext(ContentContext)[page] }
export function useImageSize(page: string, field: string) {
  return imageSizeStyle(usePageContent(page)?.imageSizes?.[field])
}

export function useContentData<T>(page: string, prefix: string, fallback: T): T {
  const content = useContext(ContentContext)[page]
  return content ? sizeContentImages(mapContentData(fallback,prefix,(key,value)=>content.fields[key] ?? value), prefix, content.imageSizes) : fallback
}
