import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  FilePen,
  ImageOff,
  Loader2,
  MessageSquareQuote,
  MoreHorizontal,
  Package,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Img from '../../components/ui/Img.tsx'
import Pagination from '../../components/ui/Pagination.tsx'
import StatCard from '../../components/ui/StatCard.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { demoCategories } from '../../data/demoCategories.ts'
import { adminApi } from '../../features/admin/api.ts'
import { productStatusOf, type AdminProduct, type ProductStatus } from '../../features/admin/types.ts'
import type { ProductInput } from '../../features/catalog/productSchema.ts'
import { displayPrice } from '../../features/catalog/price.ts'
import { QuoteApiError } from '../../features/quotes/api.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'
import ConfirmDialog from './ConfirmDialog.tsx'
import Menu from './Menu.tsx'
import { fmt } from './analytics/format.ts'
import { td, th, tr } from './ui.tsx'

const categoryName = new Map(demoCategories.map((c) => [c.slug, c.name]))
const PAGE_SIZE = 10

/** Real server-side analytics; null when analytics could not be loaded (shown as "—", never invented). */
type Stats = { views: number; views30: number; quotes: number; quotes30: number }
type Row = AdminProduct & { status: ProductStatus; stats: Stats | null }
type Tab = 'all' | ProductStatus | 'demo'
type SortKey = 'name' | 'category' | 'price' | 'views' | 'quotes' | 'status' | 'updated'
type Sort = { key: SortKey; dir: 1 | -1 } | null

const tabs: { value: Tab; label: string; match: (r: Row) => boolean }[] = [
  { value: 'all', label: 'All', match: () => true },
  { value: 'published', label: 'Published', match: (r) => r.status === 'published' },
  { value: 'draft', label: 'Draft', match: (r) => r.status === 'draft' },
  { value: 'demo', label: 'Demo', match: (r) => !r.verified },
  { value: 'archived', label: 'Archived', match: (r) => r.status === 'archived' },
]

const statusMeta: Record<ProductStatus, { label: string; dot: string; pill: string }> = {
  published: { label: 'Published', dot: 'bg-chart-views', pill: 'border-forest/15 bg-forest-soft text-forest hover:border-forest/35' },
  draft: { label: 'Draft', dot: 'bg-copper', pill: 'border-copper/20 bg-copper-soft text-copper-hover hover:border-copper/40' },
  archived: { label: 'Archived', dot: 'bg-muted', pill: 'border-border bg-sand text-ink hover:border-ink/25' },
}

const sortOptions: { value: string; label: string; sort: Sort }[] = [
  { value: 'default', label: 'Catalogue order', sort: null },
  { value: 'name-1', label: 'Name A–Z', sort: { key: 'name', dir: 1 } },
  { value: 'views--1', label: 'Most viewed', sort: { key: 'views', dir: -1 } },
  { value: 'quotes--1', label: 'Most requested', sort: { key: 'quotes', dir: -1 } },
  { value: 'price--1', label: 'Highest price', sort: { key: 'price', dir: -1 } },
  { value: 'updated--1', label: 'Recently updated', sort: { key: 'updated', dir: -1 } },
]

const priceText = (p: Row) => displayPrice(p) ?? (p.price ? 'Unverified price' : 'On request')
const sortValue: Record<SortKey, (r: Row) => string | number> = {
  name: (r) => r.name.toLowerCase(),
  category: (r) => categoryName.get(r.categorySlug) ?? r.categorySlug,
  price: (r) => (r.verified && r.price ? r.price.amount : -1),
  views: (r) => r.stats?.views ?? -1,
  quotes: (r) => r.stats?.quotes ?? -1,
  status: (r) => ['published', 'draft', 'archived'].indexOf(r.status),
  updated: (r) => Date.parse(r.updatedAt) || 0,
}

/** Copy as an unverified draft with a free slug: never published or priced until someone reviews it. */
function duplicateInput(p: Row, taken: Set<string>): ProductInput {
  const base = `${p.slug.slice(0, 74)}-copy`
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
  return {
    slug,
    name: `${p.name.slice(0, 112)} (copy)`,
    categorySlug: p.categorySlug as ProductInput['categorySlug'],
    usage: p.usage,
    description: p.description,
    applications: p.applications as ProductInput['applications'],
    areas: p.areas as ProductInput['areas'],
    benefits: p.benefits,
    specifications: p.specifications,
    packSizes: p.packSizes,
    coverage: p.coverage,
    documents: p.documents,
    faq: p.faq,
    image: p.image,
    price: p.price,
    verified: false,
    published: false,
    sortOrder: p.sortOrder,
  }
}

function Thumb({ p, size }: { p: Row; size: string }) {
  // The icon sits underneath; a loaded image covers it, a broken one (Img renders nothing) reveals it.
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-cream ${size}`}>
      <ImageOff aria-hidden="true" className="absolute size-5 text-muted/70" />
      {p.image && <Img image={p.image} alt="" className="relative size-full bg-white object-cover " />}
    </span>
  )
}

function Metric({ total, recent, align = 'end' }: { total: number | undefined; recent: number | undefined; align?: 'start' | 'end' }) {
  if (total === undefined) return <span className="text-muted" title="Analytics unavailable">—</span>
  return (
    <span className={`inline-flex flex-col leading-tight tabular-nums ${align === 'end' ? 'items-end' : 'items-start'}`}>
      <span className={`font-semibold ${total ? 'text-ink' : 'text-muted'}`}>{fmt.format(total)}</span>
      <span className="text-[0.75rem] whitespace-nowrap text-muted">{recent ? `+${fmt.format(recent)} in 30 days` : 'None in 30 days'}</span>
    </span>
  )
}

function StatusMenu({ p, busy, onChange }: { p: Row; busy: boolean; onChange: (s: ProductStatus) => void }) {
  const meta = statusMeta[p.status]
  return (
    <Menu
      label={`Status: ${meta.label}. Change status for ${p.name}`}
      align="start"
      disabled={busy}
      triggerClassName={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-wait ${meta.pill}`}
      trigger={
        <>
          {busy ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : <span aria-hidden="true" className={`size-2 rounded-full ${meta.dot}`} />}
          {busy ? 'Saving…' : meta.label}
          <ChevronDown aria-hidden="true" className="size-3.5 opacity-60" />
        </>
      }
      items={(Object.keys(statusMeta) as ProductStatus[]).map((s) => ({ label: statusMeta[s].label, checked: s === p.status, onSelect: () => onChange(s) }))}
    />
  )
}

function RowActions({ p, onDuplicate, onDelete }: { p: Row; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <Menu
      label={`Actions for ${p.name}`}
      triggerClassName="grid size-10 place-items-center rounded-full border border-transparent text-muted transition-colors hover:border-border hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest aria-expanded:border-border aria-expanded:bg-surface aria-expanded:text-ink"
      trigger={<MoreHorizontal aria-hidden="true" className="size-5" />}
      items={[
        { label: 'Edit', icon: Pencil, to: `/admin/products/${p.slug}` },
        { label: 'View in store', icon: ExternalLink, to: `/products/${p.slug}`, disabled: p.status !== 'published', hint: p.status !== 'published' ? 'Only published products are visible' : undefined },
        { label: 'Duplicate', icon: Copy, onSelect: onDuplicate, hint: 'Creates an unverified draft copy' },
        { label: 'Delete', icon: Trash2, onSelect: onDelete, danger: true },
      ]}
    />
  )
}

const selectClass = `${inputClass} cursor-pointer appearance-none pr-10`

export default function AdminProductsPage() {
  const { getToken } = useAppAuth()
  const show = useToasts((s) => s.show)
  const [state, reload] = useAuthedRemote(async (t) => {
    const [{ products }, all, recent] = await Promise.all([adminApi.products(t), adminApi.analytics(t, 'all').catch(() => null), adminApi.analytics(t, '30d').catch(() => null)])
    const totals = new Map(all?.products.map((r) => [r.slug, r]) ?? [])
    const last30 = new Map(recent?.products.map((r) => [r.slug, r]) ?? [])
    const ok = Boolean(all && recent)
    const rows = products.map(
      (p): Row => ({
        ...p,
        status: productStatusOf(p),
        stats: ok ? { views: totals.get(p.slug)?.viewsAllTime ?? 0, views30: last30.get(p.slug)?.views ?? 0, quotes: totals.get(p.slug)?.quoteRequests ?? 0, quotes30: last30.get(p.slug)?.quoteRequests ?? 0 } : null,
      }),
    )
    return { rows, analytics: ok ? { views: all!.totals.views, views30: recent!.totals.views } : null }
  }, 'admin-products')

  // Local edits layered over the loaded list; a fresh load (reload) replaces them.
  const loaded = state.kind === 'ready' ? state.data.rows : null
  const [local, setLocal] = useState<{ source: Row[]; rows: Row[] } | null>(null)
  const rows = loaded && local?.source === loaded ? local.rows : loaded
  const setRows = (update: (rs: Row[]) => Row[]) => setLocal((l) => (loaded ? { source: loaded, rows: update(l?.source === loaded ? l.rows : loaded) } : l))

  const [tab, setTab] = useState<Tab>('all')
  const [category, setCategory] = useState('')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>(null)
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Row | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const inCategory = useMemo(() => (rows ?? []).filter((r) => !category || r.categorySlug === category), [rows, category])
  const counts = useMemo(() => Object.fromEntries(tabs.map((t) => [t.value, inCategory.filter(t.match).length])) as Record<Tab, number>, [inCategory])
  const shown = useMemo(() => {
    const term = query.trim().toLowerCase()
    const match = tabs.find((t) => t.value === tab)!.match
    const list = inCategory.filter((r) => match(r) && (!term || [r.name, r.slug, categoryName.get(r.categorySlug) ?? ''].some((v) => v.toLowerCase().includes(term))))
    if (!sort) return list
    const value = sortValue[sort.key]
    return [...list].sort((a, b) => {
      const x = value(a)
      const y = value(b)
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir || a.name.localeCompare(b.name)
    })
  }, [inCategory, tab, query, sort])

  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageRows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const reset = () => setPage(1)
  const filtered = Boolean(query || category || tab !== 'all')
  const sortValueKey = sort ? (sortOptions.find((o) => o.sort?.key === sort.key && o.sort.dir === sort.dir)?.value ?? 'custom') : 'default'

  const token = async () => {
    const t = await getToken()
    if (!t) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
    return t
  }

  const changeStatus = async (p: Row, status: ProductStatus) => {
    if (status === p.status) return
    const previous = { ...p }
    setBusy(p.slug)
    setRows((rs) => rs.map((r) => (r.slug === p.slug ? { ...r, status, published: status === 'published', archived: status === 'archived' } : r)))
    try {
      const { product } = await adminApi.setProductStatus(await token(), p.slug, status)
      setRows((rs) => rs.map((r) => (r.slug === p.slug ? { ...r, ...product, status: productStatusOf(product) } : r)))
      show(`“${p.name}” is now ${statusMeta[status].label.toLowerCase()}.`)
    } catch (error) {
      setRows((rs) => rs.map((r) => (r.slug === p.slug ? previous : r)))
      show(error instanceof QuoteApiError ? `Status not changed: ${error.message}` : 'Status not changed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const duplicate = async (p: Row) => {
    setBusy(p.slug)
    try {
      const { product } = await adminApi.createProduct(await token(), duplicateInput(p, new Set((rows ?? []).map((r) => r.slug))))
      const copy: Row = { ...product, status: productStatusOf(product), stats: p.stats ? { views: 0, views30: 0, quotes: 0, quotes30: 0 } : null }
      setRows((rs) => {
        const at = rs.findIndex((r) => r.slug === p.slug)
        return [...rs.slice(0, at + 1), copy, ...rs.slice(at + 1)]
      })
      show(`Draft copy “${product.name}” created.`, { label: 'Edit copy', to: `/admin/products/${product.slug}` })
    } catch (error) {
      show(error instanceof QuoteApiError ? `Not duplicated: ${error.message}` : 'The product could not be duplicated.')
    } finally {
      setBusy(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setBusy(toDelete.slug)
    setDeleteError(null)
    try {
      await adminApi.deleteProduct(await token(), toDelete.slug)
      setRows((rs) => rs.filter((r) => r.slug !== toDelete.slug))
      show(`“${toDelete.name}” was deleted.`)
      setToDelete(null)
    } catch (error) {
      setDeleteError(error instanceof QuoteApiError ? error.message : 'The product could not be deleted. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const askDelete = (p: Row) => {
    setDeleteError(null)
    setToDelete(p)
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    setQuery(draft)
    reset()
  }

  const clearFilters = () => {
    setDraft('')
    setQuery('')
    setCategory('')
    setTab('all')
    reset()
  }

  const sortHeader = (key: SortKey, label: string, align = '') => {
    const active = sort?.key === key
    const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown
    const firstDir = key === 'views' || key === 'quotes' || key === 'price' ? -1 : 1
    return (
      <th scope="col" className={`${th} ${align}`} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          onClick={() => setSort(active ? (sort.dir === firstDir ? { key, dir: -firstDir as 1 | -1 } : null) : { key, dir: firstDir })}
          className={`group inline-flex min-h-11 items-center gap-1 tracking-[0.08em] uppercase hover:text-ink ${align ? 'ml-auto' : ''}`}
        >
          {label}
          <Icon aria-hidden="true" className={`size-3.5 ${active ? 'text-forest' : 'opacity-40 group-hover:opacity-80'}`} />
        </button>
      </th>
    )
  }

  return (
    <>
      <title>Products — Admin — VELTO</title>
      <AdminHeading
        title="Products"
        crumbs={[{ label: 'Products' }]}
        actions={
          <ButtonLink to="/admin/products/new">
            <Plus aria-hidden="true" className="size-4" /> New product
          </ButtonLink>
        }
      >
        Manage the catalogue, publication status and demand. Only published products appear in the store; Demo products show no prices until verified.
      </AdminHeading>

      <RemoteState state={state} reload={reload} skeleton={5}>
        {({ analytics }) => {
          const all = rows ?? []
          const kpis = [
            { label: 'Total products', value: fmt.format(all.length), hint: `${all.filter((r) => !r.verified).length} demo · ${all.filter((r) => r.status === 'archived').length} archived`, icon: Package, tone: 'ink' as const },
            { label: 'Published', value: fmt.format(all.filter((r) => r.status === 'published').length), hint: 'Visible in the store', icon: Store, tone: 'forest' as const },
            { label: 'Draft', value: fmt.format(all.filter((r) => r.status === 'draft').length), hint: 'Hidden, not archived', icon: FilePen, tone: 'copper' as const },
            {
              label: 'Total views',
              value: analytics ? fmt.format(analytics.views) : '—',
              hint: analytics ? `${fmt.format(analytics.views30)} in the last 30 days` : 'Analytics unavailable',
              icon: Eye,
              tone: 'forest' as const,
            },
          ]
          return (
            <div className="flex flex-col gap-[clamp(1.25rem,2.5vw,1.75rem)]">
              <ul className="grid grid-cols-2 gap-[var(--grid-gap)] sm:gap-4 xl:grid-cols-4">
                {kpis.map(({ label, ...k }) => (
                  <li key={label} className="min-w-0">
                    <StatCard label={label} {...k} />
                  </li>
                ))}
              </ul>

              <section aria-label="Product catalogue" className="surface-card overflow-clip">
                <nav aria-label="Filter by status" className="no-scrollbar overflow-x-auto border-b border-border px-[clamp(0.75rem,2vw,1.25rem)]">
                  <ul className="flex gap-1">
                    {tabs.map((t) => {
                      const active = tab === t.value
                      return (
                        <li key={t.value} className="shrink-0">
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setTab(t.value)
                              reset()
                            }}
                            className={`relative inline-flex min-h-13 items-center gap-2 px-3 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors ${active ? 'text-forest after:bg-forest' : 'text-muted after:bg-transparent hover:text-ink hover:after:bg-border'}`}
                          >
                            {t.label}
                            <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[0.75rem] tabular-nums transition-colors ${active ? 'bg-forest text-white' : 'bg-sand text-muted'}`}>{counts[t.value]}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </nav>

                <div className="grid gap-3 border-b border-border bg-canvas/60 px-[clamp(1rem,2.5vw,1.5rem)] py-4 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_minmax(0,12rem)]">
                  <form role="search" onSubmit={onSearch} className="flex min-w-0 gap-2 sm:col-span-2 md:col-span-1">
                    <label htmlFor="product-search" className="sr-only">
                      Search products by name, category or slug
                    </label>
                    <span className="relative min-w-0 flex-1">
                      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-muted" />
                      <input
                        id="product-search"
                        type="search"
                        value={draft}
                        onChange={(e) => {
                          setDraft(e.target.value)
                          if (!e.target.value) {
                            setQuery('')
                            reset()
                          }
                        }}
                        placeholder="Search name, category or slug"
                        className={`${inputClass} pl-11`}
                      />
                    </span>
                    <button type="submit" className={buttonClass('primary', 'sm', 'shrink-0')}>
                      Search
                    </button>
                  </form>
                  <div className="relative">
                    <label htmlFor="product-category" className="sr-only">
                      Category
                    </label>
                    <select
                      id="product-category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value)
                        reset()
                      }}
                      className={selectClass}
                    >
                      <option value="">All categories</option>
                      {demoCategories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
                  </div>
                  <div className="relative">
                    <label htmlFor="product-sort" className="sr-only">
                      Sort products
                    </label>
                    <select id="product-sort" value={sortValueKey} onChange={(e) => setSort(sortOptions.find((o) => o.value === e.target.value)?.sort ?? null)} className={selectClass}>
                      {sortValueKey === 'custom' && <option value="custom">Custom column sort</option>}
                      {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
                  </div>
                </div>

                {!analytics && (
                  <p role="status" className="flex items-center gap-2 border-b border-border bg-copper-soft/50 px-[clamp(1rem,2.5vw,1.5rem)] py-2.5 text-[0.8125rem] text-copper-hover">
                    <TriangleAlert aria-hidden="true" className="size-4 shrink-0" /> Analytics couldn’t be loaded, so views and quote requests show “—”. Product management still works.
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 px-[clamp(1rem,2.5vw,1.5rem)] py-3 text-[0.8125rem] text-muted">
                  <p aria-live="polite" className="tabular-nums">
                    {shown.length ? (
                      <>
                        Showing <strong className="font-semibold text-ink">{(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, shown.length)}</strong> of {shown.length} {shown.length === 1 ? 'product' : 'products'}
                      </>
                    ) : (
                      'No products'
                    )}
                    {query && <> matching “{query}”</>}
                    {category && <> in {categoryName.get(category)}</>}
                  </p>
                  {filtered && (
                    <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-1 font-semibold text-forest hover:underline">
                      <X aria-hidden="true" className="size-4" /> Clear filters
                    </button>
                  )}
                </div>

                {pageRows.length === 0 ? (
                  <div className="mx-[clamp(1rem,2.5vw,1.5rem)] mb-6 grid place-items-center rounded-xl border border-dashed border-border bg-canvas px-4 py-14 text-center">
                    <span className="grid size-14 place-items-center rounded-full bg-forest-soft text-forest">
                      <PackageSearch aria-hidden="true" className="size-6" />
                    </span>
                    <p className="mt-4 font-semibold text-ink">{all.length ? 'No products match these filters' : 'No products yet'}</p>
                    <p className="mt-1 max-w-[26rem] text-[0.875rem] text-muted">{all.length ? 'Try another tab, category or search term.' : 'Add your first product to start building the catalogue.'}</p>
                    {all.length ? (
                      <button type="button" onClick={clearFilters} className={buttonClass('secondary', 'sm', 'mt-5')}>
                        Clear filters
                      </button>
                    ) : (
                      <ButtonLink to="/admin/products/new" size="sm" className="mt-5">
                        <Plus aria-hidden="true" className="size-4" /> New product
                      </ButtonLink>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:block">
                      <table className="w-full border-separate border-spacing-0 text-[0.9375rem]">
                        <caption className="sr-only">Products, sortable by column</caption>
                        <thead>
                          <tr>
                            {sortHeader('name', 'Product')}
                            {sortHeader('category', 'Category')}
                            {sortHeader('price', 'Price')}
                            {sortHeader('views', 'Views', 'text-right')}
                            {sortHeader('quotes', 'Quote requests', 'text-right')}
                            {sortHeader('status', 'Status')}
                            <th scope="col" className={`${th} text-right`}>
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.map((p) => (
                            <tr key={p.slug} className={`${tr} even:bg-canvas/50`}>
                              <td className={`${td} py-4`}>
                                <span className="flex min-w-0 items-center gap-4">
                                  <Thumb p={p} size="size-16" />
                                  <span className="min-w-0">
                                    <Link to={`/admin/products/${p.slug}`} className="block truncate font-semibold text-ink hover:text-forest hover:underline">
                                      {p.name}
                                    </Link>
                                    <span className="mt-1 flex items-center gap-2 text-[0.8125rem] text-muted">
                                      <span className="truncate font-mono text-[0.75rem]">{p.slug}</span>
                                      {!p.verified && <Badge tone="copper">Demo</Badge>}
                                    </span>
                                  </span>
                                </span>
                              </td>
                              <td className={`${td} text-[0.875rem] text-muted`}>{categoryName.get(p.categorySlug) ?? p.categorySlug}</td>
                              <td className={`${td} whitespace-nowrap ${p.verified && p.price ? 'font-semibold text-ink tabular-nums' : 'text-[0.875rem] text-muted'}`}>{priceText(p)}</td>
                              <td className={`${td} text-right`}>
                                <Metric total={p.stats?.views} recent={p.stats?.views30} />
                              </td>
                              <td className={`${td} text-right`}>
                                <Metric total={p.stats?.quotes} recent={p.stats?.quotes30} />
                              </td>
                              <td className={td}>
                                <StatusMenu p={p} busy={busy === p.slug} onChange={(s) => void changeStatus(p, s)} />
                              </td>
                              <td className={`${td} w-0 text-right`}>
                                <RowActions p={p} onDuplicate={() => void duplicate(p)} onDelete={() => askDelete(p)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <ul className="divide-y divide-border border-t border-border lg:hidden">
                      {pageRows.map((p) => (
                        <li key={p.slug} className="flex flex-col gap-4 px-[clamp(1rem,2.5vw,1.5rem)] py-5">
                          <div className="flex items-start gap-3">
                            <Thumb p={p} size="size-16" />
                            <div className="min-w-0 flex-1">
                              <Link to={`/admin/products/${p.slug}`} className="font-semibold text-ink hover:text-forest hover:underline">
                                {p.name}
                              </Link>
                              <p className="text-[0.8125rem] text-muted">{categoryName.get(p.categorySlug) ?? p.categorySlug}</p>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.875rem]">
                                <span className={p.verified && p.price ? 'font-semibold text-ink' : 'text-muted'}>{priceText(p)}</span>
                                {!p.verified && <Badge tone="copper">Demo</Badge>}
                              </p>
                            </div>
                            <RowActions p={p} onDuplicate={() => void duplicate(p)} onDelete={() => askDelete(p)} />
                          </div>
                          <dl className="grid grid-cols-2 gap-2 text-[0.8125rem]">
                            {[
                              { k: 'Views', icon: Eye, total: p.stats?.views, recent: p.stats?.views30 },
                              { k: 'Quote requests', icon: MessageSquareQuote, total: p.stats?.quotes, recent: p.stats?.quotes30 },
                            ].map(({ k, icon: Icon, total, recent }) => (
                              <div key={k} className="rounded-xl border border-border bg-canvas px-3 py-2.5">
                                <dt className="flex items-center gap-1.5 text-muted">
                                  <Icon aria-hidden="true" className="size-3.5" /> {k}
                                </dt>
                                <dd className="mt-1">
                                  <Metric total={total} recent={recent} align="start" />
                                </dd>
                              </div>
                            ))}
                          </dl>
                          <div>
                            <StatusMenu p={p} busy={busy === p.slug} onChange={(s) => void changeStatus(p, s)} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {pageCount > 1 && (
                  <div className="border-t border-border px-4 py-4">
                    <Pagination page={current} pageCount={pageCount} onChange={setPage} />
                  </div>
                )}
              </section>
            </div>
          )
        }}
      </RemoteState>

      <ConfirmDialog
        open={toDelete !== null}
        icon={Trash2}
        title={<>Delete “{toDelete?.name}”?</>}
        confirmLabel="Delete product"
        busyLabel="Deleting…"
        busy={busy !== null && busy === toDelete?.slug}
        error={deleteError}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        This permanently removes the product, its wishlist entries and its view statistics. It can’t be undone. Products in quote requests can’t be deleted; archive them instead.
      </ConfirmDialog>
    </>
  )
}
