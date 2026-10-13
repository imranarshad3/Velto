import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { inputClass } from '../../components/ui/form/Field.tsx'
import Pagination from '../../components/ui/Pagination.tsx'
import { adminApi } from '../../features/admin/api.ts'
import { dateFormat } from '../../features/quotes/format.ts'
import { quoteStatuses, quoteStatusLabels, type QuoteStatus } from '../../features/quotes/schema.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'

const statusTone = (s: QuoteStatus) => (s === 'quoted' ? 'green' : s === 'closed' ? 'muted' : s === 'reviewing' ? 'copper' : 'soft')

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
      <title>Quotes — Admin — NOVARO</title>
      <AdminHeading title="Quote requests" crumbs={[{ label: 'Quotes' }]} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter by status" className="no-scrollbar -mx-[var(--page-gutter)] flex gap-2 overflow-x-auto px-[var(--page-gutter)] lg:mx-0 lg:px-0">
          {['', ...quoteStatuses].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              aria-pressed={status === s}
              onClick={() => set({ status: s })}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-[0.875rem] font-semibold ${status === s ? 'border-forest bg-forest text-white' : 'border-border bg-surface hover:border-forest'}`}
            >
              {s ? quoteStatusLabels[s as QuoteStatus] : 'All'}
            </button>
          ))}
        </div>
        <form role="search" onSubmit={onSearch} className="flex gap-2">
          <label htmlFor="admin-quote-search" className="sr-only">
            Search by reference, email or name
          </label>
          <input id="admin-quote-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, email or name" className={`${inputClass} lg:w-[18rem]`} />
          <button type="submit" aria-label="Search" className="grid size-12 shrink-0 place-items-center rounded-lg bg-forest text-white">
            <Search aria-hidden="true" className="size-5" />
          </button>
        </form>
      </div>
      <RemoteState state={state} reload={reload} skeleton={4}>
        {(data) =>
          data.rows.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-6 text-muted">No quote requests match.</p>
          ) : (
            <>
              <p className="mb-2 text-[0.875rem] text-muted" aria-live="polite">
                {data.total} {data.total === 1 ? 'request' : 'requests'}
              </p>
              <ul className="flex flex-col gap-2">
                {data.rows.map((r) => (
                  <li key={r.reference}>
                    <Link to={`/admin/quotes/${r.reference}`} className="grid gap-2 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-card)] md:grid-cols-[9rem_minmax(0,1fr)_8rem_auto] md:items-center">
                      <span className="font-mono text-[0.875rem] font-bold">{r.reference}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {r.fullName}
                          {r.company && <span className="font-normal text-muted"> · {r.company}</span>}
                        </span>
                        <span className="block truncate text-[0.875rem] text-muted">
                          {r.email} · {r.city} · {r.itemCount ? `${r.itemCount} product${r.itemCount === 1 ? '' : 's'}` : 'General enquiry'} · {r.owner === 'account' ? 'Account' : 'Guest'}
                        </span>
                      </span>
                      <span className="text-[0.875rem] text-muted">{dateFormat.format(new Date(r.createdAt))}</span>
                      <Badge tone={statusTone(r.status)}>{quoteStatusLabels[r.status]}</Badge>
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
