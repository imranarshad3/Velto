import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Download, Eye, EyeOff, FileText, FileUp, MoreHorizontal, Pencil, Search, Trash2, Upload, X } from 'lucide-react'
import { buttonClass } from '../../components/ui/button.ts'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import { adminApi } from '../../features/admin/api.ts'
import type { AdminProduct } from '../../features/admin/types.ts'
import { QuoteApiError } from '../../features/quotes/api.ts'
import { formatBytes, MAX_RESOURCE_BYTES, resourceDownloadPath, resourceKindLabels, resourceKinds, type ResourceKind, type TechnicalResource } from '../../features/resources/types.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'
import ConfirmDialog from './ConfirmDialog.tsx'
import Menu from './Menu.tsx'
import { FilterTabs } from './ui.tsx'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
type StatusFilter = 'all' | 'published' | 'draft'

interface FormState {
  title: string
  kind: ResourceKind
  summary: string
  productSlugs: string[]
  published: boolean
  file: File | null
}

/** Upload/edit form in a native modal dialog. The PDF goes straight to private storage via a one-time URL. */
function ResourceDialog({ open, resource, products, onClose, onSaved }: { open: boolean; resource: TechnicalResource | null; products: AdminProduct[]; onClose: () => void; onSaved: (r: TechnicalResource) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { getToken } = useAppAuth()
  const [form, setForm] = useState<FormState>({ title: '', kind: 'data_sheet', summary: '', productSlugs: [], published: false, file: null })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<null | 'uploading' | 'saving'>(null)
  const [productFilter, setProductFilter] = useState('')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setForm(resource ? { title: resource.title, kind: resource.kind, summary: resource.summary ?? '', productSlugs: resource.productSlugs, published: resource.published, file: null } : { title: '', kind: 'data_sheet', summary: '', productSlugs: [], published: false, file: null })
      setErrors({})
      setProductFilter('')
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open, resource])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '', form: '' }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const local: Record<string, string> = {}
    if (form.title.trim().length < 3) local.title = 'Enter a title of at least 3 characters'
    if (!resource && !form.file) local.file = 'Choose a PDF to upload'
    if (form.file && (form.file.type !== 'application/pdf' || !/\.pdf$/i.test(form.file.name))) local.file = 'Upload a PDF file'
    else if (form.file && form.file.size > MAX_RESOURCE_BYTES) local.file = 'PDFs can be up to 20 MB'
    if (Object.keys(local).length) return setErrors(local)
    try {
      const t = await getToken()
      if (!t) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
      let storagePath: string | undefined
      if (form.file) {
        setBusy('uploading')
        storagePath = await adminApi.uploadResourceFile(t, form.file)
      }
      setBusy('saving')
      const { resource: saved } = await adminApi.saveResource(t, resource?.id ?? null, {
        title: form.title,
        kind: form.kind,
        summary: form.summary,
        productSlugs: form.productSlugs,
        published: form.published,
        ...(storagePath ? { storagePath, fileName: form.file!.name } : {}),
      })
      onSaved(saved)
    } catch (error) {
      const fe = error instanceof QuoteApiError ? error.fieldErrors : undefined
      setErrors({ ...(fe ?? {}), form: fe ? '' : error instanceof QuoteApiError ? error.message : 'The document could not be saved. Please try again.' })
    } finally {
      setBusy(null)
    }
  }

  const term = productFilter.trim().toLowerCase()
  const listed = products.filter((p) => !term || p.name.toLowerCase().includes(term) || form.productSlugs.includes(p.slug))

  return (
    <dialog
      ref={ref}
      aria-labelledby="resource-form-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-card)] border border-border bg-surface p-0 text-ink shadow-[var(--shadow-float)] backdrop:bg-forest-deep/50"
    >
      {open && (
        <form onSubmit={submit} noValidate className="flex flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <h2 id="resource-form-title" className="text-[1.25rem] font-semibold">
                {resource ? 'Edit document' : 'Upload document'}
              </h2>
              <p className="mt-0.5 text-[0.875rem] text-muted">PDF, up to 20 MB. Stored privately; customers download published files through expiring links.</p>
            </div>
            <button type="button" onClick={onClose} disabled={busy !== null} aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink">
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>
          <div className="flex flex-col gap-5 px-6 py-5">
            <Field id="res-file" label={resource ? 'Replace file' : 'PDF file'} required={!resource} error={errors.file} hint={resource ? `Current: ${resource.fileName} (${formatBytes(resource.fileSize)})` : undefined}>
              {(c) => (
                <label htmlFor={c.id} className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-4 text-center transition-colors ${errors.file ? 'border-danger bg-danger-soft/30' : 'border-border bg-canvas hover:border-forest/40'}`}>
                  <FileUp aria-hidden="true" className="size-6 text-forest" />
                  <span className="text-[0.9375rem] font-semibold">{form.file ? form.file.name : 'Choose a PDF'}</span>
                  <span className="text-[0.8125rem] text-muted">{form.file ? formatBytes(form.file.size) : 'Click to browse'}</span>
                  <input {...c} type="file" accept="application/pdf,.pdf" onChange={(e) => set('file', e.target.files?.[0] ?? null)} className="sr-only" />
                </label>
              )}
            </Field>
            <Field id="res-title" label="Title" required error={errors.title}>
              {(c) => <input {...c} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={160} className={inputClass} />}
            </Field>
            <Field id="res-kind" label="Document type" required error={errors.kind}>
              {(c) => (
                <select {...c} value={form.kind} onChange={(e) => set('kind', e.target.value as ResourceKind)} className={`${inputClass} cursor-pointer`}>
                  {resourceKinds.map((k) => (
                    <option key={k} value={k}>
                      {resourceKindLabels[k]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field id="res-summary" label="Summary" error={errors.summary}>
              {(c) => <textarea {...c} value={form.summary} onChange={(e) => set('summary', e.target.value)} maxLength={600} rows={3} className={`${inputClass} py-3`} />}
            </Field>
            <fieldset className="min-w-0">
              <legend className="text-[0.875rem] font-semibold">
                Linked products <span className="ml-1.5 text-[0.8125rem] font-normal text-muted">({form.productSlugs.length} selected)</span>
              </legend>
              <label htmlFor="res-product-filter" className="sr-only">
                Filter products
              </label>
              <input id="res-product-filter" type="search" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} placeholder="Filter products" className={`${inputClass} mt-1.5`} />
              <ul className="mt-2 max-h-[12rem] overflow-y-auto rounded-xl border border-border">
                {listed.map((p) => (
                  <li key={p.slug} className="border-b border-border last:border-b-0">
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 text-[0.9375rem] hover:bg-cream">
                      <input
                        type="checkbox"
                        checked={form.productSlugs.includes(p.slug)}
                        onChange={(e) => set('productSlugs', e.target.checked ? [...form.productSlugs, p.slug] : form.productSlugs.filter((s) => s !== p.slug))}
                        className="size-[1.125rem] accent-forest"
                      />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      {!p.published && <span className="text-[0.75rem] text-muted">Hidden</span>}
                    </label>
                  </li>
                ))}
              </ul>
              {errors.productSlugs && <p className="mt-1.5 text-[0.8125rem] text-danger">{errors.productSlugs}</p>}
            </fieldset>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]">
              <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="size-[1.125rem] accent-forest" />
              <span>
                <span className="font-semibold">Published</span> <span className="text-muted">— visible and downloadable in the Resource Center and on linked product pages</span>
              </span>
            </label>
            {errors.form && (
              <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-[0.875rem] text-danger">
                {errors.form}
              </p>
            )}
          </div>
          <footer className="flex flex-wrap justify-end gap-2 border-t border-border bg-canvas/60 px-6 py-4">
            <button type="button" onClick={onClose} disabled={busy !== null} className={buttonClass('secondary')}>
              Cancel
            </button>
            <button type="submit" disabled={busy !== null} className={buttonClass('primary', 'md', 'disabled:opacity-70')}>
              <Upload aria-hidden="true" className="size-4" />
              {busy === 'uploading' ? 'Uploading…' : busy === 'saving' ? 'Saving…' : resource ? 'Save changes' : 'Upload document'}
            </button>
          </footer>
        </form>
      )}
    </dialog>
  )
}

export default function AdminResourcesPage() {
  const { getToken } = useAppAuth()
  const show = useToasts((s) => s.show)
  const [state, reload] = useAuthedRemote(async (t) => {
    const [{ resources }, { products }] = await Promise.all([adminApi.resources(t), adminApi.products(t)])
    return { resources, products }
  }, 'admin-resources')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [kind, setKind] = useState<ResourceKind | ''>('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<TechnicalResource | null | 'new'>(null)
  const [toDelete, setToDelete] = useState<TechnicalResource | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const data = state.kind === 'ready' ? state.data : null
  const productName = useMemo(() => new Map(data?.products.map((p) => [p.slug, p.name]) ?? []), [data])
  const all = data?.resources ?? []
  const term = query.trim().toLowerCase()
  const shown = all.filter(
    (r) =>
      (status === 'all' || (status === 'published') === r.published) &&
      (!kind || r.kind === kind) &&
      (!term || [r.title, r.fileName, ...r.productSlugs.map((s) => productName.get(s) ?? s)].some((v) => v.toLowerCase().includes(term))),
  )

  const token = async () => {
    const t = await getToken()
    if (!t) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
    return t
  }

  const togglePublished = async (r: TechnicalResource) => {
    try {
      await adminApi.saveResource(await token(), r.id, { title: r.title, kind: r.kind, summary: r.summary ?? '', productSlugs: r.productSlugs, published: !r.published })
      show(r.published ? `“${r.title}” is now a draft.` : `“${r.title}” is published.`)
      reload()
    } catch (error) {
      show(error instanceof QuoteApiError ? error.message : 'The document could not be updated.')
    }
  }

  const remove = async () => {
    if (!toDelete) return
    setBusy(true)
    setDeleteError(null)
    try {
      await adminApi.deleteResource(await token(), toDelete.id)
      show(`“${toDelete.title}” was deleted.`)
      setToDelete(null)
      reload()
    } catch (error) {
      setDeleteError(error instanceof QuoteApiError ? error.message : 'The document could not be deleted.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <title>Resources — Admin — VELTO</title>
      <AdminHeading
        title="Resources"
        crumbs={[{ label: 'Resources' }]}
        actions={
          <button type="button" onClick={() => setEditing('new')} disabled={!data} className={buttonClass()}>
            <Upload aria-hidden="true" className="size-4" /> Upload document
          </button>
        }
      >
        Technical documents for the Resource Center and product pages. Upload manufacturer-supplied PDFs only; drafts stay private.
      </AdminHeading>

      <RemoteState state={state} reload={reload} skeleton={4}>
        {() => (
          <section aria-label="Documents" className="surface-card overflow-clip">
            <div className="flex flex-col gap-3 border-b border-border p-[clamp(1rem,2.5vw,1.5rem)] lg:flex-row lg:items-center lg:justify-between">
              <FilterTabs
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: `All (${all.length})` },
                  { value: 'published', label: `Published (${all.filter((r) => r.published).length})` },
                  { value: 'draft', label: `Draft (${all.filter((r) => !r.published).length})` },
                ]}
              />
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] lg:w-[34rem]">
                <span className="relative">
                  <label htmlFor="res-search" className="sr-only">
                    Search documents
                  </label>
                  <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-muted" />
                  <input id="res-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, file or product" className={`${inputClass} pl-11`} />
                </span>
                <label htmlFor="res-kind-filter" className="sr-only">
                  Document type
                </label>
                <select id="res-kind-filter" value={kind} onChange={(e) => setKind(e.target.value as ResourceKind | '')} className={`${inputClass} cursor-pointer`}>
                  <option value="">All types</option>
                  {resourceKinds.map((k) => (
                    <option key={k} value={k}>
                      {resourceKindLabels[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {shown.length === 0 ? (
              <div className="m-[clamp(1rem,2.5vw,1.5rem)] grid place-items-center rounded-xl border border-dashed border-border bg-canvas px-4 py-14 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-forest-soft text-forest">
                  <FileText aria-hidden="true" className="size-6" />
                </span>
                <p className="mt-4 font-semibold">{all.length ? 'No documents match these filters' : 'No documents yet'}</p>
                <p className="mt-1 max-w-[28rem] text-[0.875rem] text-muted">{all.length ? 'Try another status, type or search term.' : 'Upload a manufacturer data sheet or installation guide to start the Resource Center.'}</p>
                {!all.length && (
                  <button type="button" onClick={() => setEditing('new')} className={buttonClass('primary', 'sm', 'mt-5')}>
                    <Upload aria-hidden="true" className="size-4" /> Upload document
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {shown.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start gap-4 px-[clamp(1rem,2.5vw,1.5rem)] py-4 transition-colors hover:bg-cream/50 sm:flex-nowrap sm:items-center">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
                      <FileText aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setEditing(r)} className="text-left font-semibold text-ink hover:text-forest hover:underline">
                          {r.title}
                        </button>
                        <Badge tone={r.published ? 'green' : 'muted'}>{r.published ? 'Published' : 'Draft'}</Badge>
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] text-muted">
                        {resourceKindLabels[r.kind]} · {formatBytes(r.fileSize)} · Updated {dateFmt.format(new Date(r.updatedAt))}
                      </p>
                      <p className="mt-1 truncate text-[0.8125rem] text-muted">{r.productSlugs.length ? r.productSlugs.map((s) => productName.get(s) ?? s).join(', ') : 'Not linked to a product'}</p>
                    </div>
                    <Menu
                      label={`Actions for ${r.title}`}
                      triggerClassName="grid size-10 shrink-0 place-items-center rounded-full border border-transparent text-muted transition-colors hover:border-border hover:bg-surface hover:text-ink aria-expanded:border-border aria-expanded:bg-surface"
                      trigger={<MoreHorizontal aria-hidden="true" className="size-5" />}
                      items={[
                        { label: 'Edit', icon: Pencil, onSelect: () => setEditing(r) },
                        { label: r.published ? 'Unpublish' : 'Publish', icon: r.published ? EyeOff : Eye, onSelect: () => void togglePublished(r) },
                        { label: 'Download', icon: Download, onSelect: () => window.open(resourceDownloadPath(r.id), '_blank', 'noopener'), disabled: !r.published, hint: r.published ? undefined : 'Publish to download' },
                        { label: 'Delete', icon: Trash2, danger: true, onSelect: () => (setDeleteError(null), setToDelete(r)) },
                      ]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </RemoteState>

      <ResourceDialog
        open={editing !== null}
        resource={editing === 'new' ? null : editing}
        products={data?.products ?? []}
        onClose={() => setEditing(null)}
        onSaved={(r) => {
          show(editing === 'new' ? `“${r.title}” uploaded.` : `“${r.title}” saved.`)
          setEditing(null)
          reload()
        }}
      />
      <ConfirmDialog
        open={toDelete !== null}
        icon={Trash2}
        title={<>Delete “{toDelete?.title}”?</>}
        confirmLabel="Delete document"
        busyLabel="Deleting…"
        busy={busy}
        error={deleteError}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void remove()}
      >
        The file is removed from storage and disappears from the Resource Center and product pages. Coverage data that cites it keeps its values but loses the link.
      </ConfirmDialog>
    </>
  )
}
