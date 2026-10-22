/**
 * Shared button styles for <button>, <Link> and <a>. Every size keeps a >= 2.75rem tap target.
 *   className={buttonClass('primary', 'lg')}
 */
export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'light' | 'outline-light' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-premium)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0'

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-[0.875rem]',
  md: 'min-h-12 px-5 text-[0.9375rem]',
  lg: 'min-h-[3.25rem] px-7 text-[1rem]',
}

/* Flat fills, no gradients: the pack blue and the signal yellow are the only two emphatic
   surfaces, so weight comes from colour and area rather than from glow. */
const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-forest text-white shadow-[var(--shadow-button)] hover:bg-forest-dark',
  /* Signal yellow carries ink text — yellow with white text is unreadable. */
  accent:
    'bg-copper text-ink shadow-[var(--shadow-button)] hover:bg-[#dca40c]',
  secondary: 'border border-ink/15 bg-surface text-ink hover:border-forest hover:text-forest',
  ghost: 'text-forest hover:bg-forest-soft',
  light: 'bg-white text-forest-dark hover:bg-sand',
  'outline-light': 'border border-white/35 text-white hover:border-gold hover:text-gold',
  danger: 'border border-danger/30 bg-surface text-danger hover:bg-danger-soft',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = ''): string {
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`.trim()
}

/** Arrow icons inside buttons nudge on hover: add to the icon's className. */
export const buttonArrow = 'transition-transform duration-300 group-hover/btn:translate-x-0.5'
