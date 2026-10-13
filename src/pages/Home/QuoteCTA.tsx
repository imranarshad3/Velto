import { ArrowRight } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'

export default function QuoteCTA() {
  return (
    <section id="quote" aria-labelledby="quote-title" className="scroll-mt-[calc(var(--header-height)+1rem)] pb-[var(--section-gap)]">
      <div className="container-page relative overflow-hidden rounded-[var(--radius-card)] bg-forest px-[clamp(1.5rem,5vw,4rem)] py-[clamp(2.5rem,5vw,4rem)] text-white">
        <div aria-hidden="true" className="absolute -top-1/2 -right-[10%] size-[min(80vw,32rem)] rounded-full bg-copper/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[36rem]">
            <h2 id="quote-title" className="font-display text-[length:var(--h2)] leading-[1.1]">
              Planning a project?
            </h2>
            <p className="mt-3 text-[0.9375rem] text-white/80">
              Tell us what you are building and the areas involved, and we will help with product selection and
              quantities.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/quote" variant="secondary" className="border-transparent bg-white text-ink hover:text-forest">
              Request a Quote <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink to="/solutions" variant="secondary" className="border-white/30 bg-transparent text-white hover:border-white hover:text-white">
              Browse Solutions
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
