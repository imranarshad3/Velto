import { Link } from 'react-router'
import { X } from 'lucide-react'
import { useToasts } from '../../features/ui/toastStore.ts'

/** Polite live region for cart/wishlist feedback. */
export default function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto flex w-full max-w-[26rem] animate-[rise-in_0.3s_ease-out] items-center gap-3 rounded-xl bg-ink py-2 pr-2 pl-4 text-[0.9375rem] text-white shadow-[var(--shadow-card)]">
          <p className="flex-1">{toast.message}</p>
          {toast.action && (
            <Link to={toast.action.to} onClick={() => dismiss(toast.id)} className="inline-flex min-h-11 items-center rounded-lg px-3 font-semibold whitespace-nowrap text-[#e3c58f] hover:bg-white/10">
              {toast.action.label}
            </Link>
          )}
          <button type="button" onClick={() => dismiss(toast.id)} className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-white/10" aria-label="Dismiss notification">
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
