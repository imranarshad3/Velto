import { Headset } from 'lucide-react'
import { Link } from 'react-router'
import { professionalImage } from '../../data/images.ts'
import { buttonClass } from '../ui/button.ts'
import Img from '../ui/Img.tsx'
import Reveal from '../ui/Reveal.tsx'

/** "Need help with your project?" professional assistance banner (products + product details). */
export default function HelpBanner({ premium = true }: { premium?: boolean }) {
  return (
    <section aria-labelledby="help-title" className="bg-cream py-[var(--section-gap)]">
      <Reveal className="container-page">
        <div className="relative isolate grid overflow-hidden rounded-[var(--radius-panel)] border border-forest/15 bg-forest-deep text-white shadow-[var(--shadow-float)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="order-2 flex min-w-0 flex-col justify-center p-[clamp(1.5rem,4vw,3.5rem)] lg:order-1">
            <p className="text-[0.875rem] font-medium text-white/65">
              <Headset aria-hidden="true" className="size-4" />
              Project help
            </p>
            <h2 id="help-title" className="mt-5 max-w-[16ch] font-display text-[clamp(2rem,1.5rem+2vw,3.5rem)] leading-[1.08]">
              Need help with your project?
            </h2>
            <p className="mt-4 max-w-[32rem] text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed text-white/75">
              Tell us about your project and the areas you are working on. We’ll help you choose products and work out how much you need.
            </p>
            {premium && <ol className="mt-7 grid gap-4 border-y border-white/15 py-5 sm:grid-cols-3" aria-label="How we can help">
              {['Share your plan', 'Choose materials', 'Request a quote'].map((step, index) => <li key={step} className="flex items-center gap-3 text-[0.8125rem] leading-relaxed text-white/80 sm:block"><span className="font-display text-[1.25rem] text-gold sm:mb-2 sm:block">0{index + 1}</span><span>{step}</span></li>)}
            </ol>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/quote" className={buttonClass('light', 'lg')}>
                Get a price
              </Link>
              <Link to="/resources" className={buttonClass('outline-light', 'lg')}>
                Product guides
              </Link>
            </div>
          </div>
          <div className="relative order-1 aspect-[16/10] min-w-0 overflow-hidden bg-forest-dark lg:order-2 lg:aspect-auto">
            <Img image={professionalImage} fit="cover" className="absolute inset-0 size-full object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-forest-deep/85 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-[clamp(1.5rem,4vw,3.5rem)]"><span className="text-[0.6875rem] font-bold tracking-[0.2em] text-gold uppercase">From plans to materials</span><p className="mt-2 max-w-[20ch] font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-tight">A clearer path to your next project.</p></div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
