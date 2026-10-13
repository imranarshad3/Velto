import { useContentData } from '../../features/cms/context.ts'
import { useContent } from '../../features/cms/context.ts'
import { ArrowRight } from 'lucide-react'
import CategoryCard from '../../components/commerce/CategoryCard.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { demoCategories as defaultdemoCategories } from '../../data/demoCategories.ts'

export default function CategoryPreview() {
  const demoCategories = useContentData('categories', 'Categories.data', defaultdemoCategories)
  const cms = useContent('home', 'CategoryPreview')
  return (
    <section aria-labelledby="categories-title" className="bg-canvas py-[clamp(3rem,6vw,5.5rem)]">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            id="categories-title"
            eyebrow={cms("field-1", "Product range")}
            title={cms("field-2", "Shop by Category")}
            description={cms("field-3", "Explore our range of construction chemical solutions.")}
            action={
              <ButtonLink to={cms("field-4", "/products")} variant="secondary" size="sm">
                <span>
                  {cms("field-5", "View All")}<span className="hidden sm:inline"> {cms("field-6", " Categories")}</span>
                </span>
                <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
              </ButtonLink>
            }
          />
        </Reveal>

        {/* Swipeable snap row on small screens, 4 columns from tablet, 8 on wide desktops. */}
        <ul className="no-scrollbar mt-[var(--heading-gap)] -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-[var(--grid-gap)] overflow-x-auto px-[var(--page-gutter)] pt-1 pb-3 md:mx-0 md:grid md:grid-cols-4 md:gap-[var(--grid-gap-lg)] md:overflow-visible md:p-0 xl:grid-cols-8 xl:gap-3.5">
          {demoCategories.map((category, index) => (
            <Reveal as="li" key={category.slug} delay={Math.min(index, 7) * 0.05} className="w-[44%] min-w-[9.5rem] shrink-0 snap-start sm:w-[30%] md:w-auto md:min-w-0">
              <CategoryCard category={category} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
