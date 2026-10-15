import { ArrowRight, Headset } from 'lucide-react'
import { Link } from 'react-router'
import { professionalImage } from '../../data/images.ts'
import { buttonArrow, buttonClass } from '../ui/button.ts'
import Img from '../ui/Img.tsx'
import Reveal from '../ui/Reveal.tsx'

/** "Need help choosing?" professional assistance banner (products + product details). */
export default function HelpBanner() {
  return (
    <section aria-labelledby="help-title" className="py-[var(--section-gap)]">
      <Reveal className="container-page">
        <div className="relative isolate grid overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep text-white shadow-[var(--shadow-float)] md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="flex flex-col justify-center p-[clamp(1.75rem,5vw,4.5rem)]">
            <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
              <Headset aria-hidden="true" className="size-4" />
              Professional assistance
            </p>
            <h2 id="help-title" className="mt-4 font-display text-[length:var(--h2)] leading-[1.06]">
              Need help choosing?
            </h2>
            <p className="mt-4 max-w-[32rem] text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed text-white/75">
              Share your project details and the surfaces involved, and we will help you select products and estimate
              quantities.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/quote" className={buttonClass('light', 'lg')}>
                Ask for Price <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
              </Link>
              <Link to="/resources" className={buttonClass('outline-light', 'lg')}>
                Technical Resources
              </Link>
            </div>
          </div>
          <div className="relative order-first aspect-[4/3] bg-forest-dark md:order-none md:aspect-auto md:min-h-[24rem]">
            <Img image={professionalImage} className="absolute inset-0 size-full object-cover object-[center_30%]" />
            <div aria-hidden="true" className="absolute inset-0 hidden bg-[linear-gradient(90deg,var(--color-forest-deep),transparent_45%)] md:block" />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
