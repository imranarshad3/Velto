import { mapContentData } from './data.ts'
import { createContext, useContext } from 'react'
import type { PageContent } from './types.ts'
export const ContentContext = createContext<Record<string, PageContent>>({})
export function useContent(page: string, section = '') {
  const content = useContext(ContentContext)[page]
  return (key: string, fallback: string) => content?.fields[section ? `${section}.${key}` : key] ?? fallback
}
export function usePageContent(page: string) { return useContext(ContentContext)[page] }

export function useContentData<T>(page: string, prefix: string, fallback: T): T {
  const content = useContext(ContentContext)[page]
  return content ? mapContentData(fallback,prefix,(key,value)=>content.fields[key] ?? value) : fallback
}
