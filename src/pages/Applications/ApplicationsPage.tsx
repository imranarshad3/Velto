import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import Img from '../../components/ui/Img.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { applicationDetails } from '../../data/applications.ts'
import { applications } from '../../data/homeContent.ts'
import { Link } from 'react-router'

export default function ApplicationsPage() {
  return (
    <>
      <title>Applications — NOVARO</title>
      <meta name="description" content="Construction chemical solutions by application: bathrooms, kitchens, roofs, floors, pools and exterior walls." />
      <PageHeader
        eyebrow="Applications"
        title="Solutions for every area"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Applications' }]}
        description="Start from the space you are building or repairing to see the typical sequence of work and the product types involved."
      />
      <section aria-labelledby="applications-grid-title" className="container-page py-[var(--section-gap)]">
        <h2 id="applications-grid-title" className="sr-only">
          All applications
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => {
            const detail = applicationDetails[application.slug]
            return (
              <li key={application.slug}>
                <Link to={`/applications/${application.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition-shadow hover:shadow-[var(--shadow-card)]">
                  <div className="aspect-[16/10] overflow-hidden bg-sand-deep">
                    {detail && <Img image={detail.image} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-[1.5rem] group-hover:text-forest">{application.name}</h3>
                    <p className="mt-1 text-[0.9375rem] text-muted">{detail?.intro ?? application.text}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
      <HelpBanner />
    </>
  )
}
