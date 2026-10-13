import type { Area, CatalogProduct } from '../../data/catalog.ts'
import { areaLabels } from '../../data/catalog.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { applications } from '../../data/homeContent.ts'
import { sortableAmount } from './price.ts'

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'category'
export type ViewMode = 'grid' | 'list'
export type Facet = 'categories' | 'applications' | 'areas'

export interface CatalogQuery {
  q: string
  categories: string[]
  applications: string[]
  areas: string[]
  sort: SortKey
  view: ViewMode
  page: number
}

export const PAGE_SIZE = 12

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'category', label: 'Category' },
]

export const facetOptions: Record<Facet, { value: string; label: string }[]> = {
  categories: demoCategories.map((c) => ({ value: c.slug, label: c.name })),
  applications: applications.map((a) => ({ value: a.slug, label: a.name })),
  areas: (Object.keys(areaLabels) as Area[]).map((a) => ({ value: a, label: areaLabels[a] })),
}

/** URL param name for each facet. `category` matches the homepage category links. */
export const facetParam: Record<Facet, string> = { categories: 'category', applications: 'application', areas: 'area' }

const isSortKey = (value: string | null): value is SortKey => sortOptions.some((o) => o.value === value)

const list = (params: URLSearchParams, key: string, facet: Facet) => {
  const allowed = new Set(facetOptions[facet].map((o) => o.value))
  return (params.get(key) ?? '').split(',').filter((v) => allowed.has(v))
}

export function parseQuery(params: URLSearchParams): CatalogQuery {
  const sort = params.get('sort')
  const page = Number.parseInt(params.get('page') ?? '1', 10)
  return {
    q: params.get('q') ?? '',
    categories: list(params, facetParam.categories, 'categories'),
    applications: list(params, facetParam.applications, 'applications'),
    areas: list(params, facetParam.areas, 'areas'),
    sort: isSortKey(sort) ? sort : 'featured',
    view: params.get('view') === 'list' ? 'list' : 'grid',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

/** Serialises only non-default values to keep URLs short and shareable. */
export function toParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q.trim()) params.set('q', query.q)
  for (const facet of Object.keys(facetParam) as Facet[]) {
    if (query[facet].length) params.set(facetParam[facet], query[facet].join(','))
  }
  if (query.sort !== 'featured') params.set('sort', query.sort)
  if (query.view !== 'grid') params.set('view', query.view)
  if (query.page > 1) params.set('page', String(query.page))
  return params
}

const categoryName = new Map(demoCategories.map((c) => [c.slug, c.name]))
const applicationName = new Map(applications.map((a) => [a.slug, a.name]))

function matchesSearch(product: CatalogProduct, q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return true
  const haystack = [
    product.name,
    product.usage,
    categoryName.get(product.categorySlug),
    ...product.applications.map((a) => applicationName.get(a)),
  ]
    .join(' ')
    .toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

const facetValues = (product: CatalogProduct, facet: Facet): string[] =>
  facet === 'categories' ? [product.categorySlug] : facet === 'applications' ? product.applications : product.areas

function matches(product: CatalogProduct, query: CatalogQuery, skip?: Facet) {
  if (!matchesSearch(product, query.q)) return false
  return (Object.keys(facetParam) as Facet[]).every(
    (facet) => facet === skip || !query[facet].length || facetValues(product, facet).some((v) => query[facet].includes(v)),
  )
}

const categoryOrder = new Map(demoCategories.map((c, i) => [c.slug, i]))

export function filterAndSort(products: CatalogProduct[], query: CatalogQuery): CatalogProduct[] {
  const result = products.filter((p) => matches(p, query))
  switch (query.sort) {
    case 'price-asc':
    case 'price-desc': {
      const dir = query.sort === 'price-asc' ? 1 : -1
      // Unpriced products always sort last, whichever direction.
      return result.sort((a, b) => {
        const x = sortableAmount(a)
        const y = sortableAmount(b)
        if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1
        return (x - y) * dir
      })
    }
    case 'name-asc':
      return result.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return result.sort((a, b) => b.name.localeCompare(a.name))
    case 'category':
      return result.sort(
        (a, b) => (categoryOrder.get(a.categorySlug) ?? 0) - (categoryOrder.get(b.categorySlug) ?? 0) || a.name.localeCompare(b.name),
      )
    default:
      return result
  }
}

/** Option counts for a facet, applying every other active filter (standard faceted-search behaviour). */
export function facetCounts(products: CatalogProduct[], query: CatalogQuery, facet: Facet): Map<string, number> {
  const counts = new Map<string, number>()
  for (const product of products) {
    if (!matches(product, query, facet)) continue
    for (const value of facetValues(product, facet)) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return counts
}

export const activeFilterCount = (query: CatalogQuery) =>
  query.categories.length + query.applications.length + query.areas.length
