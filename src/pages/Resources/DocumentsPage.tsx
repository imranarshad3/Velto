import { useMemo, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BadgeCheck, BookOpen, ChevronDown, Download, FileSearch, FileText, MessageSquareText, Search, ShieldAlert, Wrench, X, type LucideIcon } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { productPath } from '../../data/catalog.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { formatBytes, resourceDownloadPath, resourceKindLabels, resourceKinds, type ResourceKind } from '../../features/resources/types.ts'
import { useResources } from '../../features/resources/useResources.ts'

const kindIcon: Record<ResourceKind, LucideIcon> = {
  data_sheet: FileText,
  installation_guide: Wrench,
  safety_data_sheet: ShieldAlert,
  certificate: BadgeCheck,
  brochure: BookOpen,
}
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** A downloadable document: uploaded PDFs, plus supplier links already attached to verified products. */
interface Doc {
  key: string
  title: string
  summary: string | null
  kind: ResourceKind | null
  href: string
  meta: string
  productSlugs: string[]
}

export default function DocumentsPage() {
  const { products, categories, find } = useCatalog()
  const [state, retry] = useResources()
  const [params, setParams] = useSearchParams()
  const kind = resourceKinds.includes(params.get('kind') as ResourceKind) ? (params.get('kind') as ResourceKind) : null
  const category = params.get('category') ?? ''
  const query = params.get('q') ?? ''

  const set = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        for (const [k, v] of Object.entries(patch)) {
          if (v) p.set(k, v)
          else p.delete(k)
        }
        return p
      },
      { replace: true },
    )

  const docs = useMemo<Doc[]>(() => {
    if (state.kind !== 'ready') return []
    const uploaded = state.data.resources.map((r) => ({
      key: r.id,
      title: r.title,
      summary: r.summary,
      kind: r.kind,
      href: resourceDownloadPath(r.id),
      meta: `PDF · ${formatBytes(r.fileSize)} · Updated ${dateFmt.format(new Date(r.updatedAt))}`,
      productSlugs: r.productSlugs,
    }))
    const linked = products
      .filter((p) => p.verified && p.documents?.length)
      .flatMap((p) => p.documents!.map((d) => ({ key: d.url, title: d.title, summary: null, kind: null, href: d.url, meta: d.fileType.toUpperCase(), productSlugs: [p.slug] })))
    return [...uploaded, ...linked]
  }, [state, products])

  const term = query.trim().toLowerCase()
  const inCategory = (d: Doc) => !category || d.productSlugs.some((s) => find(s)?.categorySlug === category)
  const matches = (d: Doc) =>
    !term || [d.title, d.summary ?? '', d.kind ? resourceKindLabels[d.kind] : '', ...d.productSlugs.map((s) => find(s)?.name ?? '')].some((v) => v.toLowerCase().includes(term))
  const base = docs.filter((d) => inCategory(d) && matches(d))
  const shown = base.filter((d) => !kind || d.kind === kind)
  const filtered = Boolean(kind || category || query)

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    set({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() || null })
  }

  return (
    <>
      <title>Resource Center — VELTO</title>
      <meta name="description" content="Product details, fitting guides and safety information from product makers." />
      <PageHeader
        eyebrow="Resources"
        title="Resource Center"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources', to: '/resources' }, { label: 'Resource Center' }]}
        description="Find product details, fitting instructions and safety information. Search by product name or document title."
      />
      <div className="container-page flex flex-col gap-6 py-[var(--content-pad)] pb-[var(--section-gap)]">
        {!(state.kind === 'ready' && docs.length === 0) && <div className="surface-card overflow-clip">
          <form role="search" onSubmit={onSearch} className="grid gap-3 border-b border-border p-[clamp(1rem,2.5vw,1.5rem)] md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
            <div className="flex min-w-0 gap-2">
              <label htmlFor="resource-search" className="sr-only">
                Search product guides
              </label>
              <span className="relative min-w-0 flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-muted" />
                <input key={query} id="resource-search" name="q" type="search" defaultValue={query} placeholder="Search by product or document" className={`${inputClass} pl-11`} />
              </span>
              <button type="submit" className={buttonClass('primary', 'md', 'shrink-0')}>
                Search
              </button>
            </div>
            <div className="relative">
              <label htmlFor="resource-category" className="sr-only">
                Product category
              </label>
              <select id="resource-category" value={category} onChange={(e) => set({ category: e.target.value || null })} className={`${inputClass} cursor-pointer appearance-none pr-10`}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
            </div>
          </form>
          <nav aria-label="Document type" className="no-scrollbar overflow-x-auto px-[clamp(0.75rem,2vw,1.25rem)] py-3">
            <ul className="flex gap-2">
              {[null, ...resourceKinds.filter((candidate) => state.kind !== 'ready' || base.some((document) => document.kind === candidate))].map((k) => {
                const active = kind === k
                const count = k ? base.filter((d) => d.kind === k).length : base.length
                return (
                  <li key={k ?? 'all'} className="shrink-0">
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => set({ kind: k })}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.875rem] font-semibold whitespace-nowrap transition-colors ${active ? 'border-forest bg-forest text-white' : 'border-border bg-surface text-ink hover:border-forest/40'}`}
                    >
                      {k ? resourceKindLabels[k] : 'All documents'}
                      <span className={`rounded-full px-1.5 text-[0.75rem] tabular-nums ${active ? 'bg-white/15' : 'bg-sand text-muted'}`}>{state.kind === 'ready' ? count : '–'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>}

        {state.kind === 'loading' && (
          <ul aria-busy="true" aria-label="Loading documents" className="grid gap-[var(--grid-gap)] sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <Skeleton className="h-56" />
              </li>
            ))}
          </ul>
        )}

        {state.kind === 'error' && (
          <EmptyState icon={FileSearch} title="Documents couldn’t be loaded" actions={<button type="button" onClick={retry} className={buttonClass()}>Try again</button>}>
            {state.message}
          </EmptyState>
        )}

        {state.kind === 'ready' && docs.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No product guides available yet"
            actions={
              <>
              <ButtonLink to="/contact?topic=products&message=Please%20help%20me%20find%20product%20information%20for%3A%20">Ask us for help</ButtonLink>
                <ButtonLink to="/resources/coverage-calculator" variant="secondary">
                  Work out how much you need
                </ButtonLink>
              </>
            }
          >
            We haven’t added product guides or safety files yet. Ask us and we’ll help you find the right product information.
          </EmptyState>
        )}

        {state.kind === 'ready' && docs.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[0.875rem] text-muted">
              <p aria-live="polite">
                <strong className="font-semibold text-ink">{shown.length}</strong> {shown.length === 1 ? 'document' : 'documents'}
                {query && <> matching “{query}”</>}
              </p>
              {filtered && (
                <button type="button" onClick={() => set({ kind: null, category: null, q: null })} className="inline-flex min-h-11 items-center gap-1 font-semibold text-forest hover:underline">
                  <X aria-hidden="true" className="size-4" /> Clear filters
                </button>
              )}
            </div>
            {shown.length === 0 ? (
              <EmptyState icon={FileSearch} title="No documents match" actions={<button type="button" onClick={() => set({ kind: null, category: null, q: null })} className={buttonClass('secondary')}>Clear filters</button>}>
                Try another document type, category or search term.
              </EmptyState>
            ) : (
              <ul className="grid gap-[var(--grid-gap)] sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((d) => {
                  const Icon = d.kind ? kindIcon[d.kind] : FileText
                  return (
                    <li key={d.key} className="surface-card flex flex-col p-[clamp(1.25rem,2.5vw,1.5rem)] transition-[box-shadow,border-color] duration-300 hover:border-forest/25 hover:shadow-[var(--shadow-lift)]">
                      <div className="flex items-start gap-3">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                          <Icon aria-hidden="true" className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.75rem] font-semibold tracking-[0.08em] text-copper uppercase">{d.kind ? resourceKindLabels[d.kind] : 'Supplier document'}</p>
                          <h2 className="mt-0.5 text-[1.0625rem] leading-snug font-semibold text-ink">{d.title}</h2>
                        </div>
                      </div>
                      {d.summary && <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted">{d.summary}</p>}
                      {d.productSlugs.length > 0 && (
                        <ul aria-label="Products" className="mt-4 flex flex-wrap gap-1.5">
                          {d.productSlugs.map((s) => {
                            const p = find(s)
                            return p ? (
                              <li key={s}>
                                <Link to={productPath(p)} className="inline-flex min-h-8 items-center rounded-full bg-sand px-3 text-[0.8125rem] font-medium text-ink hover:bg-forest-soft hover:text-forest">
                                  {p.name}
                                </Link>
                              </li>
                            ) : null
                          })}
                        </ul>
                      )}
                      <div className="mt-auto pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                        <span className="text-[0.8125rem] text-muted">{d.meta}</span>
                        <a href={d.href} download className={buttonClass('secondary', 'sm')}>
                          <Download aria-hidden="true" className="size-4" /> Download
                          <span className="sr-only"> {d.title}</span>
                        </a>
                      </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        <section aria-labelledby="assist-title" className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-forest-deep p-[clamp(1.25rem,4vw,2.25rem)] text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-mint">
              <MessageSquareText aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 id="assist-title" className="font-display text-[clamp(1.375rem,1.2rem+0.6vw,1.75rem)] leading-tight">
                Can’t find what you need?
              </h2>
              <p className="mt-1 max-w-[36rem] text-[0.9375rem] text-white/75">Ask us for product details or how-to advice, or work out how much you need.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/contact?topic=products&message=Please%20help%20me%20find%20product%20information%20for%3A%20" variant="light">
              Ask us for help
            </ButtonLink>
            <ButtonLink to="/resources/coverage-calculator" variant="outline-light">
              Work out how much you need
            </ButtonLink>
          </div>
        </section>
      </div>
    </>
  )
}
