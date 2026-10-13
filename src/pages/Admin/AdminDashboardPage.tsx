import { Link } from 'react-router'
import { ArrowRight, ClipboardList, Mail, Package, ShieldCheck, Users } from 'lucide-react'
import { adminApi } from '../../features/admin/api.ts'
import { dateTimeFormat } from '../../features/quotes/format.ts'
import { quoteStatuses, quoteStatusLabels } from '../../features/quotes/schema.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'

export default function AdminDashboardPage() {
  const [state, reload] = useAuthedRemote((t) => adminApi.overview(t), 'overview')

  return (
    <>
      <title>Admin — NOVARO</title>
      <AdminHeading title="Dashboard" />
      <RemoteState state={state} reload={reload} skeleton={3}>
        {(o) => {
          const open = (o.quotesByStatus.submitted ?? 0) + (o.quotesByStatus.reviewing ?? 0)
          const kpis = [
            { label: 'Open quote requests', value: open, to: '/admin/quotes?status=submitted', icon: ClipboardList },
            { label: 'Requests in last 7 days', value: o.quotesLast7Days, to: '/admin/quotes', icon: ClipboardList },
            { label: 'New messages', value: o.newMessages, to: '/admin/messages', icon: Mail },
            { label: 'Customers', value: o.customers, to: '/admin/customers', icon: Users },
            { label: 'Products published', value: `${o.productsPublished}/${o.products}`, to: '/admin/products', icon: Package },
            { label: 'Products verified', value: `${o.productsVerified}/${o.products}`, to: '/admin/products', icon: ShieldCheck },
          ]
          return (
            <div className="flex flex-col gap-6">
              <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {kpis.map(({ label, value, to, icon: Icon }) => (
                  <li key={label}>
                    <Link to={to} className="group flex h-full flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-card)]">
                      <Icon aria-hidden="true" className="size-5 text-copper" />
                      <span className="font-display text-[2rem] leading-none">{value}</span>
                      <span className="text-[0.875rem] text-muted group-hover:text-forest">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="grid gap-4 xl:grid-cols-2">
                <section aria-labelledby="by-status-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                  <h2 id="by-status-title" className="font-display text-[1.375rem]">
                    Quotes by status
                  </h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {quoteStatuses.map((s) => (
                      <li key={s}>
                        <Link to={`/admin/quotes?status=${s}`} className="flex min-h-11 items-center justify-between rounded-lg px-2 hover:bg-sand">
                          <span>{quoteStatusLabels[s]}</span>
                          <span className="font-bold">{o.quotesByStatus[s] ?? 0}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby="activity-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                  <h2 id="activity-title" className="font-display text-[1.375rem]">
                    Recent admin activity
                  </h2>
                  {o.recentAudit.length ? (
                    <ul className="mt-3 flex flex-col divide-y divide-border">
                      {o.recentAudit.map((a, i) => (
                        <li key={i} className="py-2 text-[0.875rem]">
                          <span className="font-semibold">{a.action}</span> · <span className="font-mono">{a.entityKey}</span>
                          <span className="block text-muted">
                            {dateTimeFormat.format(new Date(a.createdAt))} · {a.actor}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-muted">No admin changes yet.</p>
                  )}
                  <Link to="/admin/quotes" className="mt-2 inline-flex min-h-11 items-center gap-1 text-[0.875rem] font-semibold text-forest hover:underline">
                    Review quotes <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </section>
              </div>
            </div>
          )
        }}
      </RemoteState>
    </>
  )
}
