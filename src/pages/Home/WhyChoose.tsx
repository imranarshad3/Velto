import { ArrowRight } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { whyChooseFeatures } from '../../data/homeContent.ts'
import { brandStoryImage } from '../../data/images.ts'

export default function WhyChoose() {
  return (
    <section aria-labelledby="why-title" className="bg-forest-dark text-white">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="px-[var(--page-gutter)] py-[clamp(3rem,6vw,5rem)] lg:pr-[clamp(2rem,4vw,4rem)] lg:pl-[max(var(--page-gutter),calc((100vw-var(--container-width))/2))]">
          <SectionHeading
            id="why-title"
            tone="dark"
            eyebrow="The NOVARO difference"
            title="Why Choose NOVARO?"
            description="A storefront built around finding the right product for the job."
          />
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {whyChooseFeatures.map(({ title, text, icon: Icon }) => (
              <li key={title} className="flex gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-[#e3c58f]">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block text-[0.9375rem] font-semibold">{title}</span>
                  <span className="block text-[0.875rem] text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <ButtonLink to="/about" variant="secondary" className="mt-9 border-white/30 bg-transparent text-white hover:border-white hover:text-white">
            Our Story <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>
        <div className="relative min-h-[14rem] bg-forest lg:min-h-full">
          <Img image={brandStoryImage} className="absolute inset-0 size-full object-cover" />
          <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-1/4 bg-linear-to-r from-forest-dark to-transparent lg:block" />
        </div>
      </div>
    </section>
  )
}
