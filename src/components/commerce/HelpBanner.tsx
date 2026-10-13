import { ArrowRight } from 'lucide-react'
import { professionalImage } from '../../data/images.ts'
import ButtonLink from '../ui/ButtonLink.tsx'
import Img from '../ui/Img.tsx'

/** "Need help choosing?" professional assistance banner (products + product details). */
export default function HelpBanner() {
  return (
    <section aria-labelledby="help-title" className="py-[var(--section-gap)]">
      <div className="container-page grid overflow-hidden rounded-[var(--radius-card)] bg-forest text-white md:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)]">
        <div className="flex flex-col justify-center p-[clamp(1.5rem,5vw,4rem)]">
          <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-[#e3c58f] uppercase">Professional assistance</p>
          <h2 id="help-title" className="mt-2 font-display text-[length:var(--h2)] leading-[1.1]">
            Need help choosing?
          </h2>
          <p className="mt-4 max-w-[32rem] text-[0.9375rem] text-white/80">
            Share your project details and the surfaces involved, and we will help you select products and estimate
            quantities.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/quote" variant="secondary" className="border-transparent bg-white text-ink hover:text-forest">
              Request a Quote <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink to="/resources" variant="secondary" className="border-white/30 bg-transparent text-white hover:border-white hover:text-white">
              Technical Resources
            </ButtonLink>
          </div>
        </div>
        <div className="relative order-first aspect-[4/3] bg-forest-dark md:order-none md:aspect-auto md:min-h-[20rem]">
          <Img image={professionalImage} className="absolute inset-0 size-full object-cover object-[center_30%]" />
        </div>
      </div>
    </section>
  )
}
