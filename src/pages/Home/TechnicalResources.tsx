import { ArrowRight } from 'lucide-react'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import { resources } from '../../data/homeContent.ts'

export default function TechnicalResources() {
  return (
    <section aria-labelledby="resources-title" className="border-t border-border py-[var(--section-gap)]">
      <div className="container-page">
        <SectionHeading
          id="resources-title"
          title="Technical Resources"
          description="Documentation to help you choose and apply products correctly."
        />
        <ul className="mt-8 grid gap-4 min-[30rem]:grid-cols-2 lg:grid-cols-4">
          {resources.map(({ title, text, icon: Icon, href }) => {
            const body = (
              <>
                <span className="grid size-11 place-items-center rounded-xl bg-sand text-copper">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="mt-4 block font-semibold text-ink">{title}</span>
                <span className="mt-1 block text-[0.875rem] text-muted">{text}</span>
                {href ? (
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[0.875rem] font-semibold text-forest">
                    Get help <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                ) : (
                  <span className="mt-auto pt-4">
                    <span className="inline-block rounded-full bg-sand px-2.5 py-0.5 text-[0.75rem] font-semibold text-muted">
                      Coming soon
                    </span>
                  </span>
                )}
              </>
            )
            const card = 'flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-surface p-5'

            return (
              <li key={title}>
                {href ? (
                  <a href={href} className={`${card} transition-shadow hover:shadow-[var(--shadow-card)]`}>
                    {body}
                  </a>
                ) : (
                  <div className={card}>{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
