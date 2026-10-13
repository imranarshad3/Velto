import { useState } from 'react'
import { Link } from 'react-router'
import { ImageOff, Plus } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { demoCategories } from '../../data/demoCategories.ts'
import { adminApi } from '../../features/admin/api.ts'
import { displayPrice } from '../../features/catalog/price.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'

const categoryName = new Map(demoCategories.map((c) => [c.slug, c.name]))

export default function AdminProductsPage() {
  const [state, reload] = useAuthedRemote(async (t) => (await adminApi.products(t)).products, 'admin-products')
  const [filter, setFilter] = useState('')

  return (
    <>
      <title>Products — Admin — NOVARO</title>
      <AdminHeading title="Products" crumbs={[{ label: 'Products' }]} actions={<ButtonLink to="/admin/products/new"><Plus aria-hidden="true" className="size-4" /> New product</ButtonLink>}>
        Only verified products show prices; unpublished products are hidden from the store.
      </AdminHeading>
      <label htmlFor="product-filter" className="sr-only">
        Filter products
      </label>
      <input id="product-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name, slug or category" className={`${inputClass} mb-4 max-w-[28rem]`} />
      <RemoteState state={state} reload={reload} skeleton={4}>
        {(products) => {
          const term = filter.toLowerCase()
          const shown = products.filter((p) => !term || [p.name, p.slug, categoryName.get(p.categorySlug) ?? ''].some((v) => v.toLowerCase().includes(term)))
          return (
            <>
              <p className="mb-2 text-[0.875rem] text-muted" aria-live="polite">
                {shown.length} of {products.length} products
              </p>
              <ul className="flex flex-col gap-2">
                {shown.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/admin/products/${p.slug}`} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-shadow hover:shadow-[var(--shadow-card)] md:grid-cols-[3.5rem_minmax(0,1fr)_10rem_auto]">
                      <span className="grid size-14 place-items-center overflow-hidden rounded-lg border border-border bg-white p-1">
                        {p.image ? <Img image={p.image} alt="" className="max-h-full w-auto object-contain" /> : <ImageOff aria-hidden="true" className="size-5 text-muted" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className="block truncate text-[0.8125rem] text-muted">
                          {p.slug} · {categoryName.get(p.categorySlug)}
                        </span>
                      </span>
                      <span className="col-span-2 text-[0.875rem] text-muted md:col-span-1">{displayPrice(p) ?? (p.price ? 'Price set (unverified)' : 'On request')}</span>
                      <span className="col-span-2 flex flex-wrap gap-1.5 md:col-span-1">
                        <Badge tone={p.verified ? 'green' : 'copper'}>{p.verified ? 'Verified' : 'DEMO'}</Badge>
                        <Badge tone={p.published ? 'soft' : 'muted'}>{p.published ? 'Published' : 'Hidden'}</Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )
        }}
      </RemoteState>
    </>
  )
}
