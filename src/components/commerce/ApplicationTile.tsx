import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import type { Application } from '../../data/homeContent.ts'

interface ApplicationTileProps {
  application: Application
  to?: string
}

export default function ApplicationTile({ application, to }: ApplicationTileProps) {
  const { slug, name, text, icon: Icon } = application

  return (
    <Link
      to={to ?? `/applications/${slug}`}
      className="group relative flex h-full items-center gap-4 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)] transition-[box-shadow,border-color,transform] duration-300 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:border-forest/25 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0 sm:p-5"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest ring-1 ring-forest/10 transition-colors duration-300 group-hover:bg-forest group-hover:text-white">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink transition-colors group-hover:text-forest">{name}</span>
        <span className="mt-0.5 block text-[0.875rem] leading-snug text-muted">{text}</span>
      </span>
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted transition-[background-color,color,border-color] duration-300 group-hover:border-forest group-hover:bg-forest group-hover:text-white">
        <ArrowRight className="size-4" />
      </span>
    </Link>
  )
}
