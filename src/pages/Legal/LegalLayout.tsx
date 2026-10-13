import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader.tsx'

export interface LegalSection {
  id: string
  title: string
  body: ReactNode
}

interface LegalLayoutProps {
  title: string
  updated: string
  intro: ReactNode
  sections: LegalSection[]
}

/** Long-form legal page with an in-page table of contents and a visible draft notice. */
export default function LegalLayout({ title, updated, intro, sections }: LegalLayoutProps) {
  return (
    <>
      <title>{`${title} — VELTO`}</title>
      <PageHeader title={title} crumbs={[{ label: 'Home', to: '/' }, { label: title }]} description={<p>Last updated {updated}</p>} />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[var(--content-pad)] pb-[var(--section-gap)] lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:block lg:self-start">
          <p className="px-3 text-[0.75rem] font-semibold tracking-[0.14em] text-muted uppercase">On this page</p>
          <ul className="mt-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex min-h-11 items-center rounded-lg px-3 text-[0.9375rem] hover:bg-sand hover:text-forest">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="surface-card max-w-[52rem] min-w-0 rounded-[var(--radius-panel)] p-[clamp(1.25rem,4vw,3rem)]">
          <p role="note" className="flex gap-3 rounded-xl border border-copper/30 bg-copper/5 p-4 text-[0.9375rem]">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-copper" />
            <span>
              <strong>Draft pending legal review.</strong> This page describes how the site currently works. The operator’s legal
              name, registered address, contact details and governing law will be added once confirmed.
            </span>
          </p>
          <div className="mt-6 text-[1.0625rem] leading-relaxed text-ink/90">{intro}</div>
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mt-10 scroll-mt-[calc(var(--header-height)+1.5rem)]">
              <h2 id={`${s.id}-title`} className="font-display text-[clamp(1.5rem,1.3rem+0.8vw,1.875rem)]">
                {s.title}
              </h2>
              <div className="mt-3 flex flex-col gap-3 leading-relaxed text-ink/85 [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">{s.body}</div>
            </section>
          ))}
        </article>
      </div>
    </>
  )
}
