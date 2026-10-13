import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { Link } from 'react-router'

export interface MenuItem {
  label: string
  icon?: LucideIcon
  /** Navigation item. */
  to?: string
  onSelect?: () => void
  disabled?: boolean
  /** Short reason shown under a disabled item. */
  hint?: string
  danger?: boolean
  /** Renders the item as a radio option (status pickers). */
  checked?: boolean
}

/**
 * Accessible action menu rendered in the top layer (native `popover`), so table cards never clip it.
 * Light dismiss and Escape come from the platform; arrow keys, Home/End move focus; focus returns to the trigger.
 */
export default function Menu({
  label,
  items,
  trigger,
  triggerClassName,
  disabled,
  align = 'end',
}: {
  label: string
  items: MenuItem[]
  trigger: ReactNode
  triggerClassName: string
  disabled?: boolean
  align?: 'start' | 'end'
}) {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const focusItem = (index: number) => {
    const els = [...(pop.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [])]
    if (els.length) els[(index + els.length) % els.length].focus()
  }

  const place = () => {
    const b = button.current?.getBoundingClientRect()
    const p = pop.current
    if (!b || !p) return
    const gap = 6
    const { offsetWidth: w, offsetHeight: h } = p
    const left = align === 'end' ? b.right - w : b.left
    const below = b.bottom + gap + h <= window.innerHeight
    p.style.left = `${Math.min(Math.max(8, left), window.innerWidth - w - 8)}px`
    p.style.top = `${below ? b.bottom + gap : Math.max(8, b.top - gap - h)}px`
  }

  useEffect(() => {
    const p = pop.current
    if (!p) return
    const onToggle = (e: Event) => {
      const isOpen = (e as ToggleEvent).newState === 'open'
      setOpen(isOpen)
      if (isOpen) {
        place()
        focusItem(Math.max(0, items.findIndex((i) => i.checked && !i.disabled)))
      }
    }
    p.addEventListener('toggle', onToggle)
    return () => p.removeEventListener('toggle', onToggle)
  })

  useEffect(() => {
    if (!open) return
    const close = () => pop.current?.hidePopover()
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  const close = (refocus = true) => {
    pop.current?.hidePopover()
    if (refocus) button.current?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const els = [...(pop.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [])]
    const at = els.indexOf(document.activeElement as HTMLElement)
    const next = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: els.length - 1 }[e.key]
    if (next !== undefined) {
      e.preventDefault()
      focusItem(next)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      close(false)
    }
  }

  const itemClass = (item: MenuItem) =>
    `flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[0.9375rem] outline-none transition-colors ${
      item.disabled ? 'cursor-not-allowed text-muted/70' : item.danger ? 'text-danger hover:bg-danger-soft focus:bg-danger-soft' : 'text-ink hover:bg-cream focus:bg-cream'
    }`

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        disabled={disabled}
        onClick={() => pop.current?.togglePopover()}
        className={triggerClassName}
      >
        {trigger}
      </button>
      <div
        ref={pop}
        id={id}
        popover="auto"
        role="menu"
        aria-label={label}
        onKeyDown={onKey}
        className="m-0 min-w-[13rem] rounded-xl border border-border bg-surface p-1.5 text-ink shadow-[var(--shadow-float)] [inset:auto]"
      >
        {items.map((item) => {
          const Icon = item.checked !== undefined ? (item.checked ? Check : null) : item.icon
          const role = item.checked !== undefined ? 'menuitemradio' : 'menuitem'
          const body = (
            <>
              <span className="grid size-[1.125rem] shrink-0 place-items-center">{Icon && <Icon aria-hidden="true" className="size-[1.125rem]" />}</span>
              <span className="min-w-0 flex-1 py-2 leading-tight">
                {item.label}
                {item.hint && <span className="mt-0.5 block text-[0.75rem] text-muted">{item.hint}</span>}
              </span>
            </>
          )
          if (item.to && !item.disabled) {
            return (
              <Link key={item.label} to={item.to} role={role} tabIndex={-1} onClick={() => close(false)} className={itemClass(item)}>
                {body}
              </Link>
            )
          }
          return (
            <button
              key={item.label}
              type="button"
              role={role}
              tabIndex={-1}
              aria-checked={item.checked}
              aria-disabled={item.disabled || undefined}
              onClick={() => {
                if (item.disabled) return
                close()
                item.onSelect?.()
              }}
              className={itemClass(item)}
            >
              {body}
            </button>
          )
        })}
      </div>
    </>
  )
}
