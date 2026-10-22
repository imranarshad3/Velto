import { Link } from 'react-router'

interface LogoProps {
  className?: string
  showTagline?: boolean
}

export default function Logo({ className = '', showTagline = true }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label="VELTO home"
      className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-md text-forest ${className}`}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className="size-10 shrink-0 sm:size-11">
        <path d="M24 2 44 13v22L24 46 4 35V13Z" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />
        <path d="M11 13h8l9 23h-8Z" fill="currentColor" />
        <path d="M29 13h8L28 36h-8Z" fill="var(--color-gold)" />
        <path d="M15 40h18" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.65" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-sans text-[1.25rem] font-semibold tracking-[0.16em] text-ink sm:text-[1.375rem]">VELTO</span>
        {showTagline && (
          <span className="mt-1 hidden whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-muted sm:block lg:hidden xl:block">
            Building Better Foundations
          </span>
        )}
      </span>
    </Link>
  )
}
