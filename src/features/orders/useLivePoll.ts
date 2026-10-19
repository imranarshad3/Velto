import { useEffect, useRef, useState } from 'react'

/**
 * Keeps an order view current: refreshes every `intervalMs` while the tab is visible and immediately when it
 * becomes visible again. Polling stops when `enabled` is false (e.g. delivered or cancelled orders).
 * Returns the time of the last successful load, for a "Updated …" indicator.
 */
export function useLivePoll(refresh: () => void, data: unknown, enabled: boolean, intervalMs = 30_000) {
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  })

  useEffect(() => {
    // Records when fresh data arrived; nothing is derived from it during render.
    // oxlint-disable-next-line react/set-state-in-effect
    if (data !== undefined) setUpdatedAt(Date.now())
  }, [data])

  useEffect(() => {
    if (!enabled) return
    const tick = () => document.visibilityState === 'visible' && refreshRef.current()
    const id = window.setInterval(tick, intervalMs)
    const onVisible = () => document.visibilityState === 'visible' && refreshRef.current()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, intervalMs])

  return updatedAt
}

/** "just now", "2 min ago" — re-renders every 15 s. */
export function useRelativeTime(at: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [])
  if (!at) return ''
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 30) return 'just now'
  const m = Math.round(s / 60)
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`
}
