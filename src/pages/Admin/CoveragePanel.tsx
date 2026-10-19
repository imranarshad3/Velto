import { useState, type FormEvent } from 'react'
import { Calculator, FileText, Info, Trash2 } from 'lucide-react'
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
      <div className="rounded-xl border border-forest/10 bg-forest-soft/35 p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-forest shadow-[var(--shadow-soft)]"><Calculator aria-hidden="true" className="size-4" /></span>
          <div>
            <h3 className="font-semibold text-ink">1. Add the coverage from the product sheet</h3>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">Use the exact figures from the manufacturer. Don’t guess. The same unit is used for the rate and pack size.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cov-rate" label="Amount needed for 1 m² and 1 coat" required error={errors.rate} hint={`Example: 1.5 ${unit} for each m², for each coat.`}>
          {(c) => (
            <div className="flex gap-2">
              <input {...c} type="number" min="0" step="any" inputMode="decimal" placeholder="e.g. 1.5" value={form.rate} onChange={(e) => set('rate', e.target.value)} className={`${inputClass} min-w-0`} />
              <label htmlFor="cov-unit" className="sr-only">
                Unit used for the rate and pack size
              </label>
              <select id="cov-unit" aria-label="Unit used for the rate and pack size" value={form.rateUnit} onChange={(e) => set('rateUnit', e.target.value as Form['rateUnit'])} className={`${inputClass} max-w-[7.5rem] shrink-0 cursor-pointer`}>
                {coverageUnits.map((u) => (
                  <option key={u} value={u}>
                    {u === 'kg' ? 'kg' : 'litres (L)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Field>
        <Field id="cov-coats" label="Number of coats" required error={errors.coats} hint="Use the number shown on the product instructions.">
          {(c) => <input {...c} type="number" min="1" max="10" step="1" inputMode="numeric" placeholder="e.g. 2" value={form.coats} onChange={(e) => set('coats', e.target.value)} className={inputClass} />}
        </Field>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-canvas/70 p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-forest shadow-[var(--shadow-soft)]"><Info aria-hidden="true" className="size-4" /></span>
          <div>
            <h3 className="font-semibold text-ink">2. Add the pack size</h3>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">Check the amount printed on one pack and how it is sold.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cov-pack" label={`Amount in one pack (${unit})`} required error={errors.packAmount} hint={`Use the same unit as the coverage rate (${unit}).`}>
          {(c) => <input {...c} type="number" min="0" step="any" inputMode="decimal" placeholder={unit === 'kg' ? 'e.g. 20' : 'e.g. 5'} value={form.packAmount} onChange={(e) => set('packAmount', e.target.value)} className={inputClass} />}
        </Field>
        <Field id="cov-container" label="Pack type" required error={errors.packContainer} hint="Choose how the customer buys it.">
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
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forest-soft text-forest"><FileText aria-hidden="true" className="size-4" /></span>
          <div>
            <h3 className="font-semibold text-ink">3. Link the source (optional)</h3>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">Linking the manufacturer’s sheet helps your team check these figures later.</p>
          </div>
        </div>
        <div className="grid gap-4">
        <Field id="cov-source" label="Product data sheet" error={errors.sourceResourceId} hint={sources.length ? 'Select the document used for these figures, if available.' : 'No documents yet. Add one under Management → Resources to link it here.'}>
          {(c) => (
            <select {...c} disabled={!sources.length} value={form.sourceResourceId} onChange={(e) => set('sourceResourceId', e.target.value)} className={`${inputClass} cursor-pointer disabled:cursor-not-allowed disabled:bg-sand/50 disabled:text-muted`}>
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
        <Field id="cov-note" label="Important usage note" error={errors.note} hint="Optional. Add a key instruction from the product sheet, such as surface preparation." className="sm:col-span-2">
          {(c) => <input {...c} placeholder="e.g. Apply to a clean, dry surface" value={form.note} maxLength={300} onChange={(e) => set('note', e.target.value)} className={inputClass} />}
        </Field>
      </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {coverage && (
          <button type="button" onClick={remove} disabled={busy} className={buttonClass('danger', 'md', 'disabled:opacity-60')}>
            <Trash2 aria-hidden="true" className="size-4" /> Remove
          </button>
        )}
        <button type="submit" disabled={busy} className={buttonClass('primary', 'md', 'disabled:opacity-60')}>
          {busy ? 'Saving…' : 'Save coverage data'}
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
