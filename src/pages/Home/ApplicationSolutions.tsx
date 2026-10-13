import { ArrowRight } from 'lucide-react'
import ApplicationTile from '../../components/commerce/ApplicationTile.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { applications } from '../../data/homeContent.ts'
import { waterproofingImage } from '../../data/images.ts'

export default function ApplicationSolutions() {
  return (
    <section aria-labelledby="applications-title" className="bg-sand py-[var(--section-gap)]">
      <div className="container-page">
        <SectionHeading
          id="applications-title"
          title="Solutions by Application"
          description="Start from the area you are building or repairing."
        />
        <ul className="mt-8 grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {applications.map((application) => (
            <li key={application.slug}>
              <ApplicationTile application={application} />
            </li>
          ))}
        </ul>

        {/* Waterproofing spotlight banner */}
        <div className="mt-[clamp(2rem,4vw,3rem)] grid overflow-hidden rounded-[var(--radius-card)] bg-[#1f4f6e] text-white md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="p-[clamp(1.5rem,4vw,3rem)]">
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-white/75 uppercase">Waterproofing range</p>
            <h3 className="mt-2 font-display text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] leading-tight">
              Waterproofing for roofs, basements &amp; terraces
            </h3>
            <p className="mt-3 max-w-[28rem] text-[0.9375rem] text-white/80">
              Browse waterproofing products by the surface you need to protect.
            </p>
            <ButtonLink to="/products?category=waterproofing" variant="secondary" className="mt-6 border-transparent bg-white text-ink hover:text-forest">
              Explore Waterproofing <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
          </div>
          <div className="relative aspect-[16/9] md:aspect-auto">
            <Img image={waterproofingImage} className="absolute inset-0 size-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  )
}
