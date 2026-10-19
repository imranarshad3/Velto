import { useContentData } from '../../features/cms/context.ts'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import Img from '../../components/ui/Img.tsx'
import { applicationDetails } from '../../data/applications.ts'
import type { Application } from '../../data/homeContent.ts'

interface ApplicationCardProps {
  application: Application
  /** Heading level for the card title. */
  as?: 'h2' | 'h3'
  /** Show the longer intro instead of the short summary. */
  long?: boolean
}

/** Image-led application card used on the Applications and Solutions pages. */
export default function ApplicationCard({ application, as: Heading = 'h3', long = false }: ApplicationCardProps) {
  const details = useContentData('applications', 'ApplicationDetails.data', applicationDetails)
  const detail = details[application.slug]
  const Icon = application.icon

  return (
    <Link
      to={`/applications/${application.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-soft)] transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:border-forest/25 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-deep">
        {detail && (
          <Img
            image={detail.image}
            alt=""
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(21_43_64/0.55))]" />
        <span className="glass absolute bottom-3 left-3 grid size-11 place-items-center rounded-2xl text-forest shadow-[var(--shadow-soft)]">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white/90 text-forest opacity-0 shadow-[var(--shadow-soft)] transition-[opacity,transform] duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <Heading className="font-display text-[1.5rem] leading-tight transition-colors group-hover:text-forest">{application.name}</Heading>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{long ? (detail?.intro ?? application.text) : application.text}</p>
        {detail && (
          <p className="mt-auto pt-4 text-[0.75rem] font-bold tracking-[0.14em] text-copper uppercase">
            {detail.steps.length} step sequence
          </p>
        )}
      </div>
    </Link>
  )
}
