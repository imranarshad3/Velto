import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import { catalog } from '../../data/catalog.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import type { ImageAsset } from '../../data/images.ts'
import { applications } from '../../data/homeContent.ts'
import { adminApi } from '../../features/admin/api.ts'
import { workspaceApi } from '../../features/cms/api.ts'
import type { AdminProduct } from '../../features/admin/types.ts'
import { applicationSlugs, areaSlugs, categorySlugs, productInputSchema, type ProductInput } from '../../features/catalog/productSchema.ts'
import { QuoteApiError } from '../../features/quotes/api.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import AdminHeading from './AdminHeading.tsx'
import CoveragePanel from './CoveragePanel.tsx'

/** Images already shipped in /public/images that can be attached to a product. */
const imageOptions: ImageAsset[] = [
  ...catalog.flatMap((p) => (p.image ? [p.image] : [])),
  ...demoCategories.flatMap((c) => (c.image ? [{ ...c.image }] : [])),
].filter((img, i, all) => all.findIndex((x) => x.src === img.src) === i)

const appName = new Map(applications.map((a) => [a.slug, a.name]))
const lines = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean)
const pairs = (v: string, sep: string) => lines(v).map((l) => l.split(sep).map((p) => p.trim()))

interface FormState {
  slug: string
  name: string
  categorySlug: string
  usage: string
  description: string
  applications: string[]
  areas: string[]
  benefits: string
  specifications: string
  packSizes: string
  coverage: string
  documents: string
  faq: string
  image: string
  imageAlt: string
  priceAmount: string
  priceCurrency: string
  verified: boolean
  published: boolean
  sortOrder: string
}

const toForm = (p?: AdminProduct): FormState => ({
  slug: p?.slug ?? '',
  name: p?.name ?? '',
  categorySlug: p?.categorySlug ?? '',
  usage: p?.usage ?? '',
  description: p?.description ?? '',
  applications: p?.applications ?? [],
  areas: p?.areas ?? [],
  benefits: (p?.benefits ?? []).join('\n'),
  specifications: (p?.specifications ?? []).map((s) => `${s.label}: ${s.value}`).join('\n'),
  packSizes: (p?.packSizes ?? []).join('\n'),
  coverage: p?.coverage ?? '',
  documents: (p?.documents ?? []).map((d) => `${d.title} | ${d.url} | ${d.fileType}`).join('\n'),
  faq: (p?.faq ?? []).map((f) => `${f.question} | ${f.answer}`).join('\n'),
  image: p?.image?.src ?? '',
  imageAlt: p?.image?.alt ?? '',
  priceAmount: p?.price ? String(p.price.amount) : '',
  priceCurrency: p?.price?.currency ?? '',
  verified: p?.verified ?? false,
  published: p?.published ?? true,
  sortOrder: String(p?.sortOrder ?? 0),
})

const toInput = (f: FormState, options: ImageAsset[] = imageOptions): ProductInput => {
  const image = options.find((i) => i.src === f.image)
  return {
    slug: f.slug,
    name: f.name,
    categorySlug: f.categorySlug as ProductInput['categorySlug'],
    usage: f.usage,
    description: f.description,
    applications: f.applications as ProductInput['applications'],
    areas: f.areas as ProductInput['areas'],
    benefits: lines(f.benefits),
    specifications: lines(f.specifications).map((l) => {
      const i = l.indexOf(':')
      return { label: i > 0 ? l.slice(0, i).trim() : l, value: i > 0 ? l.slice(i + 1).trim() : '' }
    }),
    packSizes: lines(f.packSizes),
    coverage: f.coverage,
    documents: pairs(f.documents, '|').map(([title = '', url = '', fileType = '']) => ({ title, url, fileType })),
    faq: pairs(f.faq, '|').map(([question = '', answer = '']) => ({ question, answer })),
    image: image ? { ...image, alt: f.imageAlt.trim() || image.alt } : undefined,
    price: f.priceAmount || f.priceCurrency ? { amount: Number(f.priceAmount), currency: f.priceCurrency.trim().toUpperCase() } : undefined,
    verified: f.verified,
    published: f.published,
    sortOrder: Number(f.sortOrder) || 0,
  }
}

function ProductForm({ product }: { product?: AdminProduct }) {
  const creating = !product
  const navigate = useNavigate()
  const { getToken } = useAppAuth()
  const show = useToasts((s) => s.show)
  const [form, setForm] = useState<FormState>(() => toForm(product))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  // Media Library images are offered alongside bundled ones; dimensions are read so the storefront reserves aspect ratio.
  const [options, setOptions] = useState<ImageAsset[]>(() =>
    product?.image && !imageOptions.some((i) => i.src === product.image!.src) ? [...imageOptions, product.image] : imageOptions,
  )
  useEffect(() => {
    let active = true
    void getToken()
      .then((t) => (t ? workspaceApi.media(t) : null))
      .then((r) => {
        if (!r || !active) return
        return Promise.all(
          r.media.map(
            (m) =>
              new Promise<ImageAsset | null>((resolve) => {
                const img = new Image()
                img.onload = () => resolve({ src: m.url, alt: m.alt || m.name, width: img.naturalWidth, height: img.naturalHeight })
                img.onerror = () => resolve(null)
                img.src = m.url
              }),
          ),
        ).then((found) => {
          if (active) setOptions((prev) => [...prev, ...found.filter((i): i is ImageAsset => !!i && !prev.some((p) => p.src === i.src))])
        })
      })
      .catch(() => {}) // Library is optional here; bundled images remain available.
    return () => {
      active = false
    }
  }, [getToken])
  const toggle = (key: 'applications' | 'areas', value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const input = toInput(form, options)
    const parsed = productInputSchema.safeParse(input)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message
      setErrors(next)
      setFormError('Please correct the highlighted fields.')
      document.getElementById(`pf-${Object.keys(next)[0]}`)?.focus()
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
      if (creating) await adminApi.createProduct(token, input)
      else await adminApi.updateProduct(token, product.slug, input)
      show(`${input.name} saved`)
      navigate('/admin/products')
    } catch (err) {
      const apiErr = err instanceof QuoteApiError ? err : null
      const fe: Record<string, string> = {}
      for (const [k, v] of Object.entries(apiErr?.fieldErrors ?? {})) fe[k.split('.')[0]] ??= v
      setErrors(fe)
      setFormError(apiErr?.message ?? 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const text = (key: keyof FormState, label: string, opts: { required?: boolean; hint?: string; rows?: number; disabled?: boolean } = {}) => (
    <Field id={`pf-${key}`} label={label} required={opts.required} hint={opts.hint} error={errors[key === 'priceAmount' || key === 'priceCurrency' ? 'price' : key === 'imageAlt' ? 'image' : key]}>
      {(a) =>
        opts.rows ? (
          <textarea {...a} rows={opts.rows} value={form[key] as string} onChange={(e) => set(key, e.target.value as never)} className={`${inputClass} py-3`} />
        ) : (
          <input {...a} value={form[key] as string} disabled={opts.disabled} onChange={(e) => set(key, e.target.value as never)} className={`${inputClass} disabled:bg-sand/60`} />
        )
      }
    </Field>
  )
  const checks = (key: 'applications' | 'areas', label: string, options: readonly string[], name: (v: string) => string) => (
    <fieldset className="min-w-0">
      <legend className="text-[0.875rem] font-semibold">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-x-4">
        {options.map((o) => (
          <label key={o} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={form[key].includes(o)} onChange={() => toggle(key, o)} className="size-[1.125rem] accent-forest" /> {name(o)}
          </label>
        ))}
      </div>
      {errors[key] && <p className="text-[0.8125rem] font-semibold text-danger">{errors[key]}</p>}
    </fieldset>
  )

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      {formError && (
        <p role="alert" className="flex gap-2 rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" /> {formError}
        </p>
      )}
      <section className="grid gap-[var(--grid-gap)] surface-card p-5 sm:grid-cols-2">
        <h2 className="font-display text-[1.375rem] sm:col-span-2">Basics</h2>
        {text('name', 'Name', { required: true })}
        {text('slug', 'URL slug', { required: true, hint: creating ? 'Lowercase letters, numbers and hyphens. Cannot be changed later.' : 'Fixed after creation.', disabled: !creating })}
        <Field id="pf-categorySlug" label="Category" required error={errors.categorySlug}>
          {(a) => (
            <select {...a} value={form.categorySlug} onChange={(e) => set('categorySlug', e.target.value)} className={inputClass}>
              <option value="">Choose…</option>
              {categorySlugs.map((c) => (
                <option key={c} value={c}>
                  {demoCategories.find((d) => d.slug === c)?.name ?? c}
                </option>
              ))}
            </select>
          )}
        </Field>
        {text('sortOrder', 'Sort order', { hint: 'Lower numbers appear first.' })}
        <div className="sm:col-span-2">{text('usage', 'Short usage line', { required: true })}</div>
        <div className="sm:col-span-2">{text('description', 'Description', { rows: 4, hint: 'Manufacturer-verified wording only.' })}</div>
        {checks('applications', 'Applications', applicationSlugs, (v) => appName.get(v) ?? v)}
        {checks('areas', 'Use areas', areaSlugs, (v) => (v === 'interior' ? 'Interior' : 'Exterior'))}
      </section>

      <section className="grid gap-[var(--grid-gap)] surface-card p-5 sm:grid-cols-2">
        <h2 className="font-display text-[1.375rem] sm:col-span-2">Technical information</h2>
        {text('benefits', 'Benefits', { rows: 4, hint: 'One per line.' })}
        {text('specifications', 'Specifications', { rows: 4, hint: 'One per line as “Label: Value”.' })}
        {text('packSizes', 'Pack sizes', { rows: 3, hint: 'One per line, e.g. “20 kg bag”.' })}
        {text('coverage', 'Coverage', { rows: 3 })}
        <div className="sm:col-span-2">{text('documents', 'Documents', { rows: 3, hint: 'One per line as “Title | https://… | pdf”.' })}</div>
        <div className="sm:col-span-2">{text('faq', 'FAQ', { rows: 3, hint: 'One per line as “Question | Answer”.' })}</div>
      </section>

      <section className="grid gap-[var(--grid-gap)] surface-card p-5 sm:grid-cols-2">
        <h2 className="font-display text-[1.375rem] sm:col-span-2">Image, price & visibility</h2>
        <Field id="pf-image" label="Image" error={errors.image} hint="Bundled images and Media Library uploads.">
          {(a) => (
            <select {...a} value={form.image} onChange={(e) => set('image', e.target.value)} className={inputClass}>
              <option value="">No image (placeholder)</option>
              {options.map((img) => (
                <option key={img.src} value={img.src}>
                  {img.src.startsWith('/images/') ? img.src.replace('/images/', '') : `Library · ${img.alt}`}
                </option>
              ))}
            </select>
          )}
        </Field>
        {text('imageAlt', 'Image alt text')}
        {text('priceAmount', 'Price amount', { hint: 'Shown only when the product is verified.' })}
        {text('priceCurrency', 'Currency (ISO code)', { hint: 'e.g. PKR' })}
        <label className="flex min-h-11 items-center gap-3 font-semibold">
          <input type="checkbox" checked={form.verified} onChange={(e) => set('verified', e.target.checked)} className="size-[1.125rem] accent-forest" /> Verified by the manufacturer
        </label>
        <label className="flex min-h-11 items-center gap-3 font-semibold">
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="size-[1.125rem] accent-forest" /> Published in the store
        </label>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => navigate('/admin/products')} className="inline-flex min-h-12 items-center rounded-lg border border-ink/15 bg-surface px-5 font-semibold">
          Cancel
        </button>
        <button type="submit" disabled={saving} className={buttonClass('primary', 'lg')}>
          {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />} {creating ? 'Create product' : 'Save product'}
        </button>
      </div>
    </form>
  )
}

export default function AdminProductEditPage() {
  const { slug } = useParams()
  const creating = !slug || slug === 'new'
  const [state, reload] = useAuthedRemote(async (t) => (await adminApi.products(t)).products.find((p) => p.slug === slug) ?? null, `admin-product:${slug}`)

  return (
    <>
      <title>{`${creating ? 'New product' : slug} — Admin — VELTO`}</title>
      <AdminHeading title={creating ? 'New product' : 'Edit product'} crumbs={[{ label: 'Products', to: '/admin/products' }, { label: creating ? 'New' : (slug ?? '') }]} />
      {creating ? (
        <ProductForm />
      ) : (
        <RemoteState state={state} reload={reload} skeleton={3}>
          {(product) =>
            product ? (
              <>
                <ProductForm product={product} />
                <CoveragePanel product={product} />
              </>
            ) : (
              <p className="text-muted">Product not found.</p>
            )
          }
        </RemoteState>
      )}
    </>
  )
}
