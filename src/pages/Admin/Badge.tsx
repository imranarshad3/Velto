import type { ReactNode } from 'react'

const tones = {
  green: 'bg-success-soft text-success ring-success/20',
  soft: 'bg-forest-soft text-forest ring-forest/15',
  sand: 'bg-sand text-ink ring-ink/10',
  copper: 'bg-copper-soft text-copper-hover ring-copper/20',
  muted: 'bg-ink/[0.05] text-muted ring-ink/10',
}

/** Status pill with an optional leading dot. */
export default function Badge({ tone = 'soft', dot = true, children }: { tone?: keyof typeof tones; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.75rem] leading-[1.25rem] font-semibold whitespace-nowrap capitalize ring-1 ring-inset ${tones[tone]}`}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}
