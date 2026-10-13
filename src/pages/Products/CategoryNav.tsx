import { LayoutGrid } from 'lucide-react'
import CategoryCard from '../../components/commerce/CategoryCard.tsx'
import type { Category } from '../../data/demoCategories.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import type { CatalogQuery } from '../../features/catalog/catalogQuery.ts'
import { toParams } from '../../features/catalog/catalogQuery.ts'

const allProducts: Category = {
  slug: 'all',
  name: 'All Products',
  icon: LayoutGrid,
  texture: 'tile',
  image: { src: '/images/hero/concept-products.webp', alt: '', width: 504, height: 234 },
}

export default function CategoryNav({ query }: { query: CatalogQuery }) {
  const href = (categories: string[]) => {
    const params = toParams({ ...query, categories, page: 1 }).toString()
    return `/products${params ? `?${params}` : ''}`
  }
  const single = query.categories.length === 1 ? query.categories[0] : null

  return (
    <nav aria-label="Product categories" className="container-page min-[90rem]:container-wide pt-[clamp(1.5rem,3vw,2.5rem)]">
      <ul className="no-scrollbar -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-3 overflow-x-auto px-[var(--page-gutter)] pt-1 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 xl:grid-cols-9">
        {[allProducts, ...demoCategories].map((category) => (
          <li key={category.slug} className="w-[38%] min-w-[8.5rem] shrink-0 snap-start md:w-auto md:min-w-0">
            <CategoryCard
              category={category}
              to={href(category === allProducts ? [] : [category.slug])}
              active={category === allProducts ? query.categories.length === 0 : single === category.slug}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}
