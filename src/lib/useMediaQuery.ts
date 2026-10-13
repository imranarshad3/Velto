import { useSyncExternalStore } from 'react'

/** Subscribes to a CSS media query; false during SSR-less first paint is never observed in this SPA. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
  )
}
