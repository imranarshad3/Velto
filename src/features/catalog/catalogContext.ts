import { createContext, useContext } from 'react'
import type { CatalogProduct } from '../../data/catalog.ts'
import type { Category } from '../../data/demoCategories.ts'

export interface CatalogState {
  products: CatalogProduct[]
  /** Visible categories in admin-defined order (empty until the API or the browser cache answers). */
  categories: Category[]
  /** `demo` = bundled DEMO catalogue (dev-only fallback); `live` = catalogue served by the API. */
  source: 'demo' | 'live'
  status: 'loading' | 'ready'
  find: (slug: string | null | undefined) => CatalogProduct | undefined
}

export const CatalogContext = createContext<CatalogState | null>(null)

export function useCatalog(): CatalogState {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return value
}
