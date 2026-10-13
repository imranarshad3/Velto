import { Diamond } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import Img from '../../components/ui/Img.tsx'
import { heroImage } from '../../data/images.ts'

export default function ProductsHero() {
  return (
    <section aria-labelledby="products-title" className="relative overflow-hidden bg-[#f6f1e9]">
      <div className="container-page min-[90rem]:container-wide relative z-10 py-[clamp(1.5rem,4vw,3.5rem)] md:min-h-[clamp(18rem,32vw,24rem)]">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Products' }]} />
        <div className="md:max-w-[45%]">
          <p className="animate-rise mt-2 inline-flex items-center gap-2 rounded-full bg-sand-deep/70 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-forest">
            <Diamond aria-hidden="true" className="size-3 fill-current" />
            Construction Chemicals
          </p>
          <h1 id="products-title" className="animate-rise mt-4 font-display text-[clamp(2.25rem,1.5rem+3.4vw,4.25rem)] leading-[1.02] text-ink">
            Our Products
          </h1>
          <p className="animate-rise mt-4 max-w-[30rem] text-[clamp(0.9375rem,0.9rem+0.25vw,1.0625rem)] text-muted">
            Construction chemical solutions for every build — from homes to large infrastructure projects.
          </p>
        </div>
      </div>
      <div className="relative mx-[var(--page-gutter)] mb-6 aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] md:absolute md:inset-y-0 md:right-0 md:m-0 md:aspect-auto md:w-[58%] md:rounded-none">
        <Img image={heroImage} priority className="size-full object-cover object-[60%_center]" />
        <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-2/5 bg-linear-to-r from-[#f6f1e9] via-[#f6f1e9]/70 to-transparent md:block" />
      </div>
    </section>
  )
}
