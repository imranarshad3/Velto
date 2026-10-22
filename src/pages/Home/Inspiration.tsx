import { useContentData } from '../../features/cms/context.ts'
import { useContent } from '../../features/cms/context.ts'
import Img from '../../components/ui/Img.tsx'
import DemoNotice from '../../components/ui/DemoNotice.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { inspiration as defaultinspiration } from '../../data/homeContent.ts'

export default function Inspiration() {
  const inspiration = useContentData('home', 'Inspiration.data', defaultinspiration)
  const cms = useContent('home', 'Inspiration')
  return (
    <section aria-labelledby="inspiration-title" className="bg-canvas pb-[var(--section-gap)]">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            id="inspiration-title"
            eyebrow={cms("field-1", "Illustrative")}
            title={cms("field-2", "Inspiration")}
            description={cms("field-3", "Ideas for the kinds of spaces construction chemicals help build.")}
          />
        </Reveal>
        {/* Editorial bento: the lead image spans two rows on tablet and up. */}
        <ul className="mt-[var(--heading-gap)] grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
          {inspiration.map((item, index) => (
            <Reveal as="li" key={item.title} delay={index * 0.08} className="min-w-0">
              <figure className="group relative isolate h-full overflow-hidden rounded-[var(--radius-card)] bg-sand-deep shadow-[var(--shadow-soft)]">
                <div>
                  <Img image={item.image} uncropped />
                </div>
                <figcaption className="bg-forest-deep p-[clamp(1rem,2.5vw,1.75rem)] text-white">
                  <span className={`block font-display leading-tight text-[clamp(1.25rem,1.1rem+0.5vw,1.5rem)]`}>{item.title}</span>
                  <span className="mt-1 block text-[0.875rem] text-white/80">{item.caption}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
        <div className="mt-5">
          <DemoNotice>{cms("field-4", "Illustrative concept imagery, not completed VELTO projects.")}</DemoNotice>
        </div>
      </div>
    </section>
  )
}
