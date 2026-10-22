import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { ChevronDown, LayoutGrid, LayoutList, RotateCcw, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import CardSkeleton from '../../components/commerce/CardSkeleton.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import { buttonClass } from '../../components/ui/button.ts'
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
  const { products: catalog, status } = useCatalog()
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
      <title>Products — VELTO</title>
      <ProductsHero />
      <CategoryNav query={query} />

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[clamp(1.75rem,3.5vw,3rem)] lg:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-10 min-[90rem]:container-wide">
        <aside aria-labelledby="filters-title" className="hidden lg:block">
          <div className="no-scrollbar sticky top-[calc(var(--header-height)+1rem)] max-h-[calc(100dvh-var(--header-height)-2rem)] overflow-y-auto rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-soft)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-surface/95 px-5 py-4 backdrop-blur-md">
              <h2 id="filters-title" className="flex items-center gap-2.5 font-display text-[1.5rem] leading-none">
                <span className="grid size-9 place-items-center rounded-xl bg-forest-soft text-forest">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                </span>
                Filters
                {filterCount > 0 && (
                  <span className="rounded-full bg-forest px-2 font-sans text-[0.75rem] leading-[1.6] font-bold text-white">
                    {filterCount}
                    <span className="sr-only"> active</span>
                  </span>
                )}
              </h2>
              {filterCount > 0 && (
                <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-1 px-1 text-[0.8125rem] font-semibold text-forest underline-offset-2 hover:underline">
                  <RotateCcw aria-hidden="true" className="size-3.5" />
                  Clear all
                </button>
              )}
            </div>
            <div className="p-5">{filterPanel('side')}</div>
          </div>
        </aside>

        <section id="product-results" aria-labelledby="results-title" className="min-w-0 scroll-mt-[calc(var(--header-height)+1rem)]">
          <h2 id="results-title" ref={resultsRef} tabIndex={-1} className="sr-only scroll-mt-[calc(var(--header-height)+1rem)]">
            Product results
          </h2>

          <div className="relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface p-[clamp(1rem,2vw,1.5rem)] shadow-[var(--shadow-card)]">
            <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
              <label htmlFor="product-search" className="text-[0.875rem] font-medium text-muted">
                Search products
              </label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-forest/70" />
                <input
                  id="product-search"
                  type="search"
                  value={query.q}
                  onChange={(e) => update({ q: e.target.value }, { replace: true })}
                  placeholder="e.g. tile adhesive, roof waterproofing"
                  autoComplete="off"
                  className="min-h-[3.25rem] w-full rounded-xl border border-border bg-canvas pr-12 pl-12 text-[1rem] transition-[border-color,background-color,box-shadow] duration-300 placeholder:text-muted/70 hover:border-ink/20 focus:border-forest focus:bg-surface focus:shadow-[0_0_0_0.25rem_rgb(41_76_104/0.08)] focus:outline-none focus-visible:outline-[0.1875rem] focus-visible:outline-forest [&::-webkit-search-cancel-button]:hidden"
                />
                {query.q && (
                  <button
                    type="button"
                    onClick={() => update({ q: '' }, { replace: true })}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-sand hover:text-forest"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                )}
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-border pt-4">
              <p className="mr-auto flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] text-muted" aria-live="polite">
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
              </p>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-haspopup="dialog"
                aria-controls="filter-drawer"
                className={buttonClass('secondary', 'sm', 'lg:hidden')}
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                Filters{filterCount > 0 && <span className="rounded-full bg-forest px-1.5 text-[0.75rem] text-white">{filterCount}</span>}
              </button>
              <div className="flex items-center gap-2">
                <label htmlFor="product-sort" className="text-[0.8125rem] whitespace-nowrap text-muted">
                  Sort by
                </label>
                <div className="relative">
                  <select
                    id="product-sort"
                    value={query.sort}
                    onChange={(e) => update({ sort: e.target.value as SortKey })}
                    className="min-h-11 cursor-pointer appearance-none rounded-xl border border-border bg-surface pr-9 pl-3.5 text-[0.875rem] font-semibold text-ink shadow-[var(--shadow-soft)] transition-colors hover:border-forest/40"
                  >
                    {sortOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                </div>
              </div>
              <div role="group" aria-label="View" className="flex rounded-xl border border-border bg-canvas p-1">
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
                    className={`grid size-11 place-items-center rounded-lg transition-[background-color,color,box-shadow] duration-300 ${query.view === mode ? 'bg-forest text-white shadow-[var(--shadow-button)]' : 'text-muted hover:bg-surface hover:text-forest'}`}
                  >
                    <Icon aria-hidden="true" className="size-[1.125rem]" />
                  </button>
                ))}
              </div>
            </div>

            {chips.length > 0 && (
              <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
                {chips.map((chip) => (
                  <li key={`${chip.facet}-${chip.value}`}>
                    <button
                      type="button"
                      onClick={() => toggle(chip.facet, chip.value)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-forest/20 bg-forest-soft pr-2.5 pl-3.5 text-[0.8125rem] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-white"
                      aria-label={`Remove filter: ${chip.label}`}
                    >
                      {chip.label}
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center px-2 text-[0.8125rem] font-semibold text-forest underline-offset-2 hover:underline">
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
                className={`mt-[var(--heading-gap)] grid gap-[var(--grid-gap)] ${query.view === 'list' ? 'grid-cols-1' : 'grid-cols-1 min-[30rem]:grid-cols-2 min-[90rem]:gap-[var(--grid-gap-lg)] min-[100rem]:grid-cols-3'}`}
              >
                {visible.map((product, i) => (
                  <li key={product.id} className="animate-rise" style={{ '--delay': `${Math.min(i, 8) * 0.04}s` } as CSSProperties}>
                    <ProductCard product={product} layout={query.view} />
                  </li>
                ))}
              </ul>
              <div className="mt-[var(--heading-gap)] flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
                <p className="text-[0.875rem] text-muted">
                  Showing{' '}
                  <span className="font-semibold text-ink tabular-nums">
                    {from}–{to}
                  </span>{' '}
                  of <span className="font-semibold text-ink tabular-nums">{results.length}</span>
                </p>
                <Pagination page={page} pageCount={pageCount} onChange={goToPage} />
              </div>
            </>
          ) : status === 'loading' && catalog.length === 0 ? (
            <ul aria-busy="true" aria-label="Loading products" className="mt-[var(--heading-gap)] grid grid-cols-1 gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 min-[90rem]:gap-[var(--grid-gap-lg)] min-[100rem]:grid-cols-3">
              {[0, 1, 2, 3].map((i) => <li key={i}><CardSkeleton /></li>)}
            </ul>
          ) : catalog.length === 0 ? (
            <div className="mt-[var(--heading-gap)]">
              <EmptyState icon={SearchX} title="No products published yet">
                Products are being added. Ask us for a price and we’ll help with your project.
              </EmptyState>
            </div>
          ) : (
            <div className="mt-[var(--heading-gap)]">
              <EmptyState
                icon={SearchX}
                title="No products match"
                actions={
                  <button type="button" onClick={clearFilters} className={buttonClass('primary', 'md', 'px-6')}>
                    <RotateCcw aria-hidden="true" className="size-4" />
                    Clear search & filters
                  </button>
                }
              >
                Try a different search term or remove some filters.
              </EmptyState>
            </div>
          )}

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
            <button type="button" onClick={clearFilters} disabled={filterCount === 0} className={buttonClass('secondary', 'md', 'flex-1')}>
              Clear all
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)} className={buttonClass('primary', 'md', 'flex-[2]')}>
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
