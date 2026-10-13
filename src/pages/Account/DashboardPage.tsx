import { Link } from 'react-router'
import { ArrowRight, ClipboardList, Heart, ShoppingBasket } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { useCart } from '../../features/cart/cartStore.ts'
import { useMyQuotes } from '../../features/quotes/useMyQuotes.ts'
import { useWishlist } from '../../features/wishlist/wishlistStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import AccountHeading from './AccountHeading.tsx'
import QuoteCard from './QuoteCard.tsx'
import RemoteState from './RemoteState.tsx'

export default function DashboardPage() {
  const { user } = useAppAuth()
  const [state, reload] = useMyQuotes()
  const wishlistCount = useWishlist((s) => s.slugs.length)
  const cartCount = useCart((s) => s.items.length)
  const quotes = state.kind === 'ready' ? state.data : []
  const open = quotes.filter((q) => q.status === 'submitted' || q.status === 'reviewing').length
  const firstName = user?.name?.split(' ')[0]

  const stats = [
    { label: 'Quote requests', value: state.kind === 'ready' ? quotes.length : '—', to: '/account/quotes', icon: ClipboardList },
    { label: 'Awaiting response', value: state.kind === 'ready' ? open : '—', to: '/account/quotes', icon: ClipboardList },
    { label: 'Saved products', value: wishlistCount, to: '/wishlist', icon: Heart },
    { label: 'In your cart', value: cartCount, to: '/cart', icon: ShoppingBasket },
  ]

  return (
    <>
      <title>My Account — NOVARO</title>
      <AccountHeading title={firstName ? `Welcome back, ${firstName}` : 'My account'} crumbs={[]} actions={<ButtonLink to="/quote">Request a quote</ButtonLink>}>
        Your quotes, saved products and account settings.
      </AccountHeading>

      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, to, icon: Icon }) => (
          <li key={label}>
            <Link to={to} className="group flex h-full flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-card)]">
              <Icon aria-hidden="true" className="size-5 text-copper" />
              <span className="font-display text-[2rem] leading-none text-ink">{value}</span>
              <span className="text-[0.875rem] text-muted group-hover:text-forest">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent-title" className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="recent-title" className="font-display text-[1.5rem]">
            Recent quote requests
          </h2>
          <Link to="/account/quotes" className="inline-flex min-h-11 items-center gap-1 text-[0.875rem] font-semibold text-forest hover:underline">
            View all <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <RemoteState state={state} reload={reload}>
          {(list) =>
            list.length ? (
              <ul className="flex flex-col gap-3">
                {list.slice(0, 3).map((quote) => (
                  <li key={quote.reference}>
                    <QuoteCard quote={quote} detailsHref={`/account/quotes/${quote.reference}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-5 text-muted">
                No requests yet. <Link to="/products" className="font-semibold text-forest underline">Browse products</Link> to get started.
              </p>
            )
          }
        </RemoteState>
      </section>
    </>
  )
}
