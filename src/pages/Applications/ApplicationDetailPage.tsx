import { useContentData } from '../../features/cms/context.ts'
import { useParams } from 'react-router'
import { Link } from 'react-router'
import { Info } from 'lucide-react'
import CategoryCard from '../../components/commerce/CategoryCard.tsx'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { applicationDetails as defaultapplicationDetails, guidanceNote } from '../../data/applications.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { applications as defaultapplications } from '../../data/homeContent.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import NotFoundPage from '../NotFound/NotFoundPage.tsx'
import ApplicationCard from './ApplicationCard.tsx'

export default function ApplicationDetailPage() {
  const applicationDetails = useContentData('applications', 'ApplicationDetails.data', defaultapplicationDetails)
  const applications = useContentData('applications', 'Applications.data', defaultapplications)
  const { slug } = useParams()
  const { products } = useCatalog()
  const application = applications.find((a) => a.slug === slug)
  const detail = slug ? applicationDetails[slug] : undefined
  if (!application || !detail) return <NotFoundPage />

  const matching = products.filter((p) => p.applications.includes(application.slug))
  const categories = demoCategories.filter((c) => detail.categories.includes(c.slug))
  const others = applications.filter((a) => a.slug !== application.slug).slice(0, 3)

  const Icon = application.icon

  return (
    <>
      <title>{`${application.name} — Shop by Area — VELTO`}</title>
      <meta name="description" content={detail.intro} />
      <section aria-labelledby="application-title" className="relative isolate overflow-hidden border-b border-border/70 bg-cream">
        <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-10 pt-2 pb-[clamp(2.5rem,5vw,4.5rem)] md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-center lg:gap-16">
          <div className="min-w-0">
            <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Shop by Area', to: '/applications' }, { label: application.name }]} />
            <p className="animate-rise mt-4 text-[0.875rem] font-medium text-muted">
              Application
            </p>
            <h1 id="application-title" className="animate-rise mt-2 font-display text-[clamp(2.375rem,1.6rem+2.9vw,3.875rem)] leading-[1.02] tracking-[-0.015em] [--delay:0.05s]">
              {application.name}
            </h1>
            <p className="animate-rise mt-4 max-w-[36rem] text-[clamp(0.9375rem,0.9rem+0.3vw,1.125rem)] leading-relaxed text-muted [--delay:0.1s]">{detail.intro}</p>
            {categories.length > 0 && (
              <div className="animate-rise mt-6 [--delay:0.12s]">
                <p className="text-[0.75rem] font-bold tracking-[0.14em] text-muted uppercase">Products for this job</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const CIcon = c.icon
                    return (
                      <li key={c.slug}>
                        <Link
                          to={`/products?category=${c.slug}#product-results`}
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/80 px-4 text-[0.875rem] font-semibold text-ink shadow-[var(--shadow-soft)] transition-colors hover:border-forest/40 hover:text-forest"
                        >
                          <CIcon aria-hidden="true" className="size-4 text-forest" />
                          {c.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <div className="animate-rise mt-7 flex flex-wrap gap-3 [--delay:0.15s]">
              <ButtonLink to={`/products?application=${application.slug}#product-results`} size="lg">
                Shop {application.name.toLowerCase()} products
              </ButtonLink>
              <ButtonLink to="/quote" variant="secondary" size="lg">
                Ask for a price
              </ButtonLink>
            </div>
          </div>
          <div className="animate-rise relative [--delay:0.1s]">
            <div aria-hidden="true" className="absolute -right-3 -bottom-3 hidden h-3/4 w-3/4 rounded-[var(--radius-panel)] bg-copper-soft sm:block" />
            <div className="relative overflow-hidden rounded-[var(--radius-panel)] bg-sand-deep shadow-[var(--shadow-float)]">
              <Img image={detail.image} priority uncropped />
            </div>
            <span className="glass absolute top-4 left-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-forest shadow-[var(--shadow-soft)]">
              <Icon aria-hidden="true" className="size-4" />
              {application.name}
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-title" className="container-page py-[var(--section-gap)]">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
            <SectionHeading id="steps-title" eyebrow="Typical sequence" title="How the work usually goes" />
            <p className="mt-6 flex gap-3 rounded-[var(--radius-card)] border border-border bg-cream p-4 text-[0.875rem] leading-relaxed text-muted">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-forest" /> {guidanceNote}
            </p>
          </div>
          <ol className="relative">
            {detail.steps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 0.08} className="group relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 pb-8 last:pb-0 sm:gap-x-7">
                {i < detail.steps.length - 1 && (
                  <span aria-hidden="true" className="absolute top-14 bottom-0 left-7 w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,var(--color-copper),var(--color-border))]" />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-10 grid size-14 place-items-center rounded-full border border-forest/25 bg-surface font-display text-[1.375rem] leading-none text-forest tabular-nums shadow-[var(--shadow-soft)] transition-colors duration-300 group-hover:bg-copper group-hover:text-ink"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="surface-card min-w-0 p-5 transition-[box-shadow,border-color] duration-300 group-hover:border-forest/20 group-hover:shadow-[var(--shadow-lift)] sm:p-6">
                  <p className="text-[0.6875rem] font-bold tracking-[0.18em] text-muted uppercase">Step {i + 1}</p>
                  <h3 className="mt-1 font-display text-[1.375rem] leading-tight">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="app-categories-title" className="bg-sand py-[var(--section-gap)]">
        <div className="container-page">
          <SectionHeading id="app-categories-title" eyebrow="Shop by category" title="Product types" />
          <ul className="mt-[var(--heading-gap)] grid grid-cols-2 gap-[var(--grid-gap)] md:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
            {categories.map((category, i) => (
              <Reveal as="li" key={category.slug} delay={i * 0.08}>
                <CategoryCard category={category} presentation="editorial" />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {matching.length > 0 && (
        <section aria-labelledby="app-products-title" className="container-page py-[var(--section-gap)]">
          <SectionHeading
            id="app-products-title"
            eyebrow="Matching products"
            title={`Products for ${application.name.toLowerCase()}`}
            action={
              <ButtonLink to={`/products?application=${application.slug}#product-results`} variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
                View all ({matching.length})
              </ButtonLink>
            }
          />
          <ul className="mt-[var(--heading-gap)] grid grid-cols-1 gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 lg:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
            {matching.slice(0, 3).map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="border-t border-border bg-cream">
      <section aria-labelledby="other-apps-title" className="pt-[var(--section-gap)]">
        <div className="container-page">
          <SectionHeading
            id="other-apps-title"
            eyebrow="Keep exploring"
            title="Other applications"
            action={
              <ButtonLink to="/applications" variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
                All applications
              </ButtonLink>
            }
          />
          <ul className="no-scrollbar -mx-[var(--page-gutter)] mt-[var(--heading-gap)] flex snap-x snap-mandatory gap-[var(--grid-gap)] overflow-x-auto px-[var(--page-gutter)] pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:gap-[var(--grid-gap-lg)]">
            {others.map((a) => (
              <li key={a.slug} className="w-[min(18rem,78vw)] shrink-0 snap-start md:w-auto">
                <ApplicationCard application={a} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <HelpBanner />
      </div>
    </>
  )
}
