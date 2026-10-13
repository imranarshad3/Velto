import { Package } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import AccountHeading from './AccountHeading.tsx'

/** Order history appears once online checkout is enabled (verified prices + payments). */
export default function OrdersPage() {
  return (
    <>
      <title>Orders — NOVARO</title>
      <AccountHeading title="Orders" crumbs={[{ label: 'Orders' }]} />
      <EmptyState
        icon={Package}
        title="No online orders"
        actions={
          <>
            <ButtonLink to="/account/quotes">View my quotes</ButtonLink>
            <ButtonLink to="/checkout" variant="secondary">
              About online checkout
            </ButtonLink>
          </>
        }
      >
        Online ordering isn’t available yet. Purchases are arranged through quote requests, which you can follow in My quotes.
      </EmptyState>
    </>
  )
}
