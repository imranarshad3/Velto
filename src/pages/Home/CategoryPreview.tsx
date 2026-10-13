import { ArrowRight } from 'lucide-react'
import CategoryCard from '../../components/commerce/CategoryCard.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { demoCategories } from '../../data/demoCategories.ts'

export default function CategoryPreview() {
  return (
    <section aria-labelledby="categories-title" className="bg-canvas py-[clamp(2.5rem,5vw,4.5rem)]">
      <div className="container-page">
        <SectionHeading
          id="categories-title"
          title="Shop by Category"
          description="Explore our range of construction chemical solutions."
          action={
            <ButtonLink to="/products" variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
              <span>
                View All<span className="hidden sm:inline"> Categories</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
          }
        />

        {/* Swipeable row on small screens, grid from tablet up. */}
        <ul
          className="no-scrollbar mt-6 -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-3 overflow-x-auto px-[var(--page-gutter)] pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 xl:grid-cols-8"
        >
          {demoCategories.map((category) => (
            <li key={category.slug} className="w-[42%] min-w-[9.5rem] shrink-0 snap-start md:w-auto md:min-w-0">
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
