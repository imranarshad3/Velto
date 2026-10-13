import ApplicationTile from '../../components/commerce/ApplicationTile.tsx'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { applications } from '../../data/homeContent.ts'

/** Application showcase (filters this page) followed by the professional assistance banner. */
export default function ProductsAssistance() {
  return (
    <>
      <section aria-labelledby="shop-application-title" className="bg-sand py-[var(--section-gap)]">
        <div className="container-page">
          <SectionHeading id="shop-application-title" title="Shop by Application" description="See products suited to the area you are working on." />
          <ul className="mt-8 grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {applications.map((application) => (
              <li key={application.slug}>
                <ApplicationTile application={application} to={`/products?application=${application.slug}`} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HelpBanner />
    </>
  )
}
