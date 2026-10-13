import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronRight, ClipboardList } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState.tsx'
import Pagination from '../../components/ui/Pagination.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { adminApi } from '../../features/admin/api.ts'
import type { AdminQuoteRow } from '../../features/admin/types.ts'
import { dateFormat } from '../../features/quotes/format.ts'
import { quoteStatuses, quoteStatusLabels } from '../../features/quotes/schema.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'
import { statusTone } from './status.ts'
import { cardList, FilterTabs, ResultCount, SearchInput, td, th, Toolbar, tr } from './ui.tsx'

const scope = (r: AdminQuoteRow) => (r.itemCount ? `${r.itemCount} product${r.itemCount === 1 ? '' : 's'}` : 'General enquiry')

export default function AdminQuotesPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? '1') || 1
  const [search, setSearch] = useState(q)
  const [state, reload] = useAuthedRemote((t) => adminApi.quotes(t, { status, q, page }), `quotes:${status}:${q}:${page}`)

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }
  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    set({ q: search.trim() })
  }

  return (
    <>
      <title>Quotes — Admin — VELTO</title>
      <AdminHeading title="Quote requests" crumbs={[{ label: 'Quotes' }]}>
        Requests from the quote form. Open one to update its status, message the customer or add internal notes.
      </AdminHeading>
      <Toolbar>
        <FilterTabs label="Filter by status" value={status} onChange={(s) => set({ status: s })} options={[{ value: '', label: 'All' }, ...quoteStatuses.map((s) => ({ value: s as string, label: quoteStatusLabels[s] }))]} />
        <form role="search" onSubmit={onSearch} className="flex gap-2 lg:w-[24rem]">
          <SearchInput id="admin-quote-search" label="Search by reference, email or name" value={search} onChange={setSearch} placeholder="Reference, email or name" className="flex-1" />
          <button type="submit" className={buttonClass('primary', 'md', 'shrink-0')}>
            Search
          </button>
        </form>
      </Toolbar>
      <RemoteState state={state} reload={reload} skeleton={4}>
        {(data) =>
          data.rows.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No quote requests match">
              {status || q ? 'Try another status or clear the search.' : 'New requests from the quote form will appear here.'}
            </EmptyState>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <ResultCount>
                  {data.total} {data.total === 1 ? 'request' : 'requests'}
                  {q && (
                    <>
                      {' '}
                      matching “<span className="text-ink">{q}</span>”
                    </>
                  )}
                </ResultCount>
              </div>

              <div className="surface-card hidden overflow-clip md:block">
                <table className="w-full table-fixed border-separate border-spacing-0 text-[0.9375rem]">
                  <caption className="sr-only">Quote requests</caption>
                  <thead>
                    <tr>
                      <th scope="col" className={`${th} w-[11.5rem]`}>
                        Reference
                      </th>
                      <th scope="col" className={th}>
                        Customer
                      </th>
                      <th scope="col" className={`${th} hidden w-[10rem] xl:table-cell`}>
                        Request
                      </th>
                      <th scope="col" className={`${th} w-[8.5rem]`}>
                        Received
                      </th>
                      <th scope="col" className={`${th} w-[9.5rem]`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.reference} className={tr}>
                        <td className={td}>
                          <Link to={`/admin/quotes/${r.reference}`} className="font-mono text-[0.875rem] font-semibold text-forest after:absolute after:inset-0 hover:underline focus-visible:outline-offset-[-0.1875rem]">
                            {r.reference}
                          </Link>
                        </td>
                        <td className={td}>
                          <span className="block truncate font-semibold">
                            {r.fullName}
                            {r.company && <span className="font-normal text-muted"> · {r.company}</span>}
                          </span>
                          <span className="block truncate text-[0.8125rem] text-muted">
                            {r.email} · {r.city}
                            <span className="xl:hidden"> · {scope(r)}</span>
                          </span>
                        </td>
                        <td className={`${td} hidden xl:table-cell`}>
                          <span className="block truncate text-[0.875rem]">{scope(r)}</span>
                          <span className="block text-[0.8125rem] text-muted">{r.owner === 'account' ? 'Account' : 'Guest'}</span>
                        </td>
                        <td className={`${td} text-[0.875rem] text-muted tabular-nums`}>{dateFormat.format(new Date(r.createdAt))}</td>
                        <td className={td}>
                          <Badge tone={statusTone(r.status)}>{quoteStatusLabels[r.status]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className={cardList}>
                {data.rows.map((r) => (
                  <li key={r.reference}>
                    <Link to={`/admin/quotes/${r.reference}`} className="flex items-start gap-3 p-4 transition-colors hover:bg-cream/60 focus-visible:outline-offset-[-0.1875rem]">
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[0.8125rem] font-semibold text-forest">{r.reference}</span>
                          <Badge tone={statusTone(r.status)}>{quoteStatusLabels[r.status]}</Badge>
                        </span>
                        <span className="mt-1.5 block truncate font-semibold">
                          {r.fullName}
                          {r.company && <span className="font-normal text-muted"> · {r.company}</span>}
                        </span>
                        <span className="block truncate text-[0.8125rem] text-muted">{r.email}</span>
                        <span className="mt-1 block text-[0.8125rem] text-muted tabular-nums">
                          {dateFormat.format(new Date(r.createdAt))} · {r.city} · {scope(r)} · {r.owner === 'account' ? 'Account' : 'Guest'}
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Pagination page={data.page} pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))} onChange={(p) => set({ page: String(p) })} />
              </div>
            </>
          )
        }
      </RemoteState>
    </>
  )
}
