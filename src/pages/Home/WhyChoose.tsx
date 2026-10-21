import { useContentData } from '../../features/cms/context.ts'
import { useContent } from '../../features/cms/context.ts'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import { whyChooseFeatures as defaultwhyChooseFeatures } from '../../data/homeContent.ts'
import { brandStoryImage } from '../../data/images.ts'

export default function WhyChoose() {
  const whyChooseFeatures = useContentData('home', 'WhyChoose.data', defaultwhyChooseFeatures)
  const cms = useContent('home', 'WhyChoose')
  return (
    <section aria-labelledby="why-title" className="why-choose-section edge-image-section relative isolate overflow-hidden text-white">

      <div className="edge-image-grid container-page grid gap-[clamp(2.5rem,5vw,5rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="edge-image-copy min-w-0">
          <Reveal>
            <p className="border-t border-white/20 pt-5 text-[0.875rem] font-medium text-white/65">
              {cms("field-1", "The VELTO difference")}</p>
            <h2 id="why-title" className="mt-3 font-display text-[clamp(2.25rem,1.5rem+2.8vw,3.75rem)]">
              {cms("field-2", "Why Choose")}<span>{cms("field-3", "VELTO?")}</span>
            </h2>
            <p className="mt-5 max-w-[34rem] text-[clamp(1.0625rem,1rem+0.4vw,1.3125rem)] leading-relaxed text-white/80">
              {cms("field-4", "Find the right product for the work you need to do.")}</p>
          </Reveal>

          <ul className="mt-[var(--heading-gap)] grid gap-x-8 sm:grid-cols-2">
            {whyChooseFeatures.map(({ title, text, icon: Icon }, index) => (
              <Reveal as="li" key={title} delay={0.06 + index * 0.07} className="flex min-w-0 gap-4 border-t border-white/12 py-5">
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
                <span className="min-w-0">
                  <span className="block text-[1rem] font-semibold">{title}</span>
                  <span className="mt-1 block text-[0.875rem] leading-relaxed text-white/70">{text}</span>
                </span>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.3}>
            <ButtonLink to={cms("field-5", "/about")} variant="outline-light" size="lg" className="mt-6">
              {cms("field-6", "Our Story")}
            </ButtonLink>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="edge-image-media relative min-w-0 pr-[clamp(0.75rem,2vw,1.5rem)] pb-[clamp(0.75rem,2vw,1.5rem)]">
          {/* The photo fills the text-height column on desktop and its own frame on mobile. */}
          <div className="relative w-full overflow-hidden bg-forest-deep">
            <Img fit="cover" cmsImage={{ page: 'home', field: 'WhyChoose.image-src' }} image={{ ...brandStoryImage, src: cms('image-src', "/images/banners/brand-story-crop.webp"), alt: cms('image-alt', "Illustrative concept: contemporary concrete and timber building at dusk") }} className="absolute inset-0 size-full object-cover" />
            <span className="glass-dark absolute bottom-3 left-3 rounded-full px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.12em] text-white uppercase">
              {cms("field-7", "Illustrative")}</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
