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
      className={`inline-flex min-h-11 items-center gap-2 rounded-md text-forest ${className}`}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0 sm:size-9">
        <path d="M2 4h7.5l7 16.7L12.5 29z" fill="currentColor" />
        <path d="M22.5 4H30L19.5 29h-7z" fill="currentColor" opacity="0.82" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-sans text-[1.25rem] font-bold tracking-[0.08em] text-ink sm:text-[1.375rem]">VELTO</span>
        {showTagline && (
          <span className="mt-1 hidden whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-muted sm:block lg:hidden xl:block">
            Building Better Foundations
          </span>
        )}
      </span>
    </Link>
  )
}
