import type { CatalogProduct } from '../../data/catalog.ts'
import type { CatalogQuery, Facet } from '../../features/catalog/catalogQuery.ts'
import { facetCounts, facetOptions } from '../../features/catalog/catalogQuery.ts'

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
  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ facet, legend }) => {
        const counts = facetCounts(products, query, facet)
        return (
          <fieldset key={facet} className="min-w-0">
            <legend className="mb-1 text-[0.9375rem] font-bold text-ink">{legend}</legend>
            <ul>
              {facetOptions[facet].map((option) => {
                const id = `${idPrefix}-${facet}-${option.value}`
                const count = counts.get(option.value) ?? 0
                const checked = query[facet].includes(option.value)
                return (
                  <li key={option.value}>
                    <label
                      htmlFor={id}
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 text-[0.9375rem] hover:bg-sand/60 ${count === 0 && !checked ? 'text-muted/70' : 'text-ink'}`}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(facet, option.value)}
                        className="size-[1.125rem] shrink-0 accent-forest"
                      />
                      <span className="flex-1">{option.label}</span>
                      <span className="text-[0.75rem] text-muted" aria-label={`${count} products`}>
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
