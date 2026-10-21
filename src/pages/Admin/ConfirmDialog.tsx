import { useEffect, useRef, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { buttonClass } from '../../components/ui/button.ts'

/** Native modal confirmation: focus trap, Escape and inert background come from the platform. */
export default function ConfirmDialog({
  open,
  icon: Icon,
  title,
  children,
  confirmLabel,
  busyLabel,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean
  icon: LucideIcon
  title: ReactNode
  children: ReactNode
  confirmLabel: string
  busyLabel: string
  busy: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border bg-surface p-0 text-ink shadow-[var(--shadow-float)] backdrop:bg-forest-deep/50"
    >
      {open && (
        <div className="p-[clamp(1.25rem,4vw,1.75rem)]">
          <span className="grid size-12 place-items-center rounded-full bg-forest-soft text-forest">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <h2 id="confirm-title" className="mt-4 text-[1.25rem] leading-snug font-semibold">
            {title}
          </h2>
          <div id="confirm-desc" className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            {children}
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-copper/25 bg-copper-soft px-4 py-3 text-[0.875rem] text-copper-hover">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={busy} className={buttonClass('secondary')}>
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={busy} className={buttonClass('danger', 'md', 'disabled:opacity-60')}>
              {busy ? busyLabel : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
