import { useContentData } from '../../features/cms/context.ts'
import { useContent } from '../../features/cms/context.ts'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import Img from '../../components/ui/Img.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import { applicationDetails as defaultapplicationDetails } from '../../data/applications.ts'
import { applications as defaultapplications } from '../../data/homeContent.ts'
import ApplicationCard from './ApplicationCard.tsx'

export default function ApplicationsPage() {
  const applicationDetails = useContentData('applications', 'ApplicationDetails.data', defaultapplicationDetails)
  const applications = useContentData('applications', 'Applications.data', defaultapplications)
  const cms = useContent('applications', 'ApplicationsPage')
  const preview = applications.slice(0, 3).map((a) => applicationDetails[a.slug]?.image).filter((i) => i !== undefined)

  return (
    <>
      <title>{cms("field-1", "Applications — VELTO")}</title>
      <meta name="description" content={cms("field-2", "Construction chemical solutions by application: bathrooms, kitchens, roofs, floors, pools and exterior walls.")} />
      <PageHeader
        eyebrow={cms("field-3", "Applications")}
        title={cms("field-4", "Solutions for every area")}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Applications' }]}
        description={cms("field-5", "Start from the space you are building or repairing to see the typical sequence of work and the product types involved.")}
        aside={
          <div aria-hidden="true" className="grid w-[clamp(18rem,26vw,24rem)] grid-cols-2 grid-rows-2 gap-[var(--grid-gap)]">
            {preview.map((image, i) => (
              <div key={image.src} className={`overflow-hidden rounded-[var(--radius-card)] bg-sand-deep shadow-[var(--shadow-card)] ring-1 ring-white/70 ${i === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-[4/3]'}`}>
                <Img image={image} alt={cms("field-6", "")} priority className="size-full object-cover" />
              </div>
            ))}
          </div>
        }
      />
      <section aria-labelledby="applications-grid-title" className="container-page py-[var(--section-gap)]">
        <h2 id="applications-grid-title" className="sr-only">
          {cms("field-7", "All applications")}</h2>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
          {applications.map((application, i) => (
            <Reveal as="li" key={application.slug} delay={(i % 3) * 0.08}>
              <ApplicationCard application={application} long />
            </Reveal>
          ))}
        </ul>
      </section>
      <HelpBanner />
    </>
  )
}
