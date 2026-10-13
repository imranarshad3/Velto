import { useContent } from '../../features/cms/context.ts'
import { ArrowRight } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import Reveal from '../../components/ui/Reveal.tsx'

export default function QuoteCTA() {
  const cms = useContent('home', 'QuoteCTA')
  return (
    <section id="quote" aria-labelledby="quote-title" className="scroll-mt-[calc(var(--header-height)+1rem)] bg-cream pb-[var(--section-gap)]">
      <Reveal className="container-page">
        <div className="relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep px-[clamp(1.5rem,5vw,4rem)] py-[clamp(3rem,7vw,5.5rem)] text-center text-white shadow-[var(--shadow-float)]">
          <div aria-hidden="true" className="absolute -top-1/2 -right-[10%] -z-10 size-[min(80vw,30rem)] rounded-full bg-copper/20 blur-3xl" />

          <p className="flex items-center justify-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-gold/70" />
            {cms("field-1", "Project quotes")}<span aria-hidden="true" className="h-px w-8 bg-gold/70" />
          </p>
          <h2 id="quote-title" className="mx-auto mt-4 max-w-[40rem] font-display text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] leading-[1.05]">
            {cms("field-2", "Planning a project?")}</h2>
          <p className="mx-auto mt-4 max-w-[36rem] text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed text-white/80">
            {cms("field-3", "Tell us what you are building and the areas involved, and we will help with product selection and quantities.")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to={cms("field-4", "/quote")} variant="accent" size="lg" className="max-[22.5rem]:w-full">
              {cms("field-5", "Request a Quote ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
            </ButtonLink>
            <ButtonLink to={cms("field-6", "/solutions")} variant="outline-light" size="lg" className="max-[22.5rem]:w-full">
              {cms("field-7", "Browse Solutions")}</ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
