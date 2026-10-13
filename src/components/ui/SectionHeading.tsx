import type { ReactNode } from 'react'

interface SectionHeadingProps {
  id: string
  title: string
  eyebrow?: string
  description?: string
  action?: ReactNode
  tone?: 'light' | 'dark'
}

export default function SectionHeading({ id, title, eyebrow, description, action, tone = 'light' }: SectionHeadingProps) {
  const dark = tone === 'dark'

  return (
    <div className="flex items-end justify-between gap-4 sm:gap-6">
      <div className="min-w-0 max-w-[40rem] flex-1">
        {eyebrow && (
          <p className={`mb-2 text-[0.75rem] font-semibold tracking-[0.16em] uppercase ${dark ? 'text-[#e3c58f]' : 'text-copper'}`}>
            {eyebrow}
          </p>
        )}
        <h2 id={id} className={`font-display text-[length:var(--h2)] leading-[1.1] ${dark ? 'text-white' : 'text-ink'}`}>
          {title}
        </h2>
        {description && <p className={`mt-2 text-[0.9375rem] ${dark ? 'text-white/75' : 'text-muted'}`}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
