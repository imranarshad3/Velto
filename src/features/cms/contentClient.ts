import type { PageContent } from './types.ts'

const CACHE_KEY = 'velto:cms_published_v2'
const BROADCAST_CHANNEL = 'velto_cms_channel'

interface CachePayload {
  pages: Record<string, PageContent>
  etag?: string
  timestamp: number
}

let inMemoryPages: Record<string, PageContent> | null = null
let inMemoryEtag: string | null = null
let inFlightPromise: Promise<Record<string, PageContent>> | null = null
const listeners = new Set<() => void>()

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Synchronous read from memory or persistent localStorage cache. */
export function getCachedPublishedPages(): Record<string, PageContent> | null {
  if (inMemoryPages) return inMemoryPages
  const storage = getStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (parsed && typeof parsed.pages === 'object' && parsed.pages !== null) {
      inMemoryPages = parsed.pages
      inMemoryEtag = parsed.etag ?? null
      return inMemoryPages
    }
  } catch {
    storage.removeItem(CACHE_KEY)
  }
  return null
}

/** Shared deduplicated fetch with conditional ETag validation and persistent caching. */
export async function fetchPublishedContent(options?: {
  force?: boolean
  signal?: AbortSignal
}): Promise<{ pages: Record<string, PageContent>; updated: boolean }> {
  if (!options?.force && inFlightPromise) {
    const pages = await inFlightPromise
    return { pages, updated: false }
  }

  const runFetch = async (): Promise<Record<string, PageContent>> => {
    getCachedPublishedPages()
    const headers: Record<string, string> = {}
    if (!options?.force && inMemoryEtag) {
      headers['If-None-Match'] = inMemoryEtag
    }

    const res = await fetch('/api/content', {
      headers,
      signal: options?.signal,
    })

    if (res.status === 304 && inMemoryPages) {
      return inMemoryPages
    }

    if (!res.ok) {
      if (inMemoryPages) return inMemoryPages
      throw new Error(`Failed to load content: ${res.status}`)
    }

    const data = (await res.json()) as { pages?: Record<string, PageContent> }
    const pages = data.pages ?? {}
    const etag = res.headers.get('etag') ?? undefined

    inMemoryPages = pages
    inMemoryEtag = etag ?? null

    const storage = getStorage()
    if (storage) {
      try {
        const payload: CachePayload = {
          pages,
          etag,
          timestamp: Date.now(),
        }
        storage.setItem(CACHE_KEY, JSON.stringify(payload))
      } catch {
        // LocalStorage quota or access restrictions
      }
    }

    return pages
  }

  inFlightPromise = runFetch().finally(() => {
    inFlightPromise = null
  })

  const pages = await inFlightPromise
  return { pages, updated: true }
}

export function onPublishedContentChange(callback: () => void): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function notifyPublishedContentChanged() {
  inMemoryPages = null
  inMemoryEtag = null
  const storage = getStorage()
  if (storage) {
    try {
      storage.removeItem(CACHE_KEY)
    } catch {
      // Ignore
    }
  }
  listeners.forEach((fn) => fn())
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL)
      channel.postMessage({ type: 'published_update', timestamp: Date.now() })
      channel.close()
    } catch {
      // BroadcastChannel unsupported or blocked
    }
  }
}

// Subscribe to multi-tab and live publishing updates
if (typeof window !== 'undefined') {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL)
      channel.onmessage = (e) => {
        if (e.data?.type === 'published_update') {
          inMemoryPages = null
          inMemoryEtag = null
          listeners.forEach((fn) => fn())
        }
      }
    } catch {
      // Ignore
    }
  }

  window.addEventListener('storage', (e) => {
    if (e.key === CACHE_KEY) {
      inMemoryPages = null
      inMemoryEtag = null
      listeners.forEach((fn) => fn())
    }
  })

  window.addEventListener('novaro:published', () => {
    notifyPublishedContentChanged()
  })
}

/** Preload published content early on page start. */
export function initCmsPreload() {
  if (typeof window === 'undefined') return
  const isPreview = window.parent !== window && new URLSearchParams(window.location.search).has('cms-preview')
  if (!isPreview) {
    void fetchPublishedContent().catch(() => {})
  }
}
