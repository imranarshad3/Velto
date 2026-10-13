import { useEffect } from 'react'

const DWELL_MS = 1500
const seen = new Set<string>()

/**
 * Reports one product detail view to the server after a short visible dwell (filters bounces and
 * background prerenders). Counting, dedup and bot filtering happen on the server; this only avoids
 * re-sending within the same page session.
 */
export function useProductViewTracking(slug: string | undefined) {
  useEffect(() => {
    if (!slug || seen.has(slug) || typeof document === 'undefined') return
    let timer: number | undefined
    const send = () => {
      if (document.visibilityState !== 'visible' || seen.has(slug)) return
      seen.add(slug)
      void fetch('/api/track/view', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug }),
        keepalive: true,
        credentials: 'same-origin',
      }).catch(() => undefined)
    }
    const arm = () => {
      window.clearTimeout(timer)
      if (document.visibilityState === 'visible') timer = window.setTimeout(send, DWELL_MS)
    }
    arm()
    document.addEventListener('visibilitychange', arm)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', arm)
    }
  }, [slug])
}
