import { useContent, useContentReady } from '../../features/cms/context.ts'
import { Link } from 'react-router'
import { ArrowRight, Calculator, FileText, LifeBuoy, Map as MapIcon, Search, type LucideIcon } from 'lucide-react'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import PageHeader, { PageHeaderSkeleton } from '../../components/ui/PageHeader.tsx'
import Reveal from '../../components/ui/Reveal.tsx'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { useResources } from '../../features/resources/useResources.ts'

interface ResourceTile {
  icon: LucideIcon
  title: string
  text: string
  to: string
  kind: string
}

const resources: ResourceTile[] = [
  { icon: FileText, title: 'Resource Center', text: 'Search and download data sheets, installation guides and safety documents.', to: '/resources/documents', kind: 'Library' },
  { icon: Calculator, title: 'Coverage calculator', text: 'Work out material and pack quantities from your area and manufacturer coverage data, then request them in a quote.', to: '/resources/coverage-calculator', kind: 'Tool' },
  { icon: LifeBuoy, title: 'FAQ', text: 'How quotes, accounts, products and delivery work.', to: '/faq', kind: 'Help' },
  { icon: MapIcon, title: 'Application guides', text: 'Typical sequences for bathrooms, roofs, floors and more.', to: '/applications', kind: 'Guides' },
  { icon: Search, title: 'Track a request', text: 'Check a guest quote request with your reference and code.', to: '/track', kind: 'Service' },
]

export default function ResourcesPage() {
  const ready = useContentReady('resources')
  const cms = useContent('resources', 'ResourcesPage')
  const { products } = useCatalog()
  const [state] = useResources()
  const docCount = state.kind === 'ready' ? state.data.resources.length + products.filter((p) => p.verified).reduce((n, p) => n + (p.documents?.length ?? 0), 0) : null
  const calcCount = state.kind === 'ready' ? state.data.coverage.length : null

  if (!ready) {
    return (
      <>
        <title>Technical Resources — VELTO</title>
        <PageHeaderSkeleton />
      </>
    )
  }

  return (
    <>
      <title>{cms("field-1", "Resources — VELTO")}</title>
      <meta name="description" content={cms("field-2", "Technical documents, a coverage calculator, application guides and FAQs.")} />
      <PageHeader
        eyebrow={cms("field-3", "Resources")}
        title={cms("field-4", "Tools and information for your project")}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources' }]}
        description={cms("field-5", "Everything that helps you choose, quantify and apply the right products.")}
      />
      <section aria-label="Resources" className="container-page py-[var(--section-gap)]">
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-6 lg:gap-[var(--grid-gap-lg)]">
          {resources.map(({ icon: Icon, title, text, to, kind }, i) => {
            const featured = i < 2
            // Live counts instead of placeholder labels; both tools work even before data is published.
            const badge = to === '/resources/documents' && docCount !== null ? `${docCount} ${docCount === 1 ? 'document' : 'documents'}` : to === '/resources/coverage-calculator' && calcCount ? `${calcCount} verified ${calcCount === 1 ? 'product' : 'products'}` : kind
            return (
              <Reveal as="li" key={to} delay={(i % 3) * 0.08} className={featured ? 'sm:col-span-1 lg:col-span-3' : 'lg:col-span-2'}>
                <Link
                  to={to}
                  className={`group relative isolate flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border p-6 transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0 sm:p-7 ${
                    i === 1
                      ? 'border-transparent bg-forest-deep text-white shadow-[var(--shadow-card)]'
                      : 'border-border bg-surface shadow-[var(--shadow-soft)] hover:border-forest/25'
                  } ${featured ? 'lg:min-h-[17rem] lg:p-9' : ''}`}
                >
                  {i === 1 && (
                    <>
                    </>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`grid size-12 place-items-center rounded-2xl transition-colors duration-300 ${
                        i === 1 ? 'bg-white/10 text-mint ring-1 ring-white/15' : 'bg-copper-soft text-copper group-hover:bg-forest group-hover:text-white'
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-6" />
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[0.6875rem] font-bold tracking-[0.14em] uppercase ${
                        i === 1 ? 'bg-white/10 text-white/80' : 'bg-forest-soft text-forest'
                      }`}
                    >
                      {badge}
                    </span>
                  </div>
                  <h2 className={`mt-6 font-display leading-tight ${featured ? 'text-[clamp(1.625rem,1.4rem+0.8vw,2.125rem)]' : 'text-[1.5rem]'} ${i === 1 ? '' : 'group-hover:text-forest'}`}>{title}</h2>
                  <p className={`mt-2 max-w-[28rem] flex-1 text-[0.9375rem] leading-relaxed ${i === 1 ? 'text-white/75' : 'text-muted'}`}>
                    {text}
                  </p>
                  <span className={`mt-6 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold ${i === 1 ? 'text-mint' : 'text-forest'}`}>
                    {cms("field-6", "Open ")}<ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            )
          })}
        </ul>
      </section>
      <HelpBanner />
    </>
  )
}
