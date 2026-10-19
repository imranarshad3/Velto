import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ContentContext } from './context.ts'
import type { PageContent } from './types.ts'
import { fetchPublishedContent, getCachedPublishedPages, onPublishedContentChange } from './contentClient.ts'

/** True inside the Website Editor's same-origin preview frame. */
const previewFrame = typeof window !== 'undefined' && window.parent !== window && new URLSearchParams(window.location.search).has('cms-preview')

export default function ContentProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Record<string, PageContent>>(() => {
    if (previewFrame) return {}
    return getCachedPublishedPages() ?? {}
  })
  const [isReady, setIsReady] = useState<boolean>(() => {
    if (previewFrame) return true
    return Boolean(getCachedPublishedPages())
  })
  const [drafts, setDrafts] = useState<Record<string, PageContent>>({})

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const load = async (force = false) => {
      try {
        const result = await fetchPublishedContent({ force, signal: controller.signal })
        if (active) {
          setPages((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(result.pages)) return prev
            return result.pages
          })
          setIsReady(true)
        }
      } catch {
        if (active) setIsReady(true)
      }
    }

    void load()

    const unsubscribe = onPublishedContentChange(() => {
      void load(true)
    })

    return () => {
      active = false
      controller.abort()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!previewFrame) return
    // Drafts are accepted only from the same-origin parent editor and live only in this frame's memory.
    const onMessage = (event: MessageEvent) => {
      const data = event.data
      if (event.origin !== window.location.origin || event.source !== window.parent || data?.type !== 'novaro:preview' || typeof data.slug !== 'string') return
      setDrafts(d => ({...d, [data.slug]: data.content as PageContent}))
      setIsReady(true)
    }
    // Links and forms stay inert so the preview never navigates away or submits real requests.
    const block = (event: Event) => { if (event.type === 'submit' || (event.target as Element | null)?.closest?.('a[href]')) { event.preventDefault(); event.stopPropagation() } }
    window.addEventListener('message', onMessage)
    document.addEventListener('click', block, true)
    document.addEventListener('submit', block, true)
    window.parent.postMessage({type: 'novaro:preview-ready'}, window.location.origin)
    return () => { window.removeEventListener('message', onMessage); document.removeEventListener('click', block, true); document.removeEventListener('submit', block, true) }
  }, [])

  const value = useMemo(() => ({
    pages: previewFrame ? { ...pages, ...drafts } : pages,
    isReady,
  }), [pages, drafts, isReady])

  return <ContentContext value={value}>{children}</ContentContext>
}
