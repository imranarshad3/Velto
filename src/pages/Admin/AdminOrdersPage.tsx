import { useEffect, useRef } from 'react'
import { call } from '../../features/quotes/api.ts'
import type { AdminOrder } from '../../features/orders/schema.ts'
import AdminOrderWorkspace from '../../features/orders/AdminOrderWorkspace.tsx'
import { useLivePoll } from '../../features/orders/useLivePoll.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import { useToasts } from '../../features/ui/toastStore.ts'

const path = '/api/orders?admin=1'

export default function AdminOrdersPage() {
  const [state, reload] = useAuthedRemote(t => call<{ orders: AdminOrder[] }>(path, { method: 'GET' }, t), path)
  const show = useToasts(s => s.show)
  const previousOrderIds = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (state.kind !== 'ready') return
    const currentOrders = state.data.orders
    const currentIds = new Set(currentOrders.map(order => order.id))
    const previousIds = previousOrderIds.current
    if (previousIds) {
      const added = currentOrders.filter(order => !previousIds.has(order.id))
      if (added.length === 1) show(`New order received: ${added[0].reference}`, { label: 'Open order', to: `/admin/orders/${added[0].id}` })
      else if (added.length > 1) show(`${added.length} new orders received`, { label: 'Review orders', to: '/admin/orders' })
    }
    previousOrderIds.current = currentIds
  }, [state, show])
  useLivePoll(reload, state.kind === 'ready' ? state.data : undefined, true, 60_000)
  return (
    <>
      <title>Orders — Admin — VELTO</title>
      <AdminHeading title="Orders" crumbs={[{ label: 'Orders' }]}>Track every Cash on Delivery order from confirmation to doorstep, and keep customers updated.</AdminHeading>
      <RemoteState state={state} reload={reload} skeleton={4}>
        {({ orders }) => <AdminOrderWorkspace orders={orders} reload={reload} />}
      </RemoteState>
    </>
  )
}
