import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { inputClass } from '../../components/ui/form/Field.tsx'

/** Shared presentation primitives for the admin console (presentation only, no data logic). */

/** Bordered card section with an optional header row. */
export function Panel({
  id,
  title,
  description,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
}: {
  id?: string
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={`surface-card overflow-clip ${className}`}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={id} className="text-[1rem] leading-snug font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[0.8125rem] text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

/** Segmented status filter. Buttons keep aria-pressed so state is announced. */
export function FilterTabs<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar max-w-full min-w-0 overflow-x-auto">
      <div role="group" aria-label={label} className="inline-flex gap-1 rounded-xl border border-border bg-sand/60 p-1">
        {options.map((o) => {
          const active = value === o.value
          return (
            <button
              key={o.label}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`min-h-11 shrink-0 rounded-lg px-3.5 text-[0.875rem] font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 ${active ? 'bg-surface text-forest shadow-[var(--shadow-soft)] ring-1 ring-ink/5' : 'text-muted hover:bg-surface/60 hover:text-ink'}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Search/filter input with a leading icon. */
export function SearchInput({ id, label, value, onChange, placeholder, className = '' }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-muted" />
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} pl-11`} />
    </div>
  )
}

/** Toolbar row above a table: filters left, search/actions right. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">{children}</div>
}

/** Result count line under the toolbar. */
export function ResultCount({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.8125rem] font-medium text-muted tabular-nums" aria-live="polite">
      {children}
    </p>
  )
}

/** Shared table styling: sticky header under the site header, hover rows. Wrap in a `surface-card overflow-clip`. */
export const th = 'sticky top-[calc(var(--header-height)+1px)] z-10 border-b border-border bg-cream/95 px-4 py-3 text-left text-[0.75rem] font-semibold tracking-[0.08em] text-muted uppercase backdrop-blur first:pl-5 last:pr-5'
export const td = 'border-b border-border px-4 py-3.5 align-middle first:pl-5 last:pr-5 group-last/row:border-b-0'
export const tr = 'group/row relative transition-colors duration-150 hover:bg-cream/60 focus-within:bg-cream/60'

/** Mobile card list container (shown below md, where the table is hidden). */
export const cardList = 'surface-card divide-y divide-border overflow-clip md:hidden'

/** Initials avatar for people rows. */
export function Avatar({ name, tone = 'forest' }: { name: string; tone?: 'forest' | 'copper' | 'sand' }) {
  const initials =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  const tones = { forest: 'bg-forest-soft text-forest', copper: 'bg-copper-soft text-copper-hover', sand: 'bg-sand text-ink' }
  return (
    <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-full text-[0.8125rem] font-bold ring-1 ring-ink/5 ${tones[tone]}`}>
      {initials}
    </span>
  )
}
