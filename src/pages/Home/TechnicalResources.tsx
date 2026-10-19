import { useContentData } from '../../features/cms/context.ts'
import { useContent } from '../../features/cms/context.ts'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import Reveal from '../../components/ui/Reveal.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { resources as defaultresources } from '../../data/homeContent.ts'

export default function TechnicalResources() {
  const resources = useContentData('home', 'TechnicalResources.data', defaultresources)
  const cms = useContent('home', 'TechnicalResources')
  return (
    <section aria-labelledby="resources-title" className="bg-cream py-[var(--section-gap)]">
      <div className="container-page grid gap-[clamp(1.75rem,4vw,4rem)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <Reveal className="min-w-0">
          <SectionHeading
            id="resources-title"
            eyebrow={cms("field-1", "Guides and tools")}
            title={cms("field-2", "Product guides")}
            description={cms("field-3", "Guides and tools to help you choose and apply products correctly.")}
          />
          <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-sand-deep p-5">
            <p className="text-[0.9375rem] leading-relaxed text-muted">
              {cms("field-4", "Find product details and how-to guides, or work out how much material you need.")}</p>
            <ButtonLink to={cms("field-5", "/resources")} variant="secondary" className="mt-4">
              {cms("field-6", "See all guides ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
            </ButtonLink>
          </div>
        </Reveal>

        {/* Index-style list: distinct from the card grids elsewhere on the page. */}
        <ul className="surface-card min-w-0 divide-y divide-border overflow-hidden">
          {resources.map(({ title, text, icon: Icon, href }, index) => {
            const body = (
              <>
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-copper-soft text-copper">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{title}</span>
                  <span className="mt-0.5 block text-[0.875rem] text-muted">{text}</span>
                  {!href && <span className="mt-2 inline-block rounded-full border border-border bg-sand px-2.5 py-0.5 text-[0.75rem] font-semibold text-muted sm:hidden">{cms("field-7", "Coming soon")}</span>}
                </span>
                {href ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.875rem] font-semibold text-forest">
                    <span className="max-[30rem]:sr-only">{href.startsWith('#') ? 'Get help' : 'Open'}</span>
                    <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                ) : (
                  <span className="hidden shrink-0 rounded-full border border-border bg-sand px-2.5 sm:inline-block py-0.5 text-[0.75rem] font-semibold text-muted">
                    {cms("field-8", "Coming soon")}</span>
                )}
              </>
            )
            const row = 'flex min-h-[5.5rem] items-center gap-4 px-[clamp(1rem,3vw,1.75rem)] py-4'

            return (
              <Reveal as="li" key={title} delay={index * 0.06}>
                {href?.startsWith('#') ? (
                  <a href={href} className={`group ${row} transition-colors duration-300 hover:bg-forest-soft/50`}>
                    {body}
                  </a>
                ) : href ? (
                  <Link to={href} className={`group ${row} transition-colors duration-300 hover:bg-forest-soft/50`}>
                    {body}
                  </Link>
                ) : (
                  <div className={row}>{body}</div>
                )}
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
