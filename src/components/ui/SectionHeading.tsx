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

/**
 * Section heading. The optional eyebrow sits on the rule that opens the section, so it reads as
 * a section marker in a technical document rather than a decorative label: sentence case, no
 * letter-spacing, no accent colour.
 */
export default function SectionHeading({ id, title, eyebrow, description, action, tone = 'light', align = 'left' }: SectionHeadingProps) {
  const dark = tone === 'dark'
  const center = align === 'center'

  return (
    <div
      className={`flex gap-5 border-t pt-5 sm:gap-8 ${dark ? 'border-white/20' : 'border-ink/15'} ${
        center ? 'flex-col items-center text-center' : 'flex-wrap items-end justify-between'
      }`}
    >
      <div className={`min-w-0 max-w-[42rem] flex-1 ${center ? 'flex flex-col items-center' : ''}`}>
        {eyebrow && (
          <p className={`mb-3 text-[0.875rem] font-medium ${dark ? 'text-white/65' : 'text-muted'}`}>{eyebrow}</p>
        )}
        <h2 id={id} className={`font-display text-[length:var(--h2)] ${dark ? 'text-white' : 'text-ink'}`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-4 max-w-[38rem] text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed ${dark ? 'text-white/75' : 'text-muted'}`}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
