import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  id: string
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right'
}

/** Off-canvas panel on native <dialog>: focus trap, Escape and inert background from the browser. */
export default function Drawer({ id, title, open, onClose, children, footer, side = 'right' }: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      closeRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`fixed inset-y-0 m-0 h-dvh max-h-none w-[min(92vw,24rem)] max-w-none bg-canvas p-0 text-ink backdrop:bg-ink/50 backdrop:open:animate-[fade-in_0.3s_ease-out] ${side === 'right' ? 'right-0 left-auto open:animate-[slide-in-right_0.3s_ease-out]' : 'left-0 open:animate-[slide-in-left_0.3s_ease-out]'}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <h2 id={`${id}-title`} className="font-display text-[1.5rem]">
            {title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} className="grid size-11 place-items-center rounded-lg hover:bg-sand" aria-label={`Close ${title.toLowerCase()}`}>
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-border p-4">{footer}</div>}
      </div>
    </dialog>
  )
}
