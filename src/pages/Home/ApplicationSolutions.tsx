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
    <section aria-labelledby="applications-title" className="application-editorial edge-image-section relative isolate bg-sand py-[var(--section-gap)]">
      <div className="edge-image-grid container-page grid gap-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch">
        <div className="edge-image-copy min-w-0">
          <Reveal>
            <SectionHeading
              id="applications-title"
              eyebrow={cms("field-1", "By application")}
              title={cms("field-2", "Products for every area")}
              description={cms("field-3", "Choose the area you are working on.")}
            />
          </Reveal>
          <ul className="mt-[var(--heading-gap)] grid grid-cols-1 gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 lg:gap-3.5">
            {applications.map((application, index) => (
              <Reveal as="li" key={application.slug} delay={index * 0.06} className="min-w-0">
                <ApplicationTile application={application} />
              </Reveal>
            ))}
          </ul>
          <ButtonLink to="/applications" variant="ghost" className="mt-7">See all areas <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} /></ButtonLink>
        </div>

        {/* Waterproofing spotlight: full-height image panel beside the tiles on desktop. */}
        <Reveal delay={0.1} className="edge-image-media min-w-0">
          <div className="relative flex flex-col overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep text-white shadow-[var(--shadow-float)]">
            <div className="relative aspect-[3/2] lg:min-h-[18rem] lg:flex-1 lg:aspect-auto">
              <Img fit="cover" cmsImage={{ page: 'home', field: 'ApplicationSolutions.image-src' }} image={{ ...waterproofingImage, src: cms('image-src', "/images/banners/waterproofing-crop.webp"), alt: cms('image-alt', "Illustrative concept: roller applying a blue waterproofing coat to a rooftop") }} className="absolute inset-0 size-full object-cover" />
            </div>
            <div className="application-spotlight-copy shrink-0 p-[clamp(1.25rem,3.5vw,2.25rem)]">
              <p className="text-[0.75rem] font-bold tracking-[0.18em] text-gold uppercase">{cms("field-4", "Waterproofing products")}</p>
              <h3 className="mt-2 font-display text-[clamp(1.5rem,1.2rem+1.3vw,2.25rem)] leading-tight">
                {cms("field-5", "Waterproof roofs, basements and terraces")}</h3>
              <p className="mt-3 max-w-[28rem] text-[0.9375rem] text-white/85">
                {cms("field-6", "Find products to help keep water out.")}</p>
              <ButtonLink to={`${cms("field-7", "/products?category=waterproofing").split('#')[0]}#product-results`} variant="light" className="mt-6">
                {cms("field-8", "See waterproofing products ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
