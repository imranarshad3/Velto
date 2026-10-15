/**
 * Shared button styles for <button>, <Link> and <a>. Every size keeps a >= 2.75rem tap target.
 *   className={buttonClass('primary', 'lg')}
 */
export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'light' | 'outline-light' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-[var(--ease-premium)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0'

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-[0.875rem]',
  md: 'min-h-12 px-5 text-[0.9375rem]',
  lg: 'min-h-[3.25rem] px-7 text-[1rem]',
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(180deg,var(--color-forest-mid),var(--color-forest))] text-white shadow-[var(--shadow-button)] hover:bg-[linear-gradient(180deg,var(--color-forest),var(--color-forest-dark))] hover:shadow-[0_0.75rem_1.75rem_-0.75rem_rgb(41_76_104/0.75)]',
  accent:
    'bg-copper text-white shadow-[0_0.5rem_1.25rem_-0.625rem_rgb(135_99_41/0.7)] hover:bg-copper-hover',
  secondary: 'border border-ink/12 bg-surface text-ink shadow-[var(--shadow-soft)] hover:border-forest/40 hover:text-forest',
  ghost: 'text-forest hover:bg-forest-soft/70',
  light: 'bg-white text-forest-dark shadow-[0_0.5rem_1.5rem_-0.75rem_rgb(0_0_0/0.45)] hover:bg-cream',
  'outline-light': 'border border-white/35 text-white hover:border-white hover:bg-white/10',
  danger: 'border border-danger/30 bg-surface text-danger hover:bg-danger-soft',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = ''): string {
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`.trim()
}

/** Arrow icons inside buttons nudge on hover: add to the icon's className. */
export const buttonArrow = 'transition-transform duration-300 group-hover/btn:translate-x-0.5'
