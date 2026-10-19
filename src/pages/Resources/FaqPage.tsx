import { useContentData, useContent, useContentReady } from '../../features/cms/context.ts'
import { ChevronDown } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import PageHeader, { PageHeaderSkeleton } from '../../components/ui/PageHeader.tsx'
import { faqGroups as defaultfaqGroups } from '../../data/faq.ts'

export default function FaqPage() {
  const ready = useContentReady('faq')
  const faqGroups = useContentData('faq', 'Questions.data', defaultfaqGroups)
  const cms = useContent('faq', 'FaqPage')

  if (!ready) {
    return (
      <>
        <title>FAQ — VELTO</title>
        <PageHeaderSkeleton />
      </>
    )
  }
  return (
    <>
      <title>{cms("field-1", "FAQ — VELTO")}</title>
      <meta name="description" content={cms("field-2", "Answers about quotes, ordering, products, delivery and accounts at VELTO.")} />
      <PageHeader eyebrow={cms("field-3", "Help")} title={cms("field-4", "Frequently asked questions")} crumbs={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]} />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[var(--content-pad)] pb-[var(--section-gap)] lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="FAQ topics" className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
          <ul className="no-scrollbar -mx-[var(--page-gutter)] flex gap-2 overflow-x-auto px-[var(--page-gutter)] lg:mx-0 lg:flex-col lg:px-0">
            {faqGroups.map((g) => (
              <li key={g.id} className="shrink-0">
                <a href={`#${g.id}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-[0.9375rem] whitespace-nowrap hover:border-forest hover:text-forest lg:w-full lg:rounded-lg">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-10">
          {faqGroups.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-[calc(var(--header-height)+1.5rem)]">
              <h2 id={`${g.id}-title`} className="font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)]">
                {g.title}
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                {g.items.map((item) => (
                  <details key={item.q} className="group surface-card rounded-2xl transition-[border-color,box-shadow] duration-300 open:border-forest/25 open:shadow-[var(--shadow-lift)]">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold transition-colors hover:text-forest group-open:text-forest [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-sand text-muted transition-[background-color,color] group-open:bg-forest group-open:text-white">
                        <ChevronDown className="size-4 transition-transform duration-300 group-open:rotate-180" />
                      </span>
                    </summary>
                    <p className="px-4 pb-4 text-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <div className="rounded-[var(--radius-card)] bg-sand p-6">
            <p className="font-display text-[1.375rem]">{cms("field-5", "Still have a question?")}</p>
            <ButtonLink to={cms("field-6", "/contact")} className="mt-3">
              {cms("field-7", "Contact us")}</ButtonLink>
          </div>
        </div>
      </div>
    </>
  )
}
