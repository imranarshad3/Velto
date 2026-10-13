import { useId, useState } from 'react'
import { Info, Plus, Trash } from 'lucide-react'
import { inputClass } from '../../components/ui/form/Field.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'

type Unit = 'kg' | 'L'
interface AreaRow {
  id: number
  length: string
  width: string
}

const num = (v: string) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
const fmt = (n: number, digits = 2) => n.toLocaleString(undefined, { maximumFractionDigits: digits })

/** Arithmetic only: consumption and pack size come from the user (product data sheet), never from us. */
export default function CalculatorPage() {
  const idBase = useId()
  const [rows, setRows] = useState<AreaRow[]>([{ id: 1, length: '', width: '' }])
  const [waste, setWaste] = useState('10')
  const [rate, setRate] = useState('')
  const [unit, setUnit] = useState<Unit>('kg')
  const [coats, setCoats] = useState('1')
  const [pack, setPack] = useState('')

  const area = rows.reduce((sum, r) => sum + num(r.length) * num(r.width), 0)
  const wastePct = Math.min(Math.max(Number(waste) || 0, 0), 100)
  const areaWithWaste = area * (1 + wastePct / 100)
  const material = areaWithWaste * num(rate) * Math.max(Math.floor(num(coats)), 1)
  const packs = num(pack) > 0 && material > 0 ? Math.ceil(material / num(pack)) : null

  const update = (id: number, patch: Partial<AreaRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const field = (suffix: string) => `${idBase}-${suffix}`
  const label = 'text-[0.875rem] font-semibold text-ink'

  return (
    <>
      <title>Coverage Calculator — NOVARO</title>
      <PageHeader
        eyebrow="Resources"
        title="Coverage calculator"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources', to: '/resources' }, { label: 'Coverage Calculator' }]}
        description="Estimate how much material and how many packs you need. Enter the consumption and pack size from the product’s technical data sheet."
      />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-[clamp(2rem,4vw,3.5rem)] pb-[var(--section-gap)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8 rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(1.25rem,4vw,2.5rem)]">
          <fieldset className="min-w-0">
            <legend className="font-display text-[1.375rem]">1. Areas</legend>
            <p className="mt-1 text-[0.875rem] text-muted">Add each surface as length × width in metres.</p>
            <ul className="mt-4 flex flex-col gap-3">
              {rows.map((r, i) => (
                <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={field(`l${r.id}`)} className={label}>
                      Area {i + 1} length (m)
                    </label>
                    <input id={field(`l${r.id}`)} type="number" min="0" step="any" inputMode="decimal" value={r.length} onChange={(e) => update(r.id, { length: e.target.value })} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={field(`w${r.id}`)} className={label}>
                      Width (m)
                    </label>
                    <input id={field(`w${r.id}`)} type="number" min="0" step="any" inputMode="decimal" value={r.width} onChange={(e) => update(r.id, { width: e.target.value })} className={inputClass} />
                  </div>
                  <button type="button" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} aria-label={`Remove area ${i + 1}`} className="grid size-12 place-items-center rounded-lg text-muted hover:bg-sand hover:text-danger disabled:opacity-30">
                    <Trash aria-hidden="true" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setRows((rs) => [...rs, { id: Math.max(...rs.map((r) => r.id)) + 1, length: '', width: '' }])} disabled={rows.length >= 20} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-forest/50 px-4 text-[0.875rem] font-semibold text-forest hover:bg-forest-soft">
              <Plus aria-hidden="true" className="size-4" /> Add another area
            </button>
            <div className="mt-4 flex max-w-[16rem] flex-col gap-1.5">
              <label htmlFor={field('waste')} className={label}>
                Allowance for cutting and waste (%)
              </label>
              <input id={field('waste')} type="number" min="0" max="100" step="1" inputMode="numeric" value={waste} onChange={(e) => setWaste(e.target.value)} className={inputClass} />
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="font-display text-[1.375rem]">2. From the data sheet</legend>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={field('rate')} className={label}>
                  Consumption per m² per coat
                </label>
                <div className="flex gap-2">
                  <input id={field('rate')} type="number" min="0" step="any" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className={`${inputClass} min-w-0`} />
                  <label htmlFor={field('unit')} className="sr-only">
                    Unit
                  </label>
                  <select id={field('unit')} value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className={`${inputClass} max-w-[6rem] shrink-0`}>
                    <option value="kg">kg</option>
                    <option value="L">litres</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={field('coats')} className={label}>
                  Number of coats / layers
                </label>
                <input id={field('coats')} type="number" min="1" step="1" inputMode="numeric" value={coats} onChange={(e) => setCoats(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={field('pack')} className={label}>
                  Pack size ({unit === 'kg' ? 'kg' : 'litres'})
                </label>
                <input id={field('pack')} type="number" min="0" step="any" inputMode="decimal" value={pack} onChange={(e) => setPack(e.target.value)} className={inputClass} />
              </div>
            </div>
          </fieldset>
        </form>

        <aside aria-labelledby="result-title" className="rounded-[var(--radius-card)] bg-forest p-6 text-white lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
          <h2 id="result-title" className="font-display text-[1.5rem]">
            Estimate
          </h2>
          <dl aria-live="polite" className="mt-4 flex flex-col gap-3">
            {[
              ['Total area', `${fmt(area)} m²`],
              ['Area incl. allowance', `${fmt(areaWithWaste)} m²`],
              ['Material needed', num(rate) ? `${fmt(material)} ${unit === 'kg' ? 'kg' : 'litres'}` : 'Enter consumption'],
              ['Packs needed', packs !== null ? String(packs) : 'Enter pack size'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/15 pb-2">
                <dt className="text-white/75">{k}</dt>
                <dd className="text-right font-display text-[1.375rem]">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex gap-2 text-[0.8125rem] text-white/75">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> An estimate only. Actual consumption depends on the substrate, method and conditions.
          </p>
          <ButtonLink to="/quote" variant="secondary" className="mt-5 w-full border-transparent bg-white text-ink">
            Request a quote
          </ButtonLink>
        </aside>
      </div>
    </>
  )
}
