import { mapContentData } from './data.ts'
import { imageSizeStyle, sizeContentImages } from './imageSizing.ts'
import { createContext, useContext } from 'react'
import type { PageContent } from './types.ts'
export interface ContentContextValue {
  pages: Record<string, PageContent>
  isReady: boolean
}

export const ContentContext = createContext<ContentContextValue>({
  pages: {},
  isReady: false,
})

export function useContentState() {
  return useContext(ContentContext)
}

export function useContentReady(page?: string) {
  const { isReady, pages } = useContext(ContentContext)
  if (!page) return isReady
  return isReady || Boolean(pages[page])
}

export function useContent(page: string, section = '') {
  const { pages } = useContext(ContentContext)
  const content = pages[page]
  return (key: string, fallback: string) => content?.fields[section ? `${section}.${key}` : key] ?? fallback
}

export function usePageContent(page: string) {
  return useContext(ContentContext).pages[page]
}

export function useImageSize(page: string, field: string) {
  return imageSizeStyle(usePageContent(page)?.imageSizes?.[field])
}

export function useContentData<T>(page: string, prefix: string, fallback: T): T {
  const { pages } = useContext(ContentContext)
  const content = pages[page]
  return content ? sizeContentImages(mapContentData(fallback, prefix, (key, value) => content.fields[key] ?? value), prefix, content.imageSizes) : fallback
}
