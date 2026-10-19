import { useParams } from 'react-router'
import { call } from '../../features/quotes/api.ts'
import type { Order } from '../../features/orders/schema.ts'
import OrderTrackingView from '../../features/orders/OrderTrackingView.tsx'
import { useLivePoll } from '../../features/orders/useLivePoll.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import AccountHeading from './AccountHeading.tsx'
import RemoteState from './RemoteState.tsx'

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

export default function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const path = `/api/orders?id=${encodeURIComponent(orderId)}`
  const [state, reload] = useAuthedRemote(t => (isUuid(orderId) ? call<{ orders: Order[] }>(path, { method: 'GET' }, t) : Promise.resolve({ orders: [] })), path)
  const order = state.kind === 'ready' ? state.data.orders[0] : undefined
  const updatedAt = useLivePoll(reload, order, Boolean(order && order.status !== 'delivered' && order.status !== 'cancelled'))

  if ((state.kind === 'ready' && !order) || (state.kind === 'error' && (state.status === 404 || state.status === 422))) {
    return (
      <>
        <title>Order not found — VELTO</title>
        <AccountHeading title="Order not found" crumbs={[{ label: 'Orders', to: '/account/orders' }, { label: 'Not found' }]}>
          We couldn’t find that order in your account.
        </AccountHeading>
        <ButtonLink to="/account/orders">Back to my orders</ButtonLink>
      </>
    )
  }

  return (
    <>
      <title>{`${order?.reference ?? 'Order'} — My Orders — VELTO`}</title>
      <AccountHeading eyebrow="Order tracking" title={order?.reference ?? 'Order'} mono crumbs={[{ label: 'Orders', to: '/account/orders' }, { label: order?.reference ?? 'Order' }]} />
      <RemoteState state={state} reload={reload} skeleton={3}>
        {({ orders }) => <OrderTrackingView order={orders[0]} updatedAt={updatedAt} onRefresh={reload} />}
      </RemoteState>
    </>
  )
}
