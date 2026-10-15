import ApplicationTile from '../../components/commerce/ApplicationTile.tsx'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { applications } from '../../data/homeContent.ts'

/** Application showcase (filters this page) followed by the professional assistance banner. */
export default function ProductsAssistance() {
  return (
    <>
      <section aria-labelledby="shop-application-title" className="relative isolate scroll-mt-[var(--header-height)] overflow-hidden border-t border-sand-deep/60 bg-sand py-[var(--section-gap)]">
        <div className="container-page min-[90rem]:container-wide">
          <Reveal>
            <SectionHeading id="shop-application-title" eyebrow="By application" title="Shop by Area" description="See products suited to the area you are working on." />
          </Reveal>
          <ul className="mt-[var(--heading-gap)] grid grid-cols-1 gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 lg:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
            {applications.map((application, i) => (
              <Reveal as="li" key={application.slug} delay={Math.min(i, 5) * 0.06}>
                <ApplicationTile application={application} to={`/products?application=${application.slug}`} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <HelpBanner />
    </>
  )
}
