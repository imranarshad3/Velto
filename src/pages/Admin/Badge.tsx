import type { ReactNode } from 'react'

const tones = {
  green: 'bg-forest text-white',
  soft: 'bg-forest-soft text-forest',
  sand: 'bg-sand text-ink',
  copper: 'bg-copper/10 text-copper',
  muted: 'bg-ink/10 text-ink',
}

export default function Badge({ tone = 'soft', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold whitespace-nowrap ${tones[tone]}`}>{children}</span>
}
