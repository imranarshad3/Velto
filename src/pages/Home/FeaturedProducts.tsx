import { useContent } from '../../features/cms/context.ts'
import { ArrowRight } from 'lucide-react'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import CardSkeleton from '../../components/commerce/CardSkeleton.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { useCatalog } from '../../features/catalog/catalogContext.ts'

export default function FeaturedProducts() {
  const cms = useContent('home', 'FeaturedProducts')
  const { products, status } = useCatalog()
  const featured = products.filter((product) => product.image).slice(0, 3)
  const loading = status === 'loading' && featured.length === 0
  // Nothing published yet: hide the section rather than show an empty grid.
  if (!loading && featured.length === 0) return null
  return (
    <section aria-labelledby="featured-title" className="bg-surface py-[var(--section-gap)]">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            id="featured-title"
            eyebrow={cms("field-1", "Featured")}
            title={cms("field-2", "Featured Products")}
            description={cms("field-3", "A preview of the product types in our range.")}
            action={
              <ButtonLink to={`${cms("field-4", "/products").split('#')[0]}#product-results`} variant="secondary" size="sm">
                <span>
                  {cms("field-5", "View All")}<span className="hidden sm:inline"> {cms("field-6", " Products")}</span>
                </span>
                <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
              </ButtonLink>
            }
          />
        </Reveal>
        <ul aria-busy={loading || undefined} className="mt-[clamp(1.75rem,3vw,2.75rem)] grid grid-cols-1 gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 md:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
          {loading && [0, 1, 2].map((i) => <li key={i} className="min-w-0"><CardSkeleton /></li>)}
          {featured.map((product, index) => (
            <Reveal as="li" key={product.id} delay={index * 0.08} className="min-w-0">
              <ProductCard product={product} density="roomy" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
