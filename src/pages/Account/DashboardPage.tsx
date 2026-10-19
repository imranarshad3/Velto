import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Calculator, ClipboardList, Heart, Hourglass, PackageSearch, Search, ShoppingBasket } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import StatCard from '../../components/ui/StatCard.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { useCart } from '../../features/cart/cartStore.ts'
import { useMyQuotes } from '../../features/quotes/useMyQuotes.ts'
import { useWishlist } from '../../features/wishlist/wishlistStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import AccountHeading from './AccountHeading.tsx'
import QuoteCard from './QuoteCard.tsx'
import RemoteState from './RemoteState.tsx'

const quickActions = [
  { to: '/quote', label: 'Ask for a price', hint: 'Send product needs and project details', icon: ClipboardList },
  { to: '/products#product-results', label: 'Browse products', hint: 'See all products', icon: PackageSearch },
  { to: '/resources/coverage-calculator', label: 'Coverage calculator', hint: 'Work out how much you need before you ask for a price', icon: Calculator },
  { to: '/track', label: 'Track a guest request', hint: 'Use your reference and tracking code', icon: Search },
]

export default function DashboardPage() {
  const { user } = useAppAuth()
  const [state, reload] = useMyQuotes()
  const wishlistCount = useWishlist((s) => s.slugs.length)
  const cartCount = useCart((s) => s.items.length)
  const quotes = state.kind === 'ready' ? state.data : []
  const open = quotes.filter((q) => q.status === 'submitted' || q.status === 'reviewing').length
  const firstName = user?.name?.split(' ')[0]

  return (
    <>
      <title>My Account — VELTO</title>
      <AccountHeading
        title={firstName ? `Welcome back, ${firstName}` : 'My account'}
        eyebrow="Account overview"
        crumbs={[]}
        actions={
          <ButtonLink to="/quote">
            Ask for a price <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
          </ButtonLink>
        }
      >
        Your price requests, saved products and account settings.
      </AccountHeading>

      <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[var(--grid-gap)] sm:gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
        <li className="animate-rise [--delay:0.1s]">
          <StatCard icon={ClipboardList} label="Price requests" hint="Sent while signed in" value={state.kind === 'ready' ? quotes.length : '—'} to="/account/quotes" tone="forest" />
        </li>
        <li className="animate-rise [--delay:0.16s]">
          <StatCard icon={Hourglass} label="Awaiting response" hint="Submitted or under review" value={state.kind === 'ready' ? open : '—'} to="/account/quotes" tone="copper" />
        </li>
        <li className="animate-rise [--delay:0.22s]">
          <StatCard icon={Heart} label="Saved products" hint="On your wishlist" value={wishlistCount} to="/wishlist" tone="gold" />
        </li>
        <li className="animate-rise [--delay:0.28s]">
          <StatCard icon={ShoppingBasket} label="In your cart" hint="Ready to add to a request" value={cartCount} to="/cart" tone="ink" />
        </li>
      </ul>

      <div className="mt-[var(--heading-gap)] grid grid-cols-[minmax(0,1fr)] gap-8 2xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:items-start">
        <section aria-labelledby="recent-title" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="recent-title" className="font-display text-[clamp(1.5rem,1.3rem+0.8vw,1.875rem)] leading-tight">
                Recent price requests
              </h2>
              <p className="mt-1 text-[0.875rem] text-muted">Your three latest requests and where they stand.</p>
            </div>
            <Link to="/account/quotes" className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[0.875rem] font-semibold text-forest hover:text-forest-dark">
              View all <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <RemoteState state={state} reload={reload}>
            {(list) =>
              list.length ? (
                <ul className="flex flex-col gap-4">
                  {list.slice(0, 3).map((quote) => (
                    <li key={quote.reference}>
                      <QuoteCard quote={quote} detailsHref={`/account/quotes/${quote.reference}`} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-dashed border-sand-deep bg-surface/80 p-6 sm:flex-row sm:items-center">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                    <ClipboardList aria-hidden="true" className="size-5" />
                  </span>
                  <p className="min-w-0 flex-1 text-muted">
                    No requests yet. <Link to="/products#product-results" className="font-semibold text-forest underline decoration-copper/50 underline-offset-4">Browse products</Link> to get started.
                  </p>
                </div>
              )
            }
          </RemoteState>
        </section>

        <section aria-labelledby="actions-title" className="relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep p-[clamp(1.25rem,3vw,1.75rem)] text-white shadow-[var(--shadow-float)]">
          <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-gold/70" />
            Shortcuts
          </p>
          <h2 id="actions-title" className="mt-2 font-display text-[1.625rem] leading-tight">
            Quick actions
          </h2>
          <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[repeat(2,minmax(0,1fr))] 2xl:grid-cols-[minmax(0,1fr)]">
            {quickActions.map(({ to, label, hint, icon: Icon }) => (
              <li key={to}>
                <Link to={to} className="group flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-colors duration-300 hover:border-gold/40 hover:bg-white/[0.08]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-gold">
                    <Icon aria-hidden="true" className="size-[1.125rem]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-[0.8125rem] text-white/70">{hint}</span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-white/60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold motion-reduce:transition-none" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
