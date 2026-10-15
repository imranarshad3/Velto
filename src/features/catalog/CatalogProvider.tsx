import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { catalog as bundled, type CatalogProduct } from '../../data/catalog.ts'
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

/**
 * Catalogue source of truth for the app: the published catalogue from `/api/catalog`, with the bundled
 * DEMO list rendered immediately and kept as the fallback when the API is unavailable or unconfigured.
 */
export default function CatalogProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<CatalogProduct[] | null>(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/catalog', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { products?: CatalogProduct[] } | null) => {
        if (Array.isArray(body?.products) && body.products.length) setLive(body.products.map(withDemoPrice))
      })
      .catch(() => {})
      .finally(() => !controller.signal.aborted && setSettled(true))
    return () => controller.abort()
  }, [])

  const value = useMemo<CatalogState>(() => {
    const products = live ?? bundled
    const bySlug = new Map(products.map((p) => [p.slug, p]))
    return { products, source: live ? 'live' : 'demo', status: settled ? 'ready' : 'loading', find: (slug) => (slug ? bySlug.get(slug) : undefined) }
  }, [live, settled])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
