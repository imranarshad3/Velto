import { Link } from 'react-router'
import { FileText } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { productPath } from '../../data/catalog.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'

/** Lists supplier documents attached to verified catalogue entries; nothing is invented. */
export default function DocumentsPage() {
  const { products } = useCatalog()
  const withDocs = products.filter((p) => p.verified && p.documents?.length)

  return (
    <>
      <title>Technical Documents — NOVARO</title>
      <PageHeader
        eyebrow="Resources"
        title="Technical documents"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources', to: '/resources' }, { label: 'Technical Documents' }]}
        description="Data sheets, safety data and installation guides supplied by the manufacturer."
      />
      <div className="container-page py-[clamp(2rem,4vw,3.5rem)] pb-[var(--section-gap)]">
        {withDocs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Documents are on their way"
            actions={
              <>
                <ButtonLink to="/quote">Request product details</ButtonLink>
                <ButtonLink to="/contact" variant="secondary">
                  Contact us
                </ButtonLink>
              </>
            }
          >
            We publish technical documents only once they are supplied and verified by the manufacturer. Need one now? Ask in a quote
            request or send us a message.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {withDocs.map((p) => (
              <li key={p.slug} className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                <Link to={productPath(p)} className="font-display text-[1.375rem] hover:text-forest">
                  {p.name}
                </Link>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {p.documents!.map((d) => (
                    <li key={d.url}>
                      <a href={d.url} download className="flex min-h-11 items-center gap-3 rounded-xl border border-border p-3 hover:border-forest">
                        <FileText aria-hidden="true" className="size-5 text-copper" />
                        <span className="flex-1 font-semibold">{d.title}</span>
                        <span className="text-[0.75rem] text-muted uppercase">{d.fileType}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
