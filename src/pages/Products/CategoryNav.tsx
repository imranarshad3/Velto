import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { LayoutGrid } from 'lucide-react'
import CategoryCard from '../../components/commerce/CategoryCard.tsx'
import type { Category } from '../../data/demoCategories.ts'
import type { CatalogQuery } from '../../features/catalog/catalogQuery.ts'
import { toParams } from '../../features/catalog/catalogQuery.ts'

const allProducts: Category = {
  slug: 'all',
  name: 'All Products',
  icon: LayoutGrid,
  texture: 'tile',
  image: { src: '/images/categories/all-products.webp', alt: '', width: 1122, height: 1402 },
}

export default function CategoryNav({ query }: { query: CatalogQuery }) {
  const { categories } = useCatalog()
  const href = (categories: string[]) => {
    const params = toParams({ ...query, categories, page: 1 }).toString()
    return `/products${params ? `?${params}` : ''}`
  }
  const single = query.categories.length === 1 ? query.categories[0] : null

  return (
    <nav
      aria-label="Product categories"
      className="container-page min-[90rem]:container-wide relative z-10 pt-[clamp(1.5rem,3vw,2.5rem)] md:-mt-[clamp(4.5rem,8vw,6.5rem)] md:pt-0"
    >
      <div className="md:rounded-[var(--radius-panel)] md:border md:border-white/70 md:bg-surface/80 md:p-[clamp(0.875rem,1.4vw,1.25rem)] md:shadow-[var(--shadow-float)] md:backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between gap-3 md:mb-4 md:px-1">
          <p className="text-[0.875rem] font-medium text-muted">
            Browse by category
          </p>
          <span className="text-[0.75rem] text-muted md:hidden" aria-hidden="true">
            Swipe
          </span>
        </div>
        <ul className="no-scrollbar -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-[var(--grid-gap)] overflow-x-auto px-[var(--page-gutter)] pt-1 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-9">
          {[allProducts, ...categories].map((category) => (
            <li key={category.slug} className="w-[38%] min-w-[8.5rem] shrink-0 snap-start md:w-auto md:min-w-0">
              <CategoryCard
                category={category}
                to={href(category === allProducts ? [] : [category.slug])}
                active={category === allProducts ? query.categories.length === 0 : single === category.slug}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
