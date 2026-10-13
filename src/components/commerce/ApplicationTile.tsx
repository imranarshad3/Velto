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
      className="group flex h-full items-center gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-card)] sm:p-5"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest transition-colors group-hover:bg-forest group-hover:text-white">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{name}</span>
        <span className="block text-[0.875rem] text-muted">{text}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
    </Link>
  )
}
