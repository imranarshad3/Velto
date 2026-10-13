import { ArrowRight, BookOpen, ClipboardList, Compass, LayoutGrid } from 'lucide-react'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { brandStoryImage, professionalImage } from '../../data/images.ts'

/** Describes what the store does. No founding dates, statistics, certifications or customer claims. */
const principles = [
  { icon: LayoutGrid, title: 'A clear catalogue', text: 'Products organised by category and by application, so you can find what a job needs.' },
  { icon: Compass, title: 'Practical guidance', text: 'Overviews of how common jobs fit together, with technical documents as they are published.' },
  { icon: ClipboardList, title: 'Quotes for real projects', text: 'Send one request for several products, with the quantities and details that matter.' },
  { icon: BookOpen, title: 'Honest information', text: 'We only publish product details, prices and documents once they are verified.' },
]

export default function AboutPage() {
  return (
    <>
      <title>About — NOVARO</title>
      <meta name="description" content="NOVARO is a storefront for construction chemical solutions featuring ULTRA Chemicals products." />
      <PageHeader
        eyebrow="About NOVARO"
        title="Building better, one project at a time"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
        description="NOVARO is a storefront for construction chemical solutions, featuring products from ULTRA Chemicals."
      />

      <section aria-labelledby="story-title" className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[var(--section-gap)] lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-sand-deep">
          <Img image={brandStoryImage} className="size-full object-cover" />
        </div>
        <div>
          <SectionHeading id="story-title" eyebrow="What we do" title="From the right product to a confident quote" />
          <div className="mt-5 flex flex-col gap-4 text-muted">
            <p>
              Tiling, waterproofing, repair and flooring work all depend on the right chemistry being used in the right order.
              NOVARO brings those products together in one place and organises them around the jobs builders, architects,
              contractors and homeowners actually do.
            </p>
            <p>
              ULTRA Chemicals is the manufacturer of the products we feature; NOVARO is the store. We keep the two clearly
              separate, and we publish product details only once they are confirmed.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/products">
              Browse products <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink to="/contact" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="principles-title" className="bg-forest-dark py-[var(--section-gap)] text-white">
        <div className="container-page">
          <SectionHeading id="principles-title" tone="dark" eyebrow="How we work" title="What you can expect" />
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-5">
                <Icon aria-hidden="true" className="size-6 text-[#e3c58f]" />
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-1 text-[0.9375rem] text-white/75">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="who-title" className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[var(--section-gap)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div>
          <SectionHeading id="who-title" eyebrow="Who we serve" title="For professionals and homeowners alike" />
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {['Builders and contractors', 'Architects and specifiers', 'Developers and project managers', 'Homeowners planning renovations'].map((who) => (
              <li key={who} className="rounded-xl border border-border bg-surface p-4 font-semibold">
                {who}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-sand-deep">
          <Img image={professionalImage} className="size-full object-cover object-[center_30%]" />
        </div>
      </section>
      <HelpBanner />
    </>
  )
}
