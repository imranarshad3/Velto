import { ArrowRight } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import { professionalImage } from '../../data/images.ts'

export default function ProfessionalsBanner() {
  return (
    <section aria-labelledby="pros-title" className="py-[var(--section-gap)]">
      <div className="container-page grid overflow-hidden rounded-[var(--radius-card)] bg-forest text-white md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] bg-forest-dark md:aspect-auto md:min-h-[22rem]">
          <Img image={professionalImage} className="absolute inset-0 size-full object-cover object-[center_30%]" />
        </div>
        <div className="flex flex-col justify-center p-[clamp(1.5rem,5vw,4rem)]">
          <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-[#e3c58f] uppercase">NOVARO Professionals</p>
          <h2 id="pros-title" className="mt-2 font-display text-[length:var(--h2)] leading-[1.1]">
            Built for Professionals
          </h2>
          <p className="mt-4 max-w-[30rem] text-[0.9375rem] text-white/80">
            For builders, architects and contractors: browse by application, request project quantities and access
            technical documents as they are published.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/solutions" variant="secondary" className="border-transparent bg-white text-ink hover:text-forest">
              Explore Solutions <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink to="/quote" variant="secondary" className="border-white/30 bg-transparent text-white hover:border-white hover:text-white">
              Request a Quote
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
