import { useContent } from '../../features/cms/context.ts'
import { Link } from 'react-router'
import { ArrowRight, BookOpen, ClipboardList, Compass, LayoutGrid } from 'lucide-react'
import CategoryCard from '../../components/commerce/CategoryCard.tsx'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { applications } from '../../data/homeContent.ts'
import { brandStoryImage } from '../../data/images.ts'
import ApplicationCard from '../Applications/ApplicationCard.tsx'

const paths = [
  { icon: Compass, title: 'Start from the job', text: 'Pick the area you are working on to see the typical sequence and products.', to: '/applications', cta: 'Browse applications' },
  { icon: LayoutGrid, title: 'Start from the product', text: 'Browse by category, search and filter the full catalogue.', to: '/products', cta: 'Browse products' },
  { icon: BookOpen, title: 'Check the details', text: 'Technical documents, FAQs and a coverage calculator.', to: '/resources', cta: 'Open resources' },
  { icon: ClipboardList, title: 'Get a quote', text: 'Send the products and quantities you need, or describe the project.', to: '/quote', cta: 'Ask for a price' },
]

export default function SolutionsPage() {
  const cms = useContent('solutions', 'SolutionsPage')
  return (
    <>
      <title>{cms("field-1", "Find Products — VELTO")}</title>
      <meta name="description" content={cms("field-2", "Find the right construction chemical solution by application or product category, then request a quote.")} />
      <PageHeader
        eyebrow={cms("field-3", "Find Products")}
        title={cms("field-4", "The right product for every part of the build")}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Find Products' }]}
        description={cms("field-5", "Tiling, waterproofing, repair, flooring and surface protection — organised so you can go from problem to product quickly.")}
        actions={
          <>
            <ButtonLink to={cms("field-6", "/applications")} size="lg">
              {cms("field-7", "Start from the job ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
            </ButtonLink>
            <ButtonLink to={cms("field-8", "/products")} variant="secondary" size="lg">
              {cms("field-9", "Browse products")}</ButtonLink>
          </>
        }
        aside={
          <div className="relative w-[clamp(20rem,30vw,28rem)]">
            <div className="aspect-[5/4] overflow-hidden rounded-[var(--radius-panel)] bg-forest-dark shadow-[var(--shadow-float)]">
              <Img cmsImage={{ page: 'solutions', field: 'SolutionsPage.image-src' }} image={{ ...brandStoryImage, src: cms('image-src', "/images/banners/brand-story-crop.webp"), alt: cms('image-alt', "Illustrative concept: contemporary concrete and timber building at dusk") }} priority className="size-full object-cover" />
            </div>
            <div className="glass absolute -bottom-5 -left-6 flex items-center gap-3 rounded-[var(--radius-card)] px-4 py-3 shadow-[var(--shadow-card)]">
              <span className="grid size-10 place-items-center rounded-xl bg-forest-soft text-forest">
                <Compass aria-hidden="true" className="size-5" />
              </span>
              <span className="text-[0.8125rem] leading-snug">
                <span className="block font-bold text-ink">{applications.length} {cms("field-10", " applications")}</span>
                <span className="text-muted">{demoCategories.length} {cms("field-11", " product categories")}</span>
              </span>
            </div>
          </div>
        }
      />

      <section aria-labelledby="paths-title" className="container-page py-[var(--section-gap)]">
        <SectionHeading id="paths-title" eyebrow={cms("field-12", "Find your way")} title={cms("field-13", "Four ways to find what you need")} />
        <ol className="mt-[var(--heading-gap)] grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-2 xl:grid-cols-4 xl:gap-[var(--grid-gap-lg)]">
          {paths.map(({ icon: Icon, title, text, to, cta }, i) => (
            <Reveal as="li" key={title} delay={i * 0.08}>
              <Link
                to={to}
                className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:border-forest/25 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0"
              >
                <span aria-hidden="true" className="absolute top-4 right-5 font-display text-[3rem] leading-none text-sand-deep transition-colors duration-300 group-hover:text-copper-soft">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="relative grid size-12 place-items-center rounded-2xl bg-forest-soft text-forest transition-colors duration-300 group-hover:bg-forest group-hover:text-white">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-5 text-[1.125rem] font-bold">{title}</h3>
                <p className="mt-1 flex-1 text-[0.9375rem] leading-relaxed text-muted">{text}</p>
                <span className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-[0.875rem] font-semibold text-forest">
                  {cta} <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </section>

      <section aria-labelledby="by-application-title" className="bg-cream py-[var(--section-gap)]">
        <div className="container-page">
          <SectionHeading
            id="by-application-title"
            eyebrow={cms("field-14", "Start from the job")}
            title={cms("field-15", "By application")}
            action={
              <ButtonLink to={cms("field-16", "/applications")} variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
                {cms("field-17", "All applications ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
              </ButtonLink>
            }
          />
          <ul className="mt-[var(--heading-gap)] grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] min-[36rem]:grid-cols-2 lg:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
            {applications.map((a, i) => (
              <Reveal as="li" key={a.slug} delay={(i % 3) * 0.08}>
                <ApplicationCard application={a} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="by-category-title" className="container-page py-[var(--section-gap)]">
        <SectionHeading
          id="by-category-title"
          eyebrow={cms("field-18", "Start from the product")}
          title={cms("field-19", "By product category")}
          action={
            <ButtonLink to={cms("field-20", "/products")} variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
              {cms("field-21", "All products ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
            </ButtonLink>
          }
        />
        <ul className="mt-[var(--heading-gap)] grid grid-cols-2 gap-[var(--grid-gap)] md:grid-cols-4 lg:gap-[var(--grid-gap-lg)]">
          {demoCategories.map((c, i) => (
            <Reveal as="li" key={c.slug} delay={(i % 4) * 0.06}>
              <CategoryCard category={c} />
            </Reveal>
          ))}
        </ul>
      </section>
      <HelpBanner />
    </>
  )
}
