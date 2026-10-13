import { createContext, useContext } from 'react'
import type { CatalogProduct } from '../../data/catalog.ts'

export interface CatalogState {
  products: CatalogProduct[]
  /** `demo` = bundled DEMO catalogue; `live` = verified catalogue served by the API. */
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
