import { ArrowRight } from 'lucide-react'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import DemoNotice from '../../components/ui/DemoNotice.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { useCatalog } from '../../features/catalog/catalogContext.ts'

export default function FeaturedProducts() {
  const { products } = useCatalog()
  const featured = products.filter((product) => product.image).slice(0, 4)
  return (
    <section aria-labelledby="featured-title" className="py-[var(--section-gap)]">
      <div className="container-page">
        <SectionHeading
          id="featured-title"
          title="Featured Products"
          description="A preview of the product types in our range."
          action={
            <ButtonLink to="/products" variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
              <span>
                View All<span className="hidden sm:inline"> Products</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
          }
        />
        <ul className="mt-8 grid grid-cols-1 gap-4 min-[22rem]:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {featured.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <DemoNotice>
            DEMO preview: product images are illustrative concepts, not official ULTRA product photographs. Names,
            pricing and availability will be published once verified.
          </DemoNotice>
        </div>
      </div>
    </section>
  )
}
