import { useContentData, useContent, useContentReady } from '../../features/cms/context.ts'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import Img from '../../components/ui/Img.tsx'
import PageHeader, { PageHeaderSkeleton } from '../../components/ui/PageHeader.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import { applicationDetails as defaultapplicationDetails } from '../../data/applications.ts'
import { applications as defaultapplications } from '../../data/homeContent.ts'
import ApplicationCard from './ApplicationCard.tsx'

export default function ApplicationsPage() {
  const ready = useContentReady('applications')
  const applicationDetails = useContentData('applications', 'ApplicationDetails.data', defaultapplicationDetails)
  const applications = useContentData('applications', 'Applications.data', defaultapplications)
  const cms = useContent('applications', 'ApplicationsPage')

  if (!ready) {
    return (
      <>
        <title>Shop by Area — VELTO</title>
        <PageHeaderSkeleton />
      </>
    )
  }
  const preview = applications.slice(0, 3).flatMap((application) => {
    const image = applicationDetails[application.slug]?.image
    return image ? [{ application, image }] : []
  })

  return (
    <>
      <title>{cms("field-1", "Shop by Area — VELTO")}</title>
      <meta name="description" content={cms("field-2", "Construction chemical solutions by application: bathrooms, kitchens, roofs, floors, pools and exterior walls.")} />
      <PageHeader
        className="area-editorial-header"
        actions={<ButtonLink to="#applications-grid-title" variant="primary" size="lg">See all areas <ArrowRight aria-hidden="true" className="size-4" /></ButtonLink>}
        eyebrow={cms("field-3", "Shop by Area")}
        title={cms("field-4", "Find products for every area")}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Shop by Area' }]}
        description={cms("field-5", "Choose the area you are working on to see the usual steps and products.")}
        aside={
          <div className="area-image-composition">
            {preview.map(({ application, image }, i) => (
              <Link to={`/applications/${application.slug}`} key={application.slug} className={`area-image-card group ${i === 0 ? 'area-image-main' : ''}`}>
                <Img image={image} priority fit="contain" className="absolute inset-0 size-full object-contain" />
                <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-forest-deep/85 via-forest-deep/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                  <span><span className="mb-1 block text-[0.625rem] font-semibold tracking-[0.2em] text-gold uppercase">Shop this area</span><span className="font-display text-[1.5rem]">{application.name}</span></span>
                  <ArrowRight aria-hidden="true" className="mb-1 size-5 shrink-0" />
                </span>
              </Link>
            ))}
          </div>
        }
      />
      <section aria-labelledby="applications-grid-title" className="container-page py-[var(--section-gap)]">
        <h2 id="applications-grid-title" className="sr-only scroll-mt-28">
          {cms("field-7", "All applications")}</h2>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
          {applications.map((application, i) => (
            <Reveal as="li" key={application.slug} delay={(i % 3) * 0.08}>
              <ApplicationCard application={application} long />
            </Reveal>
          ))}
        </ul>
      </section>
      <HelpBanner premium />
    </>
  )
}
