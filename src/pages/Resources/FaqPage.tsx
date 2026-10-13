import { ChevronDown } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { faqGroups } from '../../data/faq.ts'

export default function FaqPage() {
  return (
    <>
      <title>FAQ — NOVARO</title>
      <meta name="description" content="Answers about quotes, ordering, products, delivery and accounts at NOVARO." />
      <PageHeader eyebrow="Help" title="Frequently asked questions" crumbs={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]} />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[clamp(2rem,4vw,3.5rem)] pb-[var(--section-gap)] lg:grid-cols-[14rem_minmax(0,1fr)]">
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
                  <details key={item.q} className="group rounded-xl border border-border bg-surface open:shadow-[var(--shadow-card)]">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-4 pb-4 text-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <div className="rounded-[var(--radius-card)] bg-sand p-6">
            <p className="font-display text-[1.375rem]">Still have a question?</p>
            <ButtonLink to="/contact" className="mt-3">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  )
}
