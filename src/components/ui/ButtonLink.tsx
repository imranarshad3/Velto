import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonLinkProps {
  to: string
  children: ReactNode
  variant?: Variant
  className?: string
}

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg whitespace-nowrap px-5 text-[0.9375rem] font-semibold transition-colors duration-200'

const variants: Record<Variant, string> = {
  primary: 'bg-forest text-white hover:bg-forest-dark',
  secondary: 'border border-ink/15 bg-surface/80 text-ink hover:border-forest hover:text-forest',
  ghost: 'text-forest hover:text-copper',
}

export default function ButtonLink({ to, children, variant = 'primary', className = '' }: ButtonLinkProps) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  )
}
