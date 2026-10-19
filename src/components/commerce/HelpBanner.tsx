import { ArrowRight, Headset } from 'lucide-react'
import { Link } from 'react-router'
import { professionalImage } from '../../data/images.ts'
import { buttonArrow, buttonClass } from '../ui/button.ts'
import Img from '../ui/Img.tsx'
import Reveal from '../ui/Reveal.tsx'

/** "Need help with your project?" professional assistance banner (products + product details). */
export default function HelpBanner({ premium = true }: { premium?: boolean }) {
  return (
    <section aria-labelledby="help-title" className={`py-[var(--section-gap)] ${premium ? 'premium-assistance' : ''}`}>
      <Reveal className="container-page">
        <div className="relative isolate grid overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep text-white shadow-[var(--shadow-float)] md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="flex flex-col justify-center p-[clamp(1.75rem,5vw,4.5rem)]">
            <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
              <Headset aria-hidden="true" className="size-4" />
              Project help
            </p>
            <h2 id="help-title" className="mt-4 font-display text-[length:var(--h2)] leading-[1.06]">
              Need help with your project?
            </h2>
            <p className="mt-4 max-w-[32rem] text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed text-white/75">
              Tell us about your project and the areas you are working on. We’ll help you choose products and work out how much you need.
            </p>
            {premium && <ol className="assistance-steps" aria-label="How we can help">
              {['Tell us about the job', 'Choose products', 'Plan how much you need'].map((step, index) => <li key={step}><span className="font-display text-gold">0{index + 1}</span><span>{step}</span></li>)}
            </ol>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/quote" className={buttonClass('light', 'lg')}>
                Get a price <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
              </Link>
              <Link to="/resources" className={buttonClass('outline-light', 'lg')}>
                Product guides
              </Link>
            </div>
          </div>
          <div className="relative order-first aspect-[4/3] bg-forest-dark md:order-none md:aspect-auto md:min-h-[24rem]">
            <Img image={professionalImage} className="absolute inset-0 size-full object-cover object-[center_30%]" />
            {premium && <div className="assistance-image-caption"><span className="text-[0.625rem] font-bold tracking-[0.2em] text-gold uppercase">Project help</span><p className="mt-2 font-display text-[1.5rem] leading-tight">Get help with your next project.</p></div>}
            <div aria-hidden="true" className="absolute inset-0 hidden bg-[linear-gradient(90deg,var(--color-forest-deep),transparent_45%)] md:block" />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
