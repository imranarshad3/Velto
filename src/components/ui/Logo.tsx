import { Link } from 'react-router'

interface LogoProps {
  className?: string
  showTagline?: boolean
}

export default function Logo({ className = '', showTagline = true }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label="NOVARO home"
      className={`inline-flex min-h-11 items-center gap-2 rounded-md text-forest ${className}`}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0 sm:size-9">
        <path d="M3 29V5l9 6v18z" fill="currentColor" />
        <path d="M12 11l17-8v24l-9 2V15z" fill="currentColor" opacity="0.82" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-sans text-[1.25rem] font-bold tracking-[0.08em] text-ink sm:text-[1.375rem]">NOVARO</span>
        {showTagline && (
          <span className="mt-1 hidden whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-muted sm:block lg:hidden xl:block">
            Build a better tomorrow
          </span>
        )}
      </span>
    </Link>
  )
}
