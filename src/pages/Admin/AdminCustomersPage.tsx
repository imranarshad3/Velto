import CrmWorkspace from './CrmWorkspace.tsx'
import { useState } from 'react'
import { Link } from 'react-router'
import { Users } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState.tsx'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { adminApi } from '../../features/admin/api.ts'
import { dateFormat } from '../../features/quotes/format.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'

export default function AdminCustomersPage() {
  const [state, reload] = useAuthedRemote(async (t) => (await adminApi.customers(t)).customers, 'admin-customers')
  const [filter, setFilter] = useState('')

  return (
    <>
      <title>Customers — Admin — VELTO</title>
      <AdminHeading title="Customers" crumbs={[{ label: 'Customers' }]}>
        Manage relationships, lead stages, assignments, and follow-ups. Existing account records remain available below.
      </AdminHeading>
      <CrmWorkspace />
      <h2 className="mb-4 mt-8 font-display text-2xl">Existing customer accounts</h2>
      <label htmlFor="customer-filter" className="sr-only">
        Filter customers
      </label>
      <input id="customer-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name, email or company" className={`${inputClass} mb-4 max-w-[28rem]`} />
      <RemoteState state={state} reload={reload} skeleton={3}>
        {(customers) => {
          const term = filter.toLowerCase()
          const shown = customers.filter((c) => !term || [c.fullName, c.email, c.company].some((v) => v?.toLowerCase().includes(term)))
          return shown.length === 0 ? (
            <EmptyState icon={Users} title="No customers yet">
              Customers appear once they send a quote or save products while signed in.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {shown.map((c) => (
                <li key={c.clerkUserId} className="grid gap-2 rounded-xl border border-border bg-surface p-4 md:grid-cols-[minmax(0,1fr)_8rem_8rem_9rem] md:items-center">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{c.fullName ?? 'Name not provided'}</span>
                    <span className="block truncate text-[0.875rem] text-muted">
                      {c.email ?? '—'}
                      {c.company && ` · ${c.company}`}
                    </span>
                    <Link to={`/admin/customers?email=${encodeURIComponent(c.email ?? '')}&name=${encodeURIComponent(c.fullName ?? '')}`} className="block text-xs text-forest underline">Create CRM profile</Link>
                  </span>
                  <Link to={`/admin/quotes?q=${encodeURIComponent(c.email ?? '')}`} className="inline-flex min-h-11 items-center text-[0.9375rem] text-forest hover:underline">
                    {c.quotes} {c.quotes === 1 ? 'quote' : 'quotes'}
                  </Link>
                  <span className="text-[0.9375rem]">{c.wishlist} saved</span>
                  <span className="text-[0.875rem] text-muted">{c.lastQuoteAt ? `Last quote ${dateFormat.format(new Date(c.lastQuoteAt))}` : 'No quotes'}</span>
                </li>
              ))}
            </ul>
          )
        }}
      </RemoteState>
    </>
  )
}
