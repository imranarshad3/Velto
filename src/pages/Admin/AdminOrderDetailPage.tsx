import { useState } from 'react'
import { useParams } from 'react-router'
import { call, QuoteApiError } from '../../features/quotes/api.ts'
import type { AdminOrder } from '../../features/orders/schema.ts'
import AdminOrderDetail, { type OrderUpdate } from '../../features/orders/AdminOrderDetail.tsx'
import { StatusPill } from '../../features/orders/TrackingUI.tsx'
import { useLivePoll } from '../../features/orders/useLivePoll.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

export default function AdminOrderDetailPage() {
  const { orderId = '' } = useParams()
  const path = `/api/orders?admin=1&id=${encodeURIComponent(orderId)}`
  const [state, reload] = useAuthedRemote(t => (isUuid(orderId) ? call<{ orders: AdminOrder[] }>(path, { method: 'GET' }, t) : Promise.resolve({ orders: [] })), path)
  const { getToken } = useAppAuth()
  const show = useToasts(s => s.show)
  const [error, setError] = useState('')
  const order = state.kind === 'ready' ? state.data.orders[0] : undefined
  useLivePoll(reload, order, Boolean(order && order.status !== 'delivered' && order.status !== 'cancelled'), 45_000)

  const save = async ({ id, expectedStatus, status, carrier, carrierReference, estimatedDelivery, note, notePublic }: OrderUpdate) => {
    setError('')
    try {
      await call('/api/orders', { method: 'PATCH', body: JSON.stringify({ id, expectedStatus, status, carrier, carrierReference, estimatedDelivery: estimatedDelivery || null, note, notePublic }) }, await getToken({ skipCache: true }))
      show(status === expectedStatus ? 'Order details saved' : `Order marked as ${status.replaceAll('_', ' ')}`)
      reload()
      return true
    } catch (e) {
      setError(e instanceof QuoteApiError ? e.message : 'Could not update the order. Please try again.')
      if (e instanceof QuoteApiError && e.code === 'order_changed') reload()
      return false
    }
  }

  if (state.kind === 'ready' && !order) {
    return (
      <>
        <title>Order not found — VELTO Admin</title>
        <AdminHeading title="Order not found" crumbs={[{ label: 'Orders', to: '/admin/orders' }, { label: 'Not found' }]}>This order doesn’t exist or was removed.</AdminHeading>
        <ButtonLink to="/admin/orders">Back to orders</ButtonLink>
      </>
    )
  }

  return (
    <>
      <title>{`${order?.reference ?? 'Order'} — Orders — VELTO Admin`}</title>
      <AdminHeading title={<span className="font-mono text-[clamp(1.375rem,1.1rem+1.2vw,2rem)] font-bold tracking-wide break-all">{order?.reference ?? 'Order details'}</span>} meta={order && <StatusPill status={order.status} size="md" />} crumbs={[{ label: 'Orders', to: '/admin/orders' }, { label: order?.reference ?? 'Details' }]}>
        {order ? `${order.customer.name} · ${order.customer.city}` : 'Review items, delivery details and order status.'}
      </AdminHeading>
      {error && <p role="alert" className="mb-5 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-[0.9375rem] font-semibold text-danger">{error}</p>}
      <RemoteState state={state} reload={reload} skeleton={3}>
        {({ orders }) => <AdminOrderDetail order={orders[0]} save={save} />}
      </RemoteState>
    </>
  )
}
