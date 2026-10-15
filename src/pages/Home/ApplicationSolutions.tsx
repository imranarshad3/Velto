import { useContentData } from '../../features/cms/context.ts'
import { useContent } from '../../features/cms/context.ts'
import { ArrowRight } from 'lucide-react'
import ApplicationTile from '../../components/commerce/ApplicationTile.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import Img from '../../components/ui/Img.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { applications as defaultapplications } from '../../data/homeContent.ts'
import { waterproofingImage } from '../../data/images.ts'

export default function ApplicationSolutions() {
  const applications = useContentData('applications', 'Applications.data', defaultapplications)
  const cms = useContent('home', 'ApplicationSolutions')
  return (
    <section aria-labelledby="applications-title" className="relative isolate bg-sand py-[var(--section-gap)]">
      <div className="container-page grid gap-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch">
        <div className="min-w-0">
          <Reveal>
            <SectionHeading
              id="applications-title"
              eyebrow={cms("field-1", "By application")}
              title={cms("field-2", "Solutions by Application")}
              description={cms("field-3", "Start from the area you are building or repairing.")}
            />
          </Reveal>
          <ul className="mt-[var(--heading-gap)] grid grid-cols-1 gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 lg:gap-3.5">
            {applications.map((application, index) => (
              <Reveal as="li" key={application.slug} delay={index * 0.06} className="min-w-0">
                <ApplicationTile application={application} />
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Waterproofing spotlight: full-height image panel beside the tiles on desktop. */}
        <Reveal delay={0.1} className="min-w-0">
          <div className="group relative isolate flex h-full min-h-[26rem] flex-col justify-end overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep text-white shadow-[var(--shadow-float)]">
            <Img image={{ ...waterproofingImage, src: cms('image-src', "/images/banners/waterproofing-crop.webp"), alt: cms('image-alt', "Illustrative concept: roller applying a blue waterproofing coat to a rooftop") }} className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.04] motion-reduce:group-hover:scale-100" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(21_43_64/0.1)_0%,rgb(21_43_64/0.55)_45%,rgb(21_43_64/0.95)_100%)]" />
            <div className="p-[clamp(1.25rem,3.5vw,2.25rem)]">
              <p className="text-[0.75rem] font-bold tracking-[0.18em] text-gold uppercase">{cms("field-4", "Waterproofing range")}</p>
              <h3 className="mt-2 font-display text-[clamp(1.5rem,1.2rem+1.3vw,2.25rem)] leading-tight">
                {cms("field-5", "Waterproofing for roofs, basements & terraces")}</h3>
              <p className="mt-3 max-w-[28rem] text-[0.9375rem] text-white/85">
                {cms("field-6", "Browse waterproofing products by the surface you need to protect.")}</p>
              <ButtonLink to={cms("field-7", "/products?category=waterproofing")} variant="light" className="mt-6">
                {cms("field-8", "Explore Waterproofing ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
