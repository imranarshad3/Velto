import { useParams } from 'react-router'
import { ArrowRight, Info } from 'lucide-react'
import ApplicationTile from '../../components/commerce/ApplicationTile.tsx'
import CategoryCard from '../../components/commerce/CategoryCard.tsx'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { applicationDetails, guidanceNote } from '../../data/applications.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { applications } from '../../data/homeContent.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import NotFoundPage from '../NotFound/NotFoundPage.tsx'

export default function ApplicationDetailPage() {
  const { slug } = useParams()
  const { products } = useCatalog()
  const application = applications.find((a) => a.slug === slug)
  const detail = slug ? applicationDetails[slug] : undefined
  if (!application || !detail) return <NotFoundPage />

  const matching = products.filter((p) => p.applications.includes(application.slug))
  const categories = demoCategories.filter((c) => detail.categories.includes(c.slug))
  const others = applications.filter((a) => a.slug !== application.slug).slice(0, 3)

  return (
    <>
      <title>{`${application.name} — Applications — NOVARO`}</title>
      <meta name="description" content={detail.intro} />
      <section aria-labelledby="application-title" className="bg-[#f6f1e9]">
        <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 pt-2 pb-[clamp(2rem,4vw,3.5rem)] md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-center">
          <div>
            <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Applications', to: '/applications' }, { label: application.name }]} />
            <p className="mt-2 text-[0.75rem] font-semibold tracking-[0.16em] text-copper uppercase">Application</p>
            <h1 id="application-title" className="animate-rise mt-1 font-display text-[clamp(2.25rem,1.6rem+2.6vw,3.75rem)] leading-[1.04]">
              {application.name}
            </h1>
            <p className="animate-rise mt-4 max-w-[36rem] text-[clamp(0.9375rem,0.9rem+0.25vw,1.0625rem)] text-muted">{detail.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to={`/products?application=${application.slug}`}>
                Shop {application.name.toLowerCase()} products <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
              <ButtonLink to="/quote" variant="secondary">
                Request a quote
              </ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-sand-deep">
            <Img image={detail.image} priority className="size-full object-cover" />
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-title" className="container-page py-[var(--section-gap)]">
        <SectionHeading id="steps-title" eyebrow="Typical sequence" title="How the work usually goes" />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {detail.steps.map((step, i) => (
            <li key={step.title} className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <span aria-hidden="true" className="font-display text-[2.25rem] leading-none text-copper">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-bold">{step.title}</h3>
              <p className="mt-1 text-[0.9375rem] text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 flex gap-2 text-[0.875rem] text-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> {guidanceNote}
        </p>
      </section>

      <section aria-labelledby="app-categories-title" className="bg-sand py-[var(--section-gap)]">
        <div className="container-page">
          <SectionHeading id="app-categories-title" title="Product categories involved" />
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            {categories.map((category) => (
              <li key={category.slug}>
                <CategoryCard category={category} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {matching.length > 0 && (
        <section aria-labelledby="app-products-title" className="container-page py-[var(--section-gap)]">
          <SectionHeading
            id="app-products-title"
            title={`Products for ${application.name.toLowerCase()}`}
            action={
              <ButtonLink to={`/products?application=${application.slug}`} variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
                View all ({matching.length}) <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            }
          />
          <ul className="mt-8 grid grid-cols-1 gap-4 min-[22rem]:grid-cols-2 lg:grid-cols-4">
            {matching.slice(0, 4).map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="other-apps-title" className="container-page border-t border-border pt-[var(--section-gap)]">
        <SectionHeading id="other-apps-title" title="Other applications" />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((a) => (
            <li key={a.slug}>
              <ApplicationTile application={a} />
            </li>
          ))}
        </ul>
      </section>
      <HelpBanner />
    </>
  )
}
