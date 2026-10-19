import { useCallback, useRef, useState, type FormEvent } from 'react'
import { LoaderCircle, Search } from 'lucide-react'
import { z } from 'zod'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { call, QuoteApiError } from '../../features/quotes/api.ts'
import type { Order } from '../../features/orders/schema.ts'
import { REFERENCE_PATTERN, TRACKING_PATTERN } from '../../features/orders/tracking.ts'
import OrderTrackingView from '../../features/orders/OrderTrackingView.tsx'
import { useLivePoll } from '../../features/orders/useLivePoll.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const lookupSchema = (signedIn: boolean) =>
  z.object({
    reference: z
      .string()
      .trim()
      .transform(v => v.toUpperCase())
      .refine(v => REFERENCE_PATTERN.test(v) || TRACKING_PATTERN.test(v), 'Enter an order reference (VEL-…) or tracking ID (VT…).'),
    contact: signedIn
      ? z.string().trim().max(200)
      : z.string().trim().min(3, 'Enter the email or phone number used at checkout.').max(200),
  })

/** Order tracking by reference or tracking ID, verified with the checkout email or phone (owners skip it). */
export default function OrderLookup() {
  const { signedIn, getToken } = useAppAuth()
  const [reference, setReference] = useState('')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [order, setOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const query = useRef<{ reference: string; contact?: string } | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!query.current) return
    const token = signedIn ? await getToken() : null
    const { order } = await call<{ order: Order }>('/api/orders?action=track', { method: 'POST', body: JSON.stringify(query.current) }, token)
    setOrder(order)
  }, [signedIn, getToken])

  const refresh = useCallback(() => {
    fetchOrder().catch(() => undefined)
  }, [fetchOrder])
  const updatedAt = useLivePoll(refresh, order ?? undefined, Boolean(order && order.status !== 'delivered' && order.status !== 'cancelled'))

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    const parsed = lookupSchema(signedIn).safeParse({ reference, contact })
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(i => [String(i.path[0]), i.message])))
      return
    }
    setErrors({})
    setLoading(true)
    setOrder(null)
    query.current = { reference: parsed.data.reference, ...(parsed.data.contact ? { contact: parsed.data.contact } : {}) }
    try {
      await fetchOrder()
    } catch (error) {
      query.current = null
      setMessage(error instanceof QuoteApiError ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-[var(--grid-gap)]">
      <section aria-labelledby="order-lookup-title" className="surface-card rounded-[var(--radius-panel)] p-[clamp(1.25rem,3vw,2.25rem)] shadow-[var(--shadow-lift)]">
        <h2 id="order-lookup-title" className="font-display text-[1.5rem]">Track an order</h2>
        <p className="mt-1 text-[0.875rem] text-muted">
          Enter your order reference or tracking ID{signedIn ? '. Orders in your account need nothing else.' : ', plus the email or phone number you used at checkout.'}
        </p>
        <form noValidate onSubmit={onSubmit} className="mt-5 grid gap-[var(--grid-gap)] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-start">
          <Field id="order-reference" label="Order reference or tracking ID" required error={errors.reference}>
            {a => <input {...a} value={reference} onChange={e => setReference(e.target.value)} placeholder="VEL-… or VT…" autoComplete="off" autoCapitalize="characters" spellCheck={false} className={`${inputClass} font-mono uppercase placeholder:font-sans placeholder:normal-case`} />}
          </Field>
          <Field id="order-contact" label="Email or phone" required={!signedIn} error={errors.contact}>
            {a => <input {...a} value={contact} onChange={e => setContact(e.target.value)} autoComplete="email" spellCheck={false} className={inputClass} />}
          </Field>
          <button type="submit" disabled={loading} className={buttonClass('primary', 'md', 'md:mt-[1.8rem]')}>
            {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Search aria-hidden="true" className="size-4" />} Track order
          </button>
        </form>
        <div aria-live="polite">
          {message && <p className="mt-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-[0.9375rem] font-semibold text-danger">{message}</p>}
        </div>
      </section>
      {order && <OrderTrackingView order={order} updatedAt={updatedAt} onRefresh={refresh} />}
    </div>
  )
}
