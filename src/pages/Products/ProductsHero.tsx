import type { CSSProperties } from 'react'
import { ArrowRight, Diamond } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { heroImage } from '../../data/images.ts'

const delay = (seconds: number) => ({ '--delay': `${seconds}s` }) as CSSProperties

export default function ProductsHero() {
  return (
    <section aria-labelledby="products-title" className="relative isolate overflow-hidden bg-cream">

      <div className="container-page min-[90rem]:container-wide relative z-10 pt-[clamp(1rem,2.5vw,1.75rem)] pb-[clamp(1.75rem,4vw,3rem)] md:min-h-[clamp(22rem,36vw,30rem)] md:pb-[clamp(5.5rem,9vw,7.5rem)]">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Products' }]} />
        <div className="md:max-w-[44%]">
          <p
            className="animate-rise mt-[clamp(1rem,3vw,2.25rem)] inline-flex items-center gap-2 rounded-full bg-sand-deep/70 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-forest"
            style={delay(0)}
          >
            <Diamond aria-hidden="true" className="size-3 fill-current" />
            Construction Chemicals
          </p>
          <h1
            id="products-title"
            className="animate-rise mt-4 font-display text-[clamp(2.5rem,1.5rem+3.8vw,4.75rem)] leading-[1] tracking-[-0.01em] text-ink"
            style={delay(0.08)}
          >
            Our <span className="text-forest">Products</span>
          </h1>
          <p
            className="animate-rise mt-4 max-w-[30rem] text-[clamp(0.9375rem,0.9rem+0.25vw,1.125rem)] leading-relaxed text-muted"
            style={delay(0.16)}
          >
            Construction chemical solutions for every build — from homes to large infrastructure projects.
          </p>
          <div className="animate-rise mt-6 flex flex-wrap gap-3" style={delay(0.24)}>
            <ButtonLink to="/quote" className="px-6">
              Request a Quote <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
            </ButtonLink>
            <a href="#shop-application-title" className="inline-flex min-h-12 items-center px-2 text-[0.9375rem] font-semibold text-forest underline decoration-copper/50 underline-offset-[0.35em] hover:decoration-copper">
              Shop by application
            </a>
          </div>
        </div>
      </div>

      <div className="relative mx-[var(--page-gutter)] mb-6 aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)] md:absolute md:inset-y-0 md:right-0 md:m-0 md:aspect-auto md:w-[58%] md:rounded-none md:shadow-none">
        <div className="size-full animate-[fade-in_1s_ease-out_both]">
          <Img image={heroImage} priority className="size-full object-cover object-[60%_center]" />
        </div>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-2/5 bg-linear-to-r from-cream via-cream/70 to-transparent md:block" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-linear-to-t from-cream/90 to-transparent md:block" />
        <p className="absolute right-3 bottom-3 rounded-full glass-dark px-3 py-1 text-[0.6875rem] font-medium text-white md:right-[var(--page-gutter)] md:bottom-[clamp(5.5rem,9vw,7.5rem)]">
          Illustrative concept imagery
        </p>
      </div>
    </section>
  )
}
