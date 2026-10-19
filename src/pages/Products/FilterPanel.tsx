import { Check } from 'lucide-react'
import type { CatalogProduct } from '../../data/catalog.ts'
import type { CatalogQuery, Facet } from '../../features/catalog/catalogQuery.ts'
import { facetCounts, facetOptions, productCategories } from '../../features/catalog/catalogQuery.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'

interface FilterPanelProps {
  idPrefix: string
  products: CatalogProduct[]
  query: CatalogQuery
  onToggle: (facet: Facet, value: string) => void
}

const groups: { facet: Facet; legend: string }[] = [
  { facet: 'categories', legend: 'Category' },
  { facet: 'applications', legend: 'Application' },
  { facet: 'areas', legend: 'Use area' },
]

export default function FilterPanel({ idPrefix, products, query, onToggle }: FilterPanelProps) {
  const { categories } = useCatalog()
  return (
    <div className="flex flex-col divide-y divide-border">
      {groups.map(({ facet, legend }) => {
        const counts = facetCounts(products, query, facet)
        return (
          <fieldset key={facet} className="min-w-0 py-5 first:pt-0 last:pb-0">
            <legend className="mb-2 flex items-center gap-2.5 text-[0.6875rem] font-bold tracking-[0.18em] text-copper uppercase">
              <span aria-hidden="true" className="h-px w-5 bg-copper/60" />
              {legend}
            </legend>
            <ul className="flex flex-col gap-0.5">
              {(facet === 'categories' ? productCategories(products, categories) : facetOptions[facet]).map((option) => {
                const id = `${idPrefix}-${facet}-${option.value}`
                const count = counts.get(option.value) ?? 0
                const checked = query[facet].includes(option.value)
                const dim = count === 0 && !checked
                return (
                  <li key={option.value}>
                    <label
                      htmlFor={id}
                      className={`group/opt flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2.5 text-[0.9375rem] transition-colors duration-200 ${checked ? 'bg-forest-soft/80 font-semibold text-forest' : dim ? 'text-muted hover:bg-sand/60' : 'text-ink hover:bg-sand/60'}`}
                    >
                      <span className="relative grid size-5 shrink-0 place-items-center">
                        <input
                          id={id}
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(facet, option.value)}
                          className="peer size-5 cursor-pointer appearance-none rounded-md border border-ink/25 bg-surface transition-[background-color,border-color] duration-200 group-hover/opt:border-forest/60 checked:border-forest checked:bg-forest focus-visible:outline-[0.1875rem] focus-visible:outline-offset-2 focus-visible:outline-copper"
                        />
                        <Check
                          aria-hidden="true"
                          strokeWidth={3}
                          className="pointer-events-none absolute size-3.5 scale-50 text-white opacity-0 transition-[opacity,transform] duration-200 peer-checked:scale-100 peer-checked:opacity-100"
                        />
                      </span>
                      <span className="min-w-0 flex-1">{option.label}</span>
                      <span
                        className={`min-w-7 rounded-full px-2 py-0.5 text-center text-[0.6875rem] font-bold tabular-nums ${checked ? 'bg-forest text-white' : 'bg-sand text-muted'}`}
                        aria-label={`${count} products`}
                      >
                        {count}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        )
      })}
    </div>
  )
}
