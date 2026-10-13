import Img from '../../components/ui/Img.tsx'
import DemoNotice from '../../components/ui/DemoNotice.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { inspiration } from '../../data/homeContent.ts'

export default function Inspiration() {
  return (
    <section aria-labelledby="inspiration-title" className="pb-[var(--section-gap)]">
      <div className="container-page">
        <SectionHeading
          id="inspiration-title"
          eyebrow="Illustrative"
          title="Inspiration"
          description="Ideas for the kinds of spaces construction chemicals help build."
        />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {inspiration.map((item) => (
            <li key={item.title}>
              <figure className="group relative overflow-hidden rounded-[var(--radius-card)] bg-sand-deep">
                <div className="aspect-[4/3]">
                  <Img image={item.image} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/85 to-transparent p-4 pt-12 text-white">
                  <span className="block font-semibold">{item.title}</span>
                  <span className="block text-[0.8125rem] text-white/80">{item.caption}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <DemoNotice>Illustrative concept imagery, not completed NOVARO projects.</DemoNotice>
        </div>
      </div>
    </section>
  )
}
