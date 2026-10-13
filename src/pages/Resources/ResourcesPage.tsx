import { Link } from 'react-router'
import { ArrowRight, Calculator, FileText, LifeBuoy, Map as MapIcon, Search } from 'lucide-react'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'

const resources = [
  { icon: FileText, title: 'Technical documents', text: 'Data sheets and installation guides for verified products.', to: '/resources/documents' },
  { icon: Calculator, title: 'Coverage calculator', text: 'Work out material and pack quantities from your area and the data sheet.', to: '/resources/coverage-calculator' },
  { icon: LifeBuoy, title: 'FAQ', text: 'How quotes, accounts, products and delivery work.', to: '/faq' },
  { icon: MapIcon, title: 'Application guides', text: 'Typical sequences for bathrooms, roofs, floors and more.', to: '/applications' },
  { icon: Search, title: 'Track a request', text: 'Check a guest quote request with your reference and code.', to: '/track' },
]

export default function ResourcesPage() {
  return (
    <>
      <title>Resources — NOVARO</title>
      <meta name="description" content="Technical documents, a coverage calculator, application guides and FAQs." />
      <PageHeader eyebrow="Resources" title="Tools and information for your project" crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources' }]} description="Everything that helps you choose, quantify and apply the right products." />
      <section aria-label="Resources" className="container-page py-[var(--section-gap)]">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map(({ icon: Icon, title, text, to }) => (
            <li key={to}>
              <Link to={to} className="group flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-surface p-6 transition-shadow hover:shadow-[var(--shadow-card)]">
                <span className="grid size-12 place-items-center rounded-xl bg-sand text-copper transition-colors group-hover:bg-forest group-hover:text-white">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h2 className="mt-4 font-display text-[1.5rem] group-hover:text-forest">{title}</h2>
                <p className="mt-1 flex-1 text-[0.9375rem] text-muted">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-forest">
                  Open <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <HelpBanner />
    </>
  )
}
