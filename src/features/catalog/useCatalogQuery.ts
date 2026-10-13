import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { CatalogQuery, Facet } from './catalogQuery.ts'
import { parseQuery, toParams } from './catalogQuery.ts'

/** Catalogue state lives in the URL so filtered views are shareable and survive reloads/back navigation. */
export function useCatalogQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => parseQuery(params), [params])

  const update = useCallback(
    (patch: Partial<CatalogQuery>, options: { replace?: boolean } = {}) => {
      const next = { ...query, page: 1, ...patch }
      setParams(toParams(next), { replace: options.replace, preventScrollReset: true })
    },
    [query, setParams],
  )

  const toggle = useCallback(
    (facet: Facet, value: string) => {
      const current = query[facet]
      update({ [facet]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] })
    },
    [query, update],
  )

  const clearFilters = useCallback(() => update({ categories: [], applications: [], areas: [], q: '' }), [update])

  return { query, update, toggle, clearFilters }
}
