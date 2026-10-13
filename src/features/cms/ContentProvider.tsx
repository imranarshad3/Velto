import { useEffect, useState, type ReactNode } from 'react'
import { ContentContext } from './context.ts'
import type { PageContent } from './types.ts'

/** True inside the Website Editor's same-origin preview frame. */
const previewFrame = typeof window !== 'undefined' && window.parent !== window && new URLSearchParams(window.location.search).has('cms-preview')

export default function ContentProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Record<string, PageContent>>({})
  const [drafts, setDrafts] = useState<Record<string, PageContent>>({})
  useEffect(() => {
    const controller = new AbortController()
    const load = () => { void fetch('/api/content', {signal: controller.signal}).then(async r => { if (r.ok) setPages((await r.json()).pages) }).catch(() => {}) }
    load(); window.addEventListener('novaro:published', load)
    return () => { controller.abort(); window.removeEventListener('novaro:published', load) }
  }, [])
  useEffect(() => {
    if (!previewFrame) return
    // Drafts are accepted only from the same-origin parent editor and live only in this frame's memory.
    const onMessage = (event: MessageEvent) => {
      const data = event.data
      if (event.origin !== window.location.origin || event.source !== window.parent || data?.type !== 'novaro:preview' || typeof data.slug !== 'string') return
      setDrafts(d => ({...d, [data.slug]: data.content as PageContent}))
    }
    // Links and forms stay inert so the preview never navigates away or submits real requests.
    const block = (event: Event) => { if (event.type === 'submit' || (event.target as Element | null)?.closest?.('a[href]')) { event.preventDefault(); event.stopPropagation() } }
    window.addEventListener('message', onMessage)
    document.addEventListener('click', block, true)
    document.addEventListener('submit', block, true)
    window.parent.postMessage({type: 'novaro:preview-ready'}, window.location.origin)
    return () => { window.removeEventListener('message', onMessage); document.removeEventListener('click', block, true); document.removeEventListener('submit', block, true) }
  }, [])
  return <ContentContext value={previewFrame ? {...pages, ...drafts} : pages}>{children}</ContentContext>
}
