import { call } from '../../features/quotes/api.ts'
import type { AdminOrder } from '../../features/orders/schema.ts'
import AdminOrderWorkspace from '../../features/orders/AdminOrderWorkspace.tsx'
import { useLivePoll } from '../../features/orders/useLivePoll.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'

const path = '/api/orders?admin=1'

export default function AdminOrdersPage() {
  const [state, reload] = useAuthedRemote(t => call<{ orders: AdminOrder[] }>(path, { method: 'GET' }, t), path)
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
