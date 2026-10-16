import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, ClipboardList, Eye, History, MessageSquareQuote, Inbox, Mail, Package, Plus, ShieldCheck, Store, Users } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import StatCard from '../../components/ui/StatCard.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { adminApi } from '../../features/admin/api.ts'
import type { AuditEntry } from '../../features/admin/types.ts'
import { dateTimeFormat } from '../../features/quotes/format.ts'
import { quoteStatuses, quoteStatusLabels, type QuoteStatus } from '../../features/quotes/schema.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import RankList from './analytics/RankList.tsx'
import { fmt, quantityText } from './analytics/format.ts'
import { Panel } from './ui.tsx'

const statusColor: Record<QuoteStatus, string> = {
  submitted: 'bg-copper',
  reviewing: 'bg-emerald-muted',
  quoted: 'bg-forest',
  closed: 'bg-ink/25',
  cancelled: 'bg-ink/25',
}

/** Link an audit entry to its record when we know where that lives. */
const auditHref = (a: AuditEntry) => (a.entity === 'quote' ? `/admin/quotes/${a.entityKey}` : a.entity === 'product' ? `/admin/products/${a.entityKey}` : null)

const quickLinks = [
  { to: '/admin/quotes?status=submitted', label: 'Triage new quote requests', icon: Inbox },
  { to: '/admin/products/new', label: 'Add a product', icon: Plus },
  { to: '/admin/messages', label: 'Reply to messages', icon: Mail },
  { to: '/', label: 'View the storefront', icon: Store },
]

export default function AdminDashboardPage() {
  const [state, reload] = useAuthedRemote((t) => adminApi.overview(t), 'overview')
  const [activity, reloadActivity] = useAuthedRemote((t) => adminApi.analytics(t, '30d'), 'analytics-30d')

  return (
    <>
      <title>Admin — VELTO</title>
      <AdminHeading
        title="Dashboard"
        actions={
          <>
            <ButtonLink to="/admin/products/new" variant="secondary" size="sm">
              <Plus aria-hidden="true" className="size-4" /> New product
            </ButtonLink>
            <ButtonLink to="/admin/quotes" size="sm">
              Review quotes <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
            </ButtonLink>
          </>
        }
      >
        An overview of quote requests, messages and the catalogue.
      </AdminHeading>
      <RemoteState state={state} reload={reload} skeleton={3}>
        {(o) => {
          const open = (o.quotesByStatus.submitted ?? 0) + (o.quotesByStatus.reviewing ?? 0)
          const totalQuotes = quoteStatuses.reduce((n, s) => n + (o.quotesByStatus[s] ?? 0), 0)
          const of = (n: number) => (
            <>
              {n}
              <span className="text-[0.55em] text-muted">/{o.products}</span>
            </>
          )
          const kpis = [
            { label: 'Open quote requests', value: open, hint: 'Submitted or under review', to: '/admin/quotes?status=submitted', icon: ClipboardList, tone: 'copper' as const },
            { label: 'Requests in last 7 days', value: o.quotesLast7Days, hint: 'All statuses', to: '/admin/quotes', icon: History, tone: 'forest' as const },
            { label: 'New messages', value: o.newMessages, hint: 'Not yet read', to: '/admin/messages', icon: Mail, tone: 'ink' as const },
            { label: 'Customers', value: o.customers, hint: 'Account holders with activity', to: '/admin/customers', icon: Users, tone: 'ink' as const },
            { label: 'Products published', value: of(o.productsPublished), hint: 'Visible in the store', to: '/admin/products', icon: Package, tone: 'forest' as const },
            { label: 'Products verified', value: of(o.productsVerified), hint: 'Others are labelled DEMO', to: '/admin/products', icon: ShieldCheck, tone: 'copper' as const },
          ]
          return (
            <div className="flex flex-col gap-[clamp(1.25rem,2.5vw,1.75rem)]">
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,9.5rem),1fr))] gap-[var(--grid-gap)] sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 min-[110rem]:grid-cols-6">
                {kpis.map(({ label, ...k }) => (
                  <li key={label} className="min-w-0">
                    <StatCard label={label} {...k} />
                  </li>
                ))}
              </ul>

              <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 id="activity-heading" className="font-display text-[clamp(1.375rem,1.2rem+0.6vw,1.75rem)] leading-tight text-ink">
                      Product activity
                    </h2>
                    <p className="text-[0.875rem] text-muted">Real views and quote demand over the last 30 days</p>
                  </div>
                  <Link to="/admin/analytics" className="inline-flex min-h-11 items-center gap-1 text-[0.875rem] font-semibold text-forest hover:underline">
                    Full analytics <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
                <RemoteState state={activity} reload={reloadActivity} skeleton={2}>
                  {(a) => (
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-[clamp(1.25rem,2.5vw,1.75rem)] md:grid-cols-2">
                      <RankList
                        id="dash-viewed"
                        title="Most viewed"
                        description={`${fmt.format(a.totals.views)} product views in 30 days`}
                        icon={Eye}
                        color="var(--color-chart-views)"
                        items={a.products.filter((r) => r.views > 0).slice(0, 5).map((r) => ({ slug: r.slug, name: r.name, value: r.views }))}
                        empty="No product views recorded yet."
                      />
                      <RankList
                        id="dash-requested"
                        title="Most requested"
                        description={`${fmt.format(a.totals.quoteRequests)} quote requests in 30 days`}
                        icon={MessageSquareQuote}
                        color="var(--color-chart-quotes)"
                        items={[...a.products]
                          .filter((r) => r.quoteRequests > 0)
                          .sort((x, y) => y.quoteRequests - x.quoteRequests)
                          .slice(0, 5)
                          .map((r) => ({ slug: r.slug, name: r.name, value: r.quoteRequests, detail: quantityText(r.requestedQuantity) ?? undefined }))}
                        empty="No quote requests in the last 30 days."
                      />
                    </div>
                  )}
                </RemoteState>
              </section>

              <div className="grid grid-cols-[minmax(0,1fr)] gap-[clamp(1.25rem,2.5vw,1.75rem)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <Panel
                  id="by-status-title"
                  title="Quotes by status"
                  description={`${totalQuotes} ${totalQuotes === 1 ? 'request' : 'requests'} in total`}
                  action={
                    <Link to="/admin/quotes" className="inline-flex min-h-11 items-center gap-1 text-[0.875rem] font-semibold text-forest hover:underline">
                      All quotes <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  }
                >
                  <div aria-hidden="true" className="flex h-3 w-full gap-0.5 overflow-clip rounded-full bg-sand">
                    {totalQuotes > 0 &&
                      quoteStatuses.map((s) => {
                        const n = o.quotesByStatus[s] ?? 0
                        return n ? <span key={s} className={`h-full ${statusColor[s]}`} style={{ width: `${(n / totalQuotes) * 100}%` }} /> : null
                      })}
                  </div>
                  <ul className="mt-4 flex flex-col">
                    {quoteStatuses.map((s) => {
                      const n = o.quotesByStatus[s] ?? 0
                      const pct = totalQuotes ? Math.round((n / totalQuotes) * 100) : 0
                      return (
                        <li key={s}>
                          <Link to={`/admin/quotes?status=${s}`} className="group -mx-2 grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto_3rem] items-center gap-[var(--grid-gap)] rounded-lg px-2 transition-colors hover:bg-cream">
                            <span aria-hidden="true" className={`size-2.5 rounded-full ${statusColor[s]}`} />
                            <span className="truncate text-[0.9375rem] group-hover:text-forest">{quoteStatusLabels[s]}</span>
                            <span className="font-semibold tabular-nums">{n}</span>
                            <span className="text-right text-[0.8125rem] text-muted tabular-nums">{pct}%</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </Panel>

                <Panel id="activity-title" title="Recent admin activity" description="Latest changes made by staff">
                  {o.recentAudit.length ? (
                    <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[0.4375rem] before:w-px before:bg-border">
                      {o.recentAudit.map((a, i) => {
                        const href = auditHref(a)
                        return (
                          <li key={i} className="relative grid grid-cols-[1rem_minmax(0,1fr)] gap-[var(--grid-gap)]">
                            <span aria-hidden="true" className={`mt-1.5 size-[0.9375rem] rounded-full border-[0.1875rem] border-surface ring-1 ${i === 0 ? 'bg-copper ring-copper/40' : 'bg-forest-soft ring-border'}`} />
                            <div className="min-w-0 text-[0.875rem]">
                              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-semibold text-ink">{a.action}</span>
                                {href ? (
                                  <Link to={href} className="rounded-md bg-sand/70 px-1.5 font-mono text-[0.8125rem] break-all text-forest hover:underline">
                                    {a.entityKey}
                                  </Link>
                                ) : (
                                  <span className="rounded-md bg-sand/70 px-1.5 font-mono text-[0.8125rem] break-all">{a.entityKey}</span>
                                )}
                              </p>
                              <p className="mt-0.5 text-[0.8125rem] text-muted">
                                {dateTimeFormat.format(new Date(a.createdAt))} · {a.actor}
                              </p>
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  ) : (
                    <p className="text-muted">No admin changes yet.</p>
                  )}
                </Panel>
              </div>

              <section aria-labelledby="quick-title" className="relative isolate overflow-clip rounded-[var(--radius-panel)] bg-forest-deep p-[clamp(1.25rem,3vw,2rem)] text-white shadow-[var(--shadow-float)]">
                <p className="text-[0.75rem] font-semibold tracking-[0.18em] text-mint uppercase">Shortcuts</p>
                <h2 id="quick-title" className="mt-1 font-display text-[clamp(1.5rem,1.3rem+0.8vw,1.875rem)] leading-tight">
                  Quick links
                </h2>
                <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-[var(--grid-gap)]">
                  {quickLinks.map(({ to, label, icon: Icon }) => (
                    <li key={to} className="min-w-0">
                      <Link to={to} className="group flex min-h-14 items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 transition-[background-color,box-shadow] duration-200 hover:bg-white/10 hover:ring-white/25 focus-visible:outline-mint">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-mint">
                          <Icon aria-hidden="true" className="size-[1.125rem]" />
                        </span>
                        <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{label}</span>
                        <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-white/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white motion-reduce:transform-none" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )
        }}
      </RemoteState>
    </>
  )
}
