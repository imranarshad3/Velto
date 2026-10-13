import type { ReactNode } from 'react'

interface SectionHeadingProps {
  id: string
  title: string
  eyebrow?: string
  description?: string
  action?: ReactNode
  tone?: 'light' | 'dark'
  align?: 'left' | 'center'
}

/** Eyebrow with a short accent rule, display-serif title and optional supporting line/action. */
export default function SectionHeading({ id, title, eyebrow, description, action, tone = 'light', align = 'left' }: SectionHeadingProps) {
  const dark = tone === 'dark'
  const center = align === 'center'

  return (
    <div className={`flex gap-5 sm:gap-8 ${center ? 'flex-col items-center text-center' : 'flex-wrap items-end justify-between'}`}>
      <div className={`min-w-0 max-w-[42rem] flex-1 ${center ? 'flex flex-col items-center' : ''}`}>
        {eyebrow && (
          <p className={`mb-4 flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] uppercase ${dark ? 'text-gold' : 'text-copper'}`}>
            <span aria-hidden="true" className={`h-px w-8 ${dark ? 'bg-gold/70' : 'bg-copper/60'}`} />
            {eyebrow}
            {center && <span aria-hidden="true" className={`h-px w-8 ${dark ? 'bg-gold/70' : 'bg-copper/60'}`} />}
          </p>
        )}
        <h2 id={id} className={`font-display text-[length:var(--h2)] leading-[1.08] tracking-[-0.01em] ${dark ? 'text-white' : 'text-ink'}`}>
          {title}
        </h2>
        {description && <p className={`mt-4 max-w-[38rem] text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed ${dark ? 'text-white/75' : 'text-muted'}`}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
