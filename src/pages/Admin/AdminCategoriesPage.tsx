import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageOff, ImagePlus, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { buttonClass } from '../../components/ui/button.ts'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import { demoCategories } from '../../data/demoCategories.ts'
import type { ImageAsset } from '../../data/images.ts'
import { adminApi } from '../../features/admin/api.ts'
import { categoryInputSchema, type AdminCategory } from '../../features/catalog/categorySchema.ts'
import { slugify } from '../../features/catalog/productSchema.ts'
import { workspaceApi } from '../../features/cms/api.ts'
import { prepareImage } from '../../features/cms/image.ts'
import { QuoteApiError } from '../../features/quotes/api.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'
import ConfirmDialog from './ConfirmDialog.tsx'
import { Panel } from './ui.tsx'

interface FormState {
  slug: string
  name: string
  description: string
  image: ImageAsset | null
  visible: boolean
}

const emptyForm: FormState = { slug: '', name: '', description: '', image: null, visible: true }
const toForm = (c: AdminCategory): FormState => ({ slug: c.slug, name: c.name, description: c.description ?? '', image: c.image, visible: c.visible })

/** Bundled category photos, offered alongside Media Library images. */
const bundledImages: ImageAsset[] = demoCategories.flatMap((c) => (c.image ? [c.image] : []))

function CategoryEditor({
  editing,
  library,
  onSaved,
  onClose,
}: {
  editing: AdminCategory | null
  library: ImageAsset[]
  onSaved: (category: AdminCategory) => void
  onClose: () => void
}) {
  const creating = !editing
  const { getToken } = useAppAuth()
  const [form, setForm] = useState<FormState>(() => (editing ? toForm(editing) : emptyForm))
  const [slugTouched, setSlugTouched] = useState(!creating)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
  }

  useEffect(() => {
    document.getElementById('cat-name')?.focus()
  }, [])

  const token = async () => {
    const t = await getToken()
    if (!t) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
    return t
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setErrors((e) => ({ ...e, image: '' }))
    try {
      const photo = await prepareImage(file, 'original')
      const alt = form.image?.alt || form.name || 'Category image'
      const { media } = await workspaceApi.upload(await token(), { name: form.name || file.name, alt, folder: 'Categories', tags: [] }, photo.base64)
      set('image', { src: media.url, alt, width: photo.width, height: photo.height })
    } catch (error) {
      setErrors((e) => ({ ...e, image: error instanceof Error ? error.message : 'The image could not be uploaded.' }))
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving || uploading) return
    setFormError(null)
    const image = form.image ? { ...form.image, alt: form.image.alt.trim() || form.name.trim() } : null
    const parsed = categoryInputSchema.safeParse({ ...form, image })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message
      setErrors(next)
      document.getElementById(`cat-${Object.keys(next)[0]}`)?.focus()
      return
    }
    setSaving(true)
    try {
      const { category } = await adminApi.saveCategory(await token(), editing?.slug ?? null, parsed.data)
      onSaved(category)
    } catch (error) {
      const apiErr = error instanceof QuoteApiError ? error : null
      if (apiErr?.fieldErrors) {
        const next: Record<string, string> = {}
        for (const [k, v] of Object.entries(apiErr.fieldErrors)) next[k.split('.')[0]] ??= v
        setErrors(next)
      }
      setFormError(apiErr?.message ?? 'The category could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const options = library.filter((img) => img.src !== form.image?.src)

  return (
    <Panel
      id="category-editor-title"
      title={creating ? 'New category' : `Edit “${editing.name}”`}
      action={
        <button type="button" onClick={onClose} aria-label="Close editor" className="grid size-11 place-items-center rounded-xl text-muted hover:bg-sand hover:text-ink">
          <X aria-hidden="true" className="size-5" />
        </button>
      }
      className="mb-6"
    >
      <form noValidate onSubmit={submit} className="grid gap-[var(--grid-gap)] md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <div className="flex min-w-0 flex-col gap-[var(--grid-gap)]">
          {formError && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm font-semibold text-danger">
              {formError}
            </p>
          )}
          <Field id="cat-name" label="Name" required error={errors.name}>
            {(a) => (
              <input
                {...a}
                value={form.name}
                placeholder="e.g. Decorative Coatings"
                onChange={(e) => {
                  set('name', e.target.value)
                  if (!slugTouched) set('slug', slugify(e.target.value))
                }}
                className={inputClass}
              />
            )}
          </Field>
          <Field
            id="cat-slug"
            label="URL slug"
            required
            error={errors.slug}
            hint={creating ? `Store link: /products?category=${form.slug || '…'} · Cannot be changed later.` : `Store link: /products?category=${form.slug} · Fixed after creation.`}
          >
            {(a) => (
              <input
                {...a}
                value={form.slug}
                disabled={!creating}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))
                }}
                className={`${inputClass} disabled:bg-sand/60`}
              />
            )}
          </Field>
          <Field id="cat-description" label="Short description" error={errors.description} hint={`${form.description.length}/300 characters.`}>
            {(a) => <textarea {...a} rows={3} maxLength={300} value={form.description} onChange={(e) => set('description', e.target.value)} className={`${inputClass} py-3`} />}
          </Field>
          <label className="flex min-h-11 items-center gap-3 font-semibold">
            <input type="checkbox" checked={form.visible} onChange={(e) => set('visible', e.target.checked)} className="size-5 accent-forest" />
            Show in store menus
            <span className="text-sm font-normal text-muted">{form.visible ? 'Listed on the home and products pages.' : 'Hidden from menus; its products can still be found.'}</span>
          </label>
        </div>

        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="text-[0.875rem] font-semibold">
            Image <span className="text-[0.8125rem] font-normal text-muted">(optional)</span>
          </legend>
          <div className="grid aspect-[16/10] place-items-center overflow-clip rounded-xl border border-border bg-sand/50">
            {form.image ? (
              <img src={form.image.src} alt={form.image.alt || 'Category image preview'} className="size-full object-cover" />
            ) : (
              <ImageOff aria-hidden="true" className="size-8 text-muted" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className={`${buttonClass('secondary', 'sm')} cursor-pointer focus-within:outline-[0.1875rem] focus-within:outline-offset-2 focus-within:outline-forest ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
              {uploading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <ImagePlus aria-hidden="true" className="size-4" />}
              {uploading ? 'Uploading…' : form.image ? 'Replace' : 'Upload'}
              <input
                id="cat-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  void upload(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
            {form.image && (
              <button type="button" onClick={() => set('image', null)} className={buttonClass('ghost', 'sm')}>
                Remove
              </button>
            )}
          </div>
          {options.length > 0 && (
            <select
              aria-label="Choose an existing image"
              value=""
              onChange={(e) => {
                const img = options.find((i) => i.src === e.target.value)
                if (img) set('image', { ...img, alt: form.image?.alt || img.alt })
              }}
              className={inputClass}
            >
              <option value="">Or choose an existing image…</option>
              {options.map((img) => (
                <option key={img.src} value={img.src}>
                  {img.src.startsWith('/images/') ? img.src.replace('/images/', '') : `Library · ${img.alt}`}
                </option>
              ))}
            </select>
          )}
          {form.image && (
            <Field id="cat-image-alt" label="Image description (alt text)" hint="Defaults to the category name.">
              {(a) => <input {...a} value={form.image?.alt ?? ''} onChange={(e) => form.image && set('image', { ...form.image, alt: e.target.value })} className={inputClass} />}
            </Field>
          )}
          {errors.image && <p className="text-[0.8125rem] font-semibold text-danger">{errors.image}</p>}
        </fieldset>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4 md:col-span-2">
          <button type="button" onClick={onClose} className={buttonClass('secondary')}>
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading} className={buttonClass('primary')}>
            {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {saving ? 'Saving…' : creating ? 'Create category' : 'Save changes'}
          </button>
        </div>
      </form>
    </Panel>
  )
}

export default function AdminCategoriesPage() {
  const { getToken } = useAppAuth()
  const show = useToasts((s) => s.show)
  const [state, reload] = useAuthedRemote(async (t) => (await adminApi.categories(t)).categories, 'admin-categories')
  const [local, setLocal] = useState<AdminCategory[] | null>(null)
  const rows = local ?? (state.kind === 'ready' ? state.data : null)
  const [editor, setEditor] = useState<{ category: AdminCategory | null } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null)
  const [moveTo, setMoveTo] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [library, setLibrary] = useState<ImageAsset[]>(bundledImages)

  useEffect(() => {
    let active = true
    void getToken()
      .then((t) => (t ? workspaceApi.media(t) : null))
      .then((r) =>
        Promise.all(
          (r?.media ?? []).map(
            (m) =>
              new Promise<ImageAsset | null>((resolve) => {
                const img = new Image()
                img.onload = () => resolve({ src: m.url, alt: m.alt || m.name, width: img.naturalWidth, height: img.naturalHeight })
                img.onerror = () => resolve(null)
                img.src = m.url
              }),
          ),
        ),
      )
      .then((found) => {
        if (active) setLibrary((prev) => [...prev, ...found.filter((i): i is ImageAsset => !!i && !prev.some((p) => p.src === i.src))])
      })
      .catch(() => {}) // Library is optional; bundled images remain available.
    return () => {
      active = false
    }
  }, [getToken])

  const token = async () => {
    const t = await getToken()
    if (!t) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
    return t
  }
  const update = (fn: (rs: AdminCategory[]) => AdminCategory[]) => setLocal(fn(rows ?? []))

  const move = async (index: number, delta: -1 | 1) => {
    if (!rows || busy) return
    const next = [...rows]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    const previous = rows
    setLocal(next)
    setBusy(item.slug)
    try {
      await adminApi.reorderCategories(await token(), next.map((c) => c.slug))
    } catch (error) {
      setLocal(previous)
      show(error instanceof QuoteApiError ? `Order not saved: ${error.message}` : 'Order not saved. Please try again.')
    } finally {
      setBusy(null)
      requestAnimationFrame(() => document.getElementById(`cat-${item.slug}-${delta < 0 ? 'up' : 'down'}`)?.focus())
    }
  }

  const toggleVisible = async (c: AdminCategory) => {
    setBusy(c.slug)
    update((rs) => rs.map((r) => (r.slug === c.slug ? { ...r, visible: !c.visible } : r)))
    try {
      const { category } = await adminApi.saveCategory(await token(), c.slug, { ...c, visible: !c.visible })
      update((rs) => rs.map((r) => (r.slug === c.slug ? category : r)))
      show(`“${c.name}” is now ${category.visible ? 'shown in' : 'hidden from'} store menus.`)
    } catch (error) {
      update((rs) => rs.map((r) => (r.slug === c.slug ? c : r)))
      show(error instanceof QuoteApiError ? `Not changed: ${error.message}` : 'Not changed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    if (toDelete.productCount && !moveTo) {
      setDeleteError('Choose where to move its products first.')
      return
    }
    setBusy(toDelete.slug)
    setDeleteError(null)
    try {
      await adminApi.deleteCategory(await token(), toDelete.slug, toDelete.productCount ? moveTo : undefined)
      const target = rows?.find((r) => r.slug === moveTo)
      update((rs) => rs.filter((r) => r.slug !== toDelete.slug).map((r) => (r.slug === moveTo ? { ...r, productCount: r.productCount + toDelete.productCount } : r)))
      show(toDelete.productCount && target ? `“${toDelete.name}” deleted; ${toDelete.productCount} product${toDelete.productCount === 1 ? '' : 's'} moved to ${target.name}.` : `“${toDelete.name}” was deleted.`)
      setToDelete(null)
    } catch (error) {
      setDeleteError(error instanceof QuoteApiError ? error.message : 'The category could not be deleted. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <title>Categories — Admin — VELTO</title>
      <AdminHeading
        title="Categories"
        crumbs={[{ label: 'Categories' }]}
        actions={
          <button type="button" onClick={() => setEditor({ category: null })} className={buttonClass('primary')}>
            <Plus aria-hidden="true" className="size-4" />
            Add category
          </button>
        }
      >
        Organise how products are grouped in the store. The order here is the order customers see on the home and products pages.
      </AdminHeading>

      {editor && (
        <CategoryEditor
          key={editor.category?.slug ?? 'new'}
          editing={editor.category}
          library={library}
          onClose={() => setEditor(null)}
          onSaved={(category) => {
            update((rs) => (rs.some((r) => r.slug === category.slug) ? rs.map((r) => (r.slug === category.slug ? category : r)) : [...rs, category]))
            show(`“${category.name}” saved.`)
            setEditor(null)
          }}
        />
      )}

      <RemoteState state={state} reload={reload} skeleton={4}>
        {() =>
          rows && rows.length ? (
            <Panel bodyClassName="">
              <ol className="divide-y divide-border">
                {rows.map((c, i) => (
                  <li key={c.slug} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-5">
                    <div className="flex shrink-0 flex-col">
                      <button
                        id={`cat-${c.slug}-up`}
                        type="button"
                        disabled={i === 0 || busy !== null}
                        onClick={() => void move(i, -1)}
                        aria-label={`Move ${c.name} up`}
                        className="grid size-11 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink disabled:opacity-30"
                      >
                        <ArrowUp aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        id={`cat-${c.slug}-down`}
                        type="button"
                        disabled={i === rows.length - 1 || busy !== null}
                        onClick={() => void move(i, 1)}
                        aria-label={`Move ${c.name} down`}
                        className="grid size-11 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                    <div className="grid h-16 w-24 shrink-0 place-items-center overflow-clip rounded-xl border border-border bg-sand/50">
                      {c.image ? <img src={c.image.src} alt="" loading="lazy" className="size-full object-cover" /> : <ImageOff aria-hidden="true" className="size-5 text-muted" />}
                    </div>
                    <div className="min-w-0 flex-1 basis-[12rem]">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">{c.name}</span>
                        {!c.visible && (
                          <Badge tone="muted" dot={false}>
                            Hidden
                          </Badge>
                        )}
                      </p>
                      <p className="truncate text-[0.8125rem] text-muted">
                        /{c.slug}
                        {c.description && <> · {c.description}</>}
                      </p>
                      <Link to={`/admin/products?category=${c.slug}`} className="text-[0.8125rem] font-semibold text-forest hover:underline">
                        {c.productCount} product{c.productCount === 1 ? '' : 's'}
                      </Link>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void toggleVisible(c)}
                        aria-label={c.visible ? `Hide ${c.name} from store menus` : `Show ${c.name} in store menus`}
                        title={c.visible ? 'Hide from store menus' : 'Show in store menus'}
                        className="grid size-11 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink disabled:opacity-40"
                      >
                        {busy === c.slug ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : c.visible ? <Eye aria-hidden="true" className="size-4" /> : <EyeOff aria-hidden="true" className="size-4" />}
                      </button>
                      <button type="button" onClick={() => setEditor({ category: c })} className={buttonClass('secondary', 'sm')}>
                        <Pencil aria-hidden="true" className="size-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => {
                          setDeleteError(null)
                          setMoveTo('')
                          setToDelete(c)
                        }}
                        aria-label={`Delete ${c.name}`}
                        className="grid size-11 place-items-center rounded-lg text-danger hover:bg-danger-soft disabled:opacity-40"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : (
            <Panel>
              <p className="text-muted">No categories yet. Add one to start grouping products.</p>
            </Panel>
          )
        }
      </RemoteState>

      <ConfirmDialog
        open={toDelete !== null}
        icon={Trash2}
        title={<>Delete “{toDelete?.name}”?</>}
        confirmLabel={toDelete?.productCount ? 'Move products and delete' : 'Delete category'}
        busyLabel="Deleting…"
        busy={busy !== null && busy === toDelete?.slug}
        error={deleteError}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        {toDelete?.productCount ? (
          <>
            <p>
              {toDelete.productCount} product{toDelete.productCount === 1 ? ' is' : 's are'} in this category. Choose where to move {toDelete.productCount === 1 ? 'it' : 'them'} before deleting.
            </p>
            <label className="mt-4 flex flex-col gap-1.5 text-[0.875rem] font-semibold text-ink">
              Move products to
              <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={`${inputClass} font-normal`}>
                <option value="">Choose a category…</option>
                {rows
                  ?.filter((r) => r.slug !== toDelete.slug)
                  .map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          </>
        ) : (
          'This permanently removes the category. It has no products. This can’t be undone.'
        )}
      </ConfirmDialog>
    </>
  )
}
