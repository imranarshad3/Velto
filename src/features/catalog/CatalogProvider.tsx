import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { catalog as bundled, type CatalogProduct } from '../../data/catalog.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { toDisplayCategory } from './categories.ts'
import type { StoreCategory } from './categorySchema.ts'
import { CatalogContext, type CatalogState } from './catalogContext.ts'

const bundledDemoPrices = new Map(bundled.flatMap((p) => (p.demoPrice ? [[p.slug, p.demoPrice] as const] : [])))
const bundledImages = new Map(bundled.map((p) => [p.slug, p.image]))

/** Seeded DEMO rows keep their labelled, display-only DEMO price until a verified price is set by an admin. */
const withDemoPrice = (product: CatalogProduct): CatalogProduct => {
  const demoPrice = !product.verified && !product.price ? bundledDemoPrices.get(product.slug) : undefined
  const legacyImage = !product.image || /^\/images\/products\/concept-pack-0[1-4]\.webp$/.test(product.image.src)
  const image = !product.verified && legacyImage ? bundledImages.get(product.slug) ?? product.image : product.image
  return { ...product, image, ...(demoPrice ? { demoPrice } : {}) }
}

interface Snapshot {
  products: CatalogProduct[]
  categories: StoreCategory[]
}

const CACHE_KEY = 'velto:catalog_v1'

/** Last published catalogue from this browser, so repeat visits render real products on the first frame. */
function readCache(): Snapshot | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Snapshot | null
    return parsed && Array.isArray(parsed.products) && Array.isArray(parsed.categories) ? parsed : null
  } catch {
    return null
  }
}

/** Started at module load (before React renders) and shared by every mount, including StrictMode re-runs. */
const request: Promise<Snapshot | null> | null =
  typeof window === 'undefined'
    ? null
    : fetch('/api/catalog')
        .then((r) => (r.ok ? r.json() : null))
        .then((body: Partial<Snapshot> | null) => {
          if (!Array.isArray(body?.products)) return null
          const snapshot = { products: body.products, categories: Array.isArray(body.categories) ? body.categories : [] }
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot))
          } catch {
            // Storage full or blocked: the catalogue still renders from memory.
          }
          return snapshot
        })
        .catch(() => null)

/**
 * Catalogue source of truth for the app: the published catalogue from `/api/catalog` only.
 * Production never shows the bundled DEMO list; `vite dev` falls back to it when the API is unavailable.
 */
export default function CatalogProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(readCache)
  const [fallback, setFallback] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    let active = true
    void request?.then((fresh) => {
      if (!active) return
      if (fresh) setSnapshot(fresh)
      else if (import.meta.env.DEV && !readCache()) setFallback(true)
      setSettled(true)
    })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<CatalogState>(() => {
    const live = fallback ? null : snapshot
    const products = live ? live.products.map(withDemoPrice) : fallback ? bundled : []
    const bySlug = new Map(products.map((p) => [p.slug, p]))
    const categories = live ? live.categories.map(toDisplayCategory) : fallback ? demoCategories : []
    return { products, categories, source: fallback ? 'demo' : 'live', status: settled ? 'ready' : 'loading', find: (slug) => (slug ? bySlug.get(slug) : undefined) }
  }, [snapshot, fallback, settled])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
