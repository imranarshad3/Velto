import { ArrowRight, BookOpen, ClipboardList, Compass, LayoutGrid } from 'lucide-react'
import ApplicationTile from '../../components/commerce/ApplicationTile.tsx'
import CategoryCard from '../../components/commerce/CategoryCard.tsx'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { demoCategories } from '../../data/demoCategories.ts'
import { applications } from '../../data/homeContent.ts'
import { brandStoryImage } from '../../data/images.ts'

const paths = [
  { icon: Compass, title: 'Start from the job', text: 'Pick the area you are working on to see the typical sequence and products.', to: '/applications', cta: 'Browse applications' },
  { icon: LayoutGrid, title: 'Start from the product', text: 'Browse by category, search and filter the full catalogue.', to: '/products', cta: 'Browse products' },
  { icon: BookOpen, title: 'Check the details', text: 'Technical documents, FAQs and a coverage calculator.', to: '/resources', cta: 'Open resources' },
  { icon: ClipboardList, title: 'Get a quote', text: 'Send the products and quantities you need, or describe the project.', to: '/quote', cta: 'Request a quote' },
]

export default function SolutionsPage() {
  return (
    <>
      <title>Solutions — NOVARO</title>
      <meta name="description" content="Find the right construction chemical solution by application or product category, then request a quote." />
      <section aria-labelledby="solutions-title" className="relative overflow-hidden bg-forest-dark text-white">
        <Img image={brandStoryImage} priority alt="" className="absolute inset-0 size-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-linear-to-r from-forest-dark via-forest-dark/85 to-forest-dark/30" aria-hidden="true" />
        <div className="container-page relative py-[clamp(2.5rem,7vw,6rem)] pt-2">
          <div className="[&_a]:text-white/75 [&_a:hover]:text-white [&_span]:text-white">
            <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Solutions' }]} />
          </div>
          <p className="mt-4 text-[0.75rem] font-semibold tracking-[0.16em] text-[#e3c58f] uppercase">Solutions</p>
          <h1 id="solutions-title" className="animate-rise mt-2 max-w-[40rem] font-display text-[clamp(2.25rem,1.6rem+2.8vw,4rem)] leading-[1.04]">
            The right product for every part of the build
          </h1>
          <p className="animate-rise mt-4 max-w-[34rem] text-white/80">
            Tiling, waterproofing, repair, flooring and surface protection — organised so you can go from problem to product quickly.
          </p>
        </div>
      </section>

      <section aria-labelledby="paths-title" className="container-page py-[var(--section-gap)]">
        <SectionHeading id="paths-title" title="Four ways to find what you need" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paths.map(({ icon: Icon, title, text, to, cta }) => (
            <li key={title} className="flex flex-col rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <span className="grid size-12 place-items-center rounded-xl bg-forest-soft text-forest">
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1 flex-1 text-[0.9375rem] text-muted">{text}</p>
              <ButtonLink to={to} variant="ghost" className="mt-3 -ml-3 w-fit px-3 text-[0.875rem]">
                {cta} <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="by-application-title" className="bg-sand py-[var(--section-gap)]">
        <div className="container-page">
          <SectionHeading id="by-application-title" title="By application" action={<ButtonLink to="/applications" variant="ghost" className="-mr-3 px-3 text-[0.875rem]">All applications <ArrowRight aria-hidden="true" className="size-4" /></ButtonLink>} />
          <ul className="mt-8 grid gap-3 min-[30rem]:grid-cols-2 lg:grid-cols-3">
            {applications.map((a) => (
              <li key={a.slug}>
                <ApplicationTile application={a} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="by-category-title" className="container-page py-[var(--section-gap)]">
        <SectionHeading id="by-category-title" title="By product category" />
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {demoCategories.map((c) => (
            <li key={c.slug}>
              <CategoryCard category={c} />
            </li>
          ))}
        </ul>
      </section>
      <HelpBanner />
    </>
  )
}
