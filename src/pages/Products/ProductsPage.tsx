import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { LayoutGrid, LayoutList, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import DemoNotice from '../../components/ui/DemoNotice.tsx'
import Drawer from '../../components/ui/Drawer.tsx'
import Pagination from '../../components/ui/Pagination.tsx'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import type { Facet, SortKey } from '../../features/catalog/catalogQuery.ts'
import { activeFilterCount, facetOptions, filterAndSort, PAGE_SIZE, sortOptions } from '../../features/catalog/catalogQuery.ts'
import { useCatalogQuery } from '../../features/catalog/useCatalogQuery.ts'
import CategoryNav from './CategoryNav.tsx'
import FilterPanel from './FilterPanel.tsx'
import ProductsAssistance from './ProductsAssistance.tsx'
import ProductsHero from './ProductsHero.tsx'

const optionLabel = (facet: Facet, value: string) => facetOptions[facet].find((o) => o.value === value)?.label ?? value

export default function ProductsPage() {
  const { query, update, toggle, clearFilters } = useCatalogQuery()
  const { products: catalog } = useCatalog()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const resultsRef = useRef<HTMLHeadingElement>(null)

  const results = useMemo(() => filterAndSort(catalog, query), [catalog, query])
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(query.page, pageCount)
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const filterCount = activeFilterCount(query)
  const from = results.length ? (page - 1) * PAGE_SIZE + 1 : 0
  const to = Math.min(page * PAGE_SIZE, results.length)

  const goToPage = (next: number) => {
    update({ page: next })
    resultsRef.current?.scrollIntoView({ block: 'start' })
    resultsRef.current?.focus({ preventScroll: true })
  }

  const chips = (['categories', 'applications', 'areas'] as Facet[]).flatMap((facet) =>
    query[facet].map((value) => ({ facet, value, label: optionLabel(facet, value) })),
  )

  const filterPanel = (prefix: string) => <FilterPanel idPrefix={prefix} products={catalog} query={query} onToggle={toggle} />

  return (
    <>
      <title>Products — NOVARO</title>
      <ProductsHero />
      <CategoryNav query={query} />

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[clamp(1.5rem,3vw,2.5rem)] lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:gap-10 min-[90rem]:container-wide">
        <aside aria-labelledby="filters-title" className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-height)+1rem)] max-h-[calc(100dvh-var(--header-height)-2rem)] overflow-y-auto rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 id="filters-title" className="flex items-center gap-2 font-display text-[1.375rem]">
                Filters
                {filterCount > 0 && (
                  <span className="rounded-full bg-forest px-2 font-sans text-[0.75rem] leading-[1.6] font-bold text-white">
                    {filterCount}
                    <span className="sr-only"> active</span>
                  </span>
                )}
              </h2>
              {filterCount > 0 && (
                <button type="button" onClick={clearFilters} className="min-h-11 px-1 text-[0.8125rem] font-semibold text-copper underline-offset-2 hover:underline">
                  Clear all
                </button>
              )}
            </div>
            {filterPanel('side')}
          </div>
        </aside>

        <section aria-labelledby="results-title" className="min-w-0">
          <h2 id="results-title" ref={resultsRef} tabIndex={-1} className="sr-only scroll-mt-[calc(var(--header-height)+1rem)]">
            Product results
          </h2>

          <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(0.875rem,2vw,1.25rem)] shadow-[0_0.0625rem_0.125rem_rgb(23_28_25/0.04)]">
            <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-1.5">
              <label htmlFor="product-search" className="text-[0.8125rem] font-semibold text-ink">
                Search products
              </label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[1.125rem] -translate-y-1/2 text-muted" />
                <input
                  id="product-search"
                  type="search"
                  value={query.q}
                  onChange={(e) => update({ q: e.target.value }, { replace: true })}
                  placeholder="e.g. tile adhesive, roof waterproofing"
                  autoComplete="off"
                  className="min-h-12 w-full rounded-lg border border-border bg-canvas pr-12 pl-11 text-[1rem] transition-colors placeholder:text-muted/70 focus:border-forest focus:bg-surface focus:outline-none focus-visible:outline-[0.1875rem] focus-visible:outline-copper [&::-webkit-search-cancel-button]:hidden"
                />
                {query.q && (
                  <button
                    type="button"
                    onClick={() => update({ q: '' }, { replace: true })}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-0.5 grid size-11 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-forest"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                )}
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
              <p className="mr-auto flex flex-wrap items-center gap-x-2 text-[0.9375rem] text-muted" aria-live="polite">
                {results.length > 0 ? (
                  <>
                    Showing{' '}
                    <span className="font-bold text-ink tabular-nums">
                      {from}–{to}
                    </span>{' '}
                    of <span className="font-bold text-ink tabular-nums">{results.length}</span> {results.length === 1 ? 'product' : 'products'}
                  </>
                ) : (
                  <span className="font-semibold text-ink">No products found</span>
                )}
                <span className="rounded-full bg-sand px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.08em] text-muted">DEMO</span>
              </p>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-haspopup="dialog"
                aria-controls="filter-drawer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[0.875rem] font-semibold hover:border-forest lg:hidden"
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                Filters{filterCount > 0 && <span className="rounded-full bg-forest px-1.5 text-[0.75rem] text-white">{filterCount}</span>}
              </button>
              <div className="flex items-center gap-2">
                <label htmlFor="product-sort" className="text-[0.8125rem] text-muted">
                  Sort by
                </label>
                <select
                  id="product-sort"
                  value={query.sort}
                  onChange={(e) => update({ sort: e.target.value as SortKey })}
                  className="min-h-11 rounded-lg border border-border bg-surface px-3 text-[0.875rem] font-semibold accent-forest"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div role="group" aria-label="View" className="flex rounded-lg border border-border bg-surface p-0.5">
                {(
                  [
                    ['grid', 'Grid view', LayoutGrid],
                    ['list', 'List view', LayoutList],
                  ] as const
                ).map(([mode, label, Icon]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-label={label}
                    aria-pressed={query.view === mode}
                    onClick={() => update({ view: mode, page })}
                    className={`grid size-11 place-items-center rounded-md transition-colors ${query.view === mode ? 'bg-forest text-white' : 'text-muted hover:text-forest'}`}
                  >
                    <Icon aria-hidden="true" className="size-[1.125rem]" />
                  </button>
                ))}
              </div>
            </div>

            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Active filters">
                {chips.map((chip) => (
                  <li key={`${chip.facet}-${chip.value}`}>
                    <button
                      type="button"
                      onClick={() => toggle(chip.facet, chip.value)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-forest/25 bg-forest-soft px-3 text-[0.8125rem] font-semibold text-forest hover:border-forest"
                      aria-label={`Remove filter: ${chip.label}`}
                    >
                      {chip.label}
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center px-2 text-[0.8125rem] font-semibold text-copper hover:underline">
                    Clear all
                  </button>
                </li>
              </ul>
            )}
          </div>

          {visible.length > 0 ? (
            <>
              <ul
                key={`${query.view}-${page}`}
                className={`mt-6 grid gap-[clamp(0.75rem,1.6vw,1.25rem)] ${query.view === 'list' ? 'grid-cols-1' : 'grid-cols-1 min-[22rem]:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 min-[90rem]:gap-6 min-[112.5rem]:grid-cols-4'}`}
              >
                {visible.map((product, i) => (
                  <li key={product.id} className="animate-rise" style={{ '--delay': `${Math.min(i, 8) * 0.04}s` } as CSSProperties}>
                    <ProductCard product={product} layout={query.view} density="roomy" />
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-[0.875rem] text-muted">
                  Showing {from}–{to} of {results.length}
                </p>
                <Pagination page={page} pageCount={pageCount} onChange={goToPage} />
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-14 text-center">
              <SearchX aria-hidden="true" className="size-10 text-muted" />
              <h3 className="mt-4 font-display text-[1.5rem]">No products match</h3>
              <p className="mt-2 max-w-[26rem] text-[0.9375rem] text-muted">Try a different search term or remove some filters.</p>
              <button type="button" onClick={clearFilters} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-forest px-5 font-semibold text-white hover:bg-forest-dark">
                Clear search & filters
              </button>
            </div>
          )}

          <div className="mt-6">
            <DemoNotice>
              DEMO catalogue: entries are generic product types. Images are illustrative concepts or placeholders, not
              official ULTRA product photographs. Prices marked DEMO are illustrative only; confirmed pricing and
              availability are provided with your quote.
            </DemoNotice>
          </div>
        </section>
      </div>

      <ProductsAssistance />

      <Drawer
        id="filter-drawer"
        title="Filters"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={clearFilters} disabled={filterCount === 0} className="min-h-11 flex-1 rounded-lg border border-border font-semibold disabled:opacity-40">
              Clear all
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)} className="min-h-11 flex-[2] rounded-lg bg-forest font-semibold text-white">
              Show {results.length} {results.length === 1 ? 'product' : 'products'}
            </button>
          </div>
        }
      >
        {filterPanel('drawer')}
      </Drawer>
    </>
  )
}
