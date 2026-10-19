import CustomerOrders from '../../features/orders/CustomerOrders.tsx'
import AccountHeading from './AccountHeading.tsx'

export default function OrdersPage() {
  return (
    <>
      <title>My Orders — VELTO</title>
      <AccountHeading title="My orders" crumbs={[{ label: 'Orders' }]}>
        Follow each Cash on Delivery order from confirmation to your door. Status updates appear here automatically.
      </AccountHeading>
      <CustomerOrders />
    </>
  )
}
