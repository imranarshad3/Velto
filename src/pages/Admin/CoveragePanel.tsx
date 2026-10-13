import { useState, type FormEvent } from 'react'
import { Calculator, Trash2 } from 'lucide-react'
import { buttonClass } from '../../components/ui/button.ts'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import { adminApi } from '../../features/admin/api.ts'
import type { AdminProduct } from '../../features/admin/types.ts'
import { QuoteApiError } from '../../features/quotes/api.ts'
import { coverageUnits, packContainers, type ProductCoverage, type TechnicalResource } from '../../features/resources/types.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import { Panel } from './ui.tsx'

type Form = { rate: string; rateUnit: ProductCoverage['rateUnit']; coats: string; packAmount: string; packContainer: ProductCoverage['packContainer']; sourceResourceId: string; note: string }
const toForm = (c?: ProductCoverage): Form => ({
  rate: c ? String(c.rate) : '',
  rateUnit: c?.rateUnit ?? 'kg',
  coats: String(c?.coats ?? 1),
  packAmount: c ? String(c.packAmount) : '',
  packContainer: c?.packContainer ?? 'bags',
  sourceResourceId: c?.sourceResourceId ?? '',
  note: c?.note ?? '',
})

function CoverageForm({ product, coverage, resources, onChange }: { product: AdminProduct; coverage?: ProductCoverage; resources: TechnicalResource[]; onChange: () => void }) {
  const { getToken } = useAppAuth()
  const show = useToasts((s) => s.show)
  const [form, setForm] = useState<Form>(() => toForm(coverage))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }
  const linked = resources.filter((r) => r.productSlugs.includes(product.slug))
  const sources = linked.length ? linked : resources

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true)
    try {
      await action()
      show(done)
      onChange()
    } catch (error) {
      if (error instanceof QuoteApiError && error.fieldErrors) setErrors(error.fieldErrors)
      else show(error instanceof QuoteApiError ? error.message : 'Coverage could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const t = await getToken()
      if (!t) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
      await adminApi.saveCoverage(t, product.slug, {
        rate: Number(form.rate),
        rateUnit: form.rateUnit,
        coats: Number(form.coats) || 1,
        packAmount: Number(form.packAmount),
        packContainer: form.packContainer,
        sourceResourceId: form.sourceResourceId || null,
        note: form.note,
      })
    }, 'Coverage data saved.')
  }

  const remove = () =>
    void run(async () => {
      const t = await getToken()
      if (!t) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
      await adminApi.deleteCoverage(t, product.slug)
      setForm(toForm())
    }, 'Coverage data removed.')

  const unit = form.rateUnit === 'kg' ? 'kg' : 'litres'
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {!product.verified && (
        <p className="rounded-xl border border-copper/25 bg-copper-soft/60 px-4 py-3 text-[0.875rem] text-copper-hover">
          This product is not verified, so its coverage stays private. Customers see it in the calculator only after you mark the product verified.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cov-rate" label={`Coverage rate (${unit} per m² per coat)`} required error={errors.rate}>
          {(c) => (
            <div className="flex gap-2">
              <input {...c} type="number" min="0" step="any" inputMode="decimal" value={form.rate} onChange={(e) => set('rate', e.target.value)} className={`${inputClass} min-w-0`} />
              <label htmlFor="cov-unit" className="sr-only">
                Unit
              </label>
              <select id="cov-unit" value={form.rateUnit} onChange={(e) => set('rateUnit', e.target.value as Form['rateUnit'])} className={`${inputClass} max-w-[6.5rem] shrink-0 cursor-pointer`}>
                {coverageUnits.map((u) => (
                  <option key={u} value={u}>
                    {u === 'kg' ? 'kg' : 'litres'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Field>
        <Field id="cov-coats" label="Recommended coats / layers" required error={errors.coats}>
          {(c) => <input {...c} type="number" min="1" max="10" step="1" inputMode="numeric" value={form.coats} onChange={(e) => set('coats', e.target.value)} className={inputClass} />}
        </Field>
        <Field id="cov-pack" label={`Pack size (${unit})`} required error={errors.packAmount}>
          {(c) => <input {...c} type="number" min="0" step="any" inputMode="decimal" value={form.packAmount} onChange={(e) => set('packAmount', e.target.value)} className={inputClass} />}
        </Field>
        <Field id="cov-container" label="Sold in" required error={errors.packContainer}>
          {(c) => (
            <select {...c} value={form.packContainer} onChange={(e) => set('packContainer', e.target.value as Form['packContainer'])} className={`${inputClass} cursor-pointer`}>
              {packContainers.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="cov-source" label="Source document" error={errors.sourceResourceId} hint="The data sheet these values come from." className="sm:col-span-2">
          {(c) => (
            <select {...c} value={form.sourceResourceId} onChange={(e) => set('sourceResourceId', e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">No document linked</option>
              {sources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                  {r.published ? '' : ' (draft)'}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="cov-note" label="Note for customers" error={errors.note} hint="E.g. substrate or trowel conditions the rate assumes." className="sm:col-span-2">
          {(c) => <input {...c} value={form.note} maxLength={300} onChange={(e) => set('note', e.target.value)} className={inputClass} />}
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {coverage && (
          <button type="button" onClick={remove} disabled={busy} className={buttonClass('danger', 'md', 'disabled:opacity-60')}>
            <Trash2 aria-hidden="true" className="size-4" /> Remove
          </button>
        )}
        <button type="submit" disabled={busy} className={buttonClass('primary', 'md', 'disabled:opacity-60')}>
          {busy ? 'Saving…' : 'Save coverage'}
        </button>
      </div>
    </form>
  )
}

/** Manufacturer coverage used by the public calculator. Enter values exactly as the data sheet states them. */
export default function CoveragePanel({ product }: { product: AdminProduct }) {
  const [state, reload] = useAuthedRemote(async (t) => {
    const [{ coverage }, { resources }] = await Promise.all([adminApi.coverage(t), adminApi.resources(t)])
    return { coverage: coverage.find((c) => c.productSlug === product.slug), resources }
  }, `coverage:${product.slug}`)
  return (
    <Panel id="coverage-title" title={<span className="inline-flex items-center gap-2"><Calculator aria-hidden="true" className="size-[1.125rem] text-forest" /> Coverage calculator data</span>} description="From the manufacturer’s technical data sheet. Never estimate these values." className="mt-[clamp(1.25rem,2.5vw,1.75rem)]">
      {state.kind === 'loading' && <p className="text-muted">Loading…</p>}
      {state.kind === 'error' && (
        <p className="text-muted">
          Coverage data couldn’t be loaded ({state.message}).{' '}
          <button type="button" onClick={reload} className="font-semibold text-forest hover:underline">
            Retry
          </button>
        </p>
      )}
      {state.kind === 'ready' && <CoverageForm key={state.data.coverage?.updatedAt ?? 'new'} product={product} coverage={state.data.coverage} resources={state.data.resources} onChange={reload} />}
    </Panel>
  )
}
