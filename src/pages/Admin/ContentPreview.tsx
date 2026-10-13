import { useEffect, useRef, useState } from 'react'
import type { PageContent } from '../../features/cms/types.ts'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'
/** CSS-pixel viewport widths; desktop fills the pane but never renders narrower than a laptop. */
const deviceWidth = { mobile: 390, tablet: 768, desktop: 1280 } as const

/**
 * Renders the real storefront route in a same-origin iframe so media queries see a true device viewport.
 * The unsaved draft is sent by postMessage; the frame never reloads while editing, so its scroll position is kept.
 */
export default function ContentPreview({ slug, path, content, device, interactive = true }: { slug: string; path: string; content: PageContent; device: PreviewDevice; interactive?: boolean }) {
  const box = useRef<HTMLDivElement>(null), frame = useRef<HTMLIFrameElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const send = () => frame.current?.contentWindow?.postMessage({ type: 'novaro:preview', slug, content }, window.location.origin)
    send()
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === 'novaro:preview-ready') send()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [slug, content])

  const width = device === 'desktop' ? Math.max(deviceWidth.desktop, size.w) : deviceWidth[device]
  const scale = size.w ? Math.min(1, size.w / width) : 1
  const framed = device !== 'desktop' && scale === 1
  return (
    <div ref={box} className="relative size-full overflow-hidden">
      {size.w > 0 && (
        <iframe
          ref={frame}
          title="Live storefront preview"
          src={`${path}?cms-preview=1`}
          className={`absolute top-0 border-0 bg-canvas transition-[left,width] duration-300 ease-out motion-reduce:transition-none ${framed ? 'rounded-2xl shadow-[var(--shadow-float)] ring-1 ring-border' : ''} ${interactive ? '' : 'pointer-events-none'}`}
          style={{ width, height: size.h / scale, left: (size.w - width * scale) / 2, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        />
      )}
    </div>
  )
}
