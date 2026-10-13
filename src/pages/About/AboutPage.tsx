import { useContentData } from '../../features/cms/context.ts'
import { useContent } from '../../features/cms/context.ts'
import { ArrowRight, BookOpen, Check, ClipboardList, Compass, LayoutGrid } from 'lucide-react'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { brandStoryImage } from '../../data/images.ts'
import { demoCategories as defaultdemoCategories } from '../../data/demoCategories.ts'

/** Describes what the store does. No founding dates, statistics, certifications or customer claims. */
const principles = [
  { icon: LayoutGrid, title: 'A clear catalogue', text: 'Products organised by category and by application, so you can find what a job needs.' },
  { icon: Compass, title: 'Practical guidance', text: 'Overviews of how common jobs fit together, with technical documents as they are published.' },
  { icon: ClipboardList, title: 'Quotes for real projects', text: 'Send one request for several products, with the quantities and details that matter.' },
  { icon: BookOpen, title: 'Honest information', text: 'We only publish product details, prices and documents once they are verified.' },
]

const audiences = ['Builders and contractors', 'Architects and specifiers', 'Developers and project managers', 'Homeowners planning renovations']

/** Illustrative photography of the kinds of work the catalogue covers (decorative). */


export default function AboutPage() {
  const demoCategories = useContentData('categories', 'Categories.data', defaultdemoCategories)
  const mosaic = ['tile-adhesives', 'waterproofing', 'flooring-solutions', 'concrete-repair'].flatMap((slug) => {
    const c = demoCategories.find((x) => x.slug === slug)
    return c?.image ? [{ name: c.name, image: c.image }] : []
  })
  const cms = useContent('about', 'AboutPage')
  return (
    <>
      <title>{cms("field-1", "About — VELTO")}</title>
      <meta name="description" content={cms("field-2", "VELTO is a storefront for construction chemical solutions featuring ULTRA Chemicals products.")} />
      <PageHeader
        eyebrow={cms("field-3", "About VELTO")}
        title={cms("field-4", "Building better, one project at a time")}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
        description={cms("field-5", "VELTO is a storefront for construction chemical solutions, featuring products from ULTRA Chemicals.")}
        aside={
          <div className="relative isolate w-[clamp(19rem,26vw,24rem)] overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep p-7 text-white shadow-[var(--shadow-float)]">
            <dl className="flex flex-col">
              <div className="pb-5">
                <dt className="text-[0.6875rem] font-bold tracking-[0.2em] text-gold uppercase">{cms("field-6", "The store")}</dt>
                <dd className="mt-1 font-display text-[1.75rem] leading-tight">{cms("field-7", "VELTO")}</dd>
              </div>
              <div className="pt-5">
                <dt className="text-[0.6875rem] font-bold tracking-[0.2em] text-gold uppercase">{cms("field-8", "The manufacturer")}</dt>
                <dd className="mt-1 font-display text-[1.75rem] leading-tight">{cms("field-9", "ULTRA Chemicals")}</dd>
              </div>
            </dl>
            <p className="mt-6 text-[0.8125rem] leading-relaxed text-white/70">{cms("field-10", "Two separate names, kept clearly apart.")}</p>
          </div>
        }
      />

      {/* Editorial statement */}
      <section aria-labelledby="story-title" className="relative py-[var(--section-gap)]">
        <div className="container-page">
          <Reveal className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,0.32fr)_minmax(0,1fr)] lg:gap-12">
            <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-copper uppercase lg:items-start lg:pt-4">
              <span aria-hidden="true" className="h-px w-8 bg-copper/60 lg:mt-2" />
              {cms("field-11", "What we do")}</p>
            <p className="max-w-[52rem] font-display text-[clamp(1.75rem,1.25rem+2.1vw,3.25rem)] leading-[1.12] tracking-[-0.01em] text-ink">
              {cms("field-12", "Tiling, waterproofing, repair and flooring work all depend on the right chemistry being used")}{' '}
              <span className="text-forest italic">{cms("field-13", "in the right order.")}</span>
            </p>
          </Reveal>

          <div className="mt-[clamp(2.5rem,6vw,5rem)] grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-12 lg:items-center lg:gap-0">
            <Reveal className="relative lg:col-span-7 lg:col-start-1 lg:row-start-1">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)] bg-sand-deep shadow-[var(--shadow-card)] sm:aspect-[16/10] lg:aspect-[5/4]">
                <Img image={{ ...brandStoryImage, src: cms('image-src', "/images/banners/brand-story-crop.webp"), alt: cms('image-alt', "Illustrative concept: contemporary concrete and timber building at dusk") }} className="size-full object-cover" />
              </div>
            </Reveal>
            <Reveal delay={0.08} className="relative z-10 lg:col-span-6 lg:col-start-7 lg:row-start-1">
              <div className="surface-card p-[clamp(1.5rem,3.5vw,3rem)] lg:shadow-[var(--shadow-float)]">
                <h2 id="story-title" className="font-display text-[length:var(--h2)] leading-[1.08] tracking-[-0.01em]">
                  {cms("field-14", "From the right product to a confident quote")}</h2>
                <div className="mt-5 flex flex-col gap-4 leading-relaxed text-muted">
                  <p>
                    {cms("field-15", "VELTO brings construction chemicals together in one place and organises them around the jobs builders, architects, contractors and homeowners actually do — so you can go from the surface in front of you to the products it needs, and on to a single quote.")}</p>
                  <p>
                    {cms("field-16", "ULTRA Chemicals is the manufacturer of the products we feature; VELTO is the store. We keep the two clearly separate, and we publish product details only once they are confirmed.")}</p>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink to={cms("field-17", "/products")}>
                    {cms("field-18", "Browse products ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
                  </ButtonLink>
                  <ButtonLink to={cms("field-19", "/contact")} variant="secondary">
                    {cms("field-20", "Contact us")}</ButtonLink>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Dark band: numbered principles */}
      <section aria-labelledby="principles-title" className="relative isolate overflow-hidden bg-forest-deep py-[var(--section-gap)] text-white">
        <div className="container-page">
          <SectionHeading id="principles-title" tone="dark" eyebrow={cms("field-21", "How we work")} title={cms("field-22", "What you can expect")} />
          <ol className="mt-[var(--heading-gap)] grid grid-cols-[minmax(0,1fr)] border-t border-white/12 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, text }, i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 0.08}
                className="group relative flex flex-col gap-4 border-b border-white/12 py-7 sm:px-6 sm:odd:pl-0 lg:border-b-0 lg:border-l lg:px-7 lg:py-9 lg:first:border-l-0 lg:first:pl-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <span aria-hidden="true" className="font-display text-[clamp(2.5rem,2rem+1.6vw,3.5rem)] leading-none text-gold/90 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="grid size-11 place-items-center rounded-2xl bg-white/8 text-gold ring-1 ring-white/12 transition-colors duration-300 group-hover:bg-white/14">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                </div>
                <h3 className="text-[1.125rem] font-bold">{title}</h3>
                <p className="text-[0.9375rem] leading-relaxed text-white/72">{text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Who we serve */}
      <section aria-labelledby="who-title" className="bg-cream py-[var(--section-gap)]">
        <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
          <Reveal>
            <SectionHeading id="who-title" eyebrow={cms("field-23", "Who we serve")} title={cms("field-24", "For professionals and homeowners alike")} />
            <ul className="mt-[var(--heading-gap)] grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-2">
              {audiences.map((who) => (
                <li key={who} className="surface-card flex min-h-[4.5rem] items-center gap-3 p-4 font-semibold">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
                    <Check className="size-4" />
                  </span>
                  <span className="min-w-0">{who}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08} className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
            <div aria-hidden="true" className="absolute -top-4 -left-4 h-3/4 w-3/4 rounded-[var(--radius-panel)] bg-copper-soft" />
            <ul className="relative grid grid-cols-2 gap-[var(--grid-gap)] sm:gap-4">
              {mosaic.map(({ name, image }, i) => (
                <li key={name} className={`group relative overflow-hidden rounded-[var(--radius-card)] bg-sand-deep shadow-[var(--shadow-card)] ${i % 2 ? 'mt-8 aspect-[4/5]' : 'aspect-[4/5]'}`}>
                  <Img image={image} alt={cms("field-25", "")} className="size-full object-cover transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgb(11_31_24/0.85))] px-3 pt-8 pb-3 text-[0.8125rem] font-semibold text-white">{name}</span>
                </li>
              ))}
            </ul>
            <p className="relative mt-3 text-right text-[0.75rem] text-muted">{cms("field-26", "Illustrative imagery")}</p>
          </Reveal>
        </div>
      </section>
      <HelpBanner />
    </>
  )
}
