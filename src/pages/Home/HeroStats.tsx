import type { SiteStat } from '../../data/siteStats.ts'

interface HeroStatsProps {
  stats: SiteStat[]
}

/** Renders nothing until verified figures exist. */
export default function HeroStats({ stats }: HeroStatsProps) {
  if (stats.length === 0) return null

  return (
    <dl className="mt-10 flex flex-wrap gap-y-4 divide-x divide-border">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col-reverse px-5 first:pl-0">
          <dt className="text-[0.8125rem] text-muted">{stat.label}</dt>
          <dd className="font-display text-[1.75rem] leading-tight text-ink">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
