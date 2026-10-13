import { useId, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BadgeCheck, Download, Info, Plus, ShoppingBasket, Trash } from 'lucide-react'
import { buttonClass } from '../../components/ui/button.ts'
import { useCart } from '../../features/cart/cartStore.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { resourceDownloadPath } from '../../features/resources/types.ts'
import { useResources } from '../../features/resources/useResources.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
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

/**
 * Arithmetic only. Consumption and pack size come either from verified manufacturer data (products with coverage
 * entered by staff from the data sheet) or from the user's own data sheet; nothing is assumed.
 */
export default function CalculatorPage() {
  const idBase = useId()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { find } = useCatalog()
  const [resources] = useResources()
  const addToCart = useCart((s) => s.add)
  const updateCart = useCart((s) => s.update)
  const show = useToasts((s) => s.show)
  const coverageList = resources.kind === 'ready' ? resources.data.coverage.filter((c) => find(c.productSlug)) : []
  const selected = coverageList.find((c) => c.productSlug === params.get('product')) ?? null
  const selectedProduct = selected ? find(selected.productSlug) : undefined
  const source = selected?.sourceResourceId && resources.kind === 'ready' ? resources.data.resources.find((r) => r.id === selected.sourceResourceId) : undefined
  const [rows, setRows] = useState<AreaRow[]>([{ id: 1, length: '', width: '' }])
  const [waste, setWaste] = useState('10')
  const [rate, setRate] = useState('')
  const [unit, setUnit] = useState<Unit>('kg')
  const [coats, setCoats] = useState('1')
  const [pack, setPack] = useState('')

  const chooseProduct = (slug: string) => {
    setParams((p) => {
      if (slug) p.set('product', slug)
      else p.delete('product')
      return p
    }, { replace: true })
    const c = coverageList.find((x) => x.productSlug === slug)
    if (c) setCoats(String(c.coats))
  }
  const effRate = selected ? String(selected.rate) : rate
  const effUnit: Unit = selected ? selected.rateUnit : unit
  const effPack = selected ? String(selected.packAmount) : pack

  const area = rows.reduce((sum, r) => sum + num(r.length) * num(r.width), 0)
  const wastePct = Math.min(Math.max(Number(waste) || 0, 0), 100)
  const areaWithWaste = area * (1 + wastePct / 100)
  const material = areaWithWaste * num(effRate) * Math.max(Math.floor(num(coats)), 1)
  const packs = num(effPack) > 0 && material > 0 ? Math.ceil(material / num(effPack)) : null

  const addToQuote = () => {
    if (!selected || !packs) return
    const result = addToCart(selected.productSlug)
    if (result === 'full') {
      show('Your quote basket is full. Remove an item and try again.')
      return
    }
    updateCart(selected.productSlug, { quantity: packs, unit: selected.packContainer })
    navigate('/quote?source=cart')
  }

  const update = (id: number, patch: Partial<AreaRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const field = (suffix: string) => `${idBase}-${suffix}`
  const label = 'text-[0.875rem] font-semibold text-ink'

  return (
    <>
      <title>Coverage Calculator — VELTO</title>
      <PageHeader
        eyebrow="Resources"
        title="Coverage calculator"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources', to: '/resources' }, { label: 'Coverage Calculator' }]}
        description="Estimate how much material and how many packs you need, using verified manufacturer coverage data or the values from your product’s technical data sheet."
      />
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-[var(--content-pad)] pb-[var(--section-gap)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8 surface-card p-[clamp(1.25rem,4vw,2.5rem)]">
          <fieldset className="min-w-0">
            <legend className="font-display text-[1.375rem]">1. Product</legend>
            <p className="mt-1 text-[0.875rem] text-muted">Choose a product with verified manufacturer coverage, or enter values from your own data sheet.</p>
            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor={field('product')} className={label}>
                Product
              </label>
              <select id={field('product')} value={selected?.productSlug ?? ''} onChange={(e) => chooseProduct(e.target.value)} disabled={resources.kind !== 'ready'} className={`${inputClass} max-w-[32rem] cursor-pointer`}>
                <option value="">{resources.kind === 'loading' ? 'Loading products…' : 'Enter my own data sheet values'}</option>
                {coverageList.map((c) => (
                  <option key={c.productSlug} value={c.productSlug}>
                    {find(c.productSlug)?.name}
                  </option>
                ))}
              </select>
              {resources.kind === 'ready' && coverageList.length === 0 && (
                <p className="text-[0.8125rem] text-muted">No products have verified coverage data yet. Enter the values from the product’s technical data sheet below.</p>
              )}
              {resources.kind === 'error' && <p className="text-[0.8125rem] text-muted">Product data couldn’t be loaded. You can still enter values from the data sheet below.</p>}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="font-display text-[1.375rem]">2. Areas</legend>
            <p className="mt-1 text-[0.875rem] text-muted">Add each surface as length × width in metres.</p>
            <ul className="mt-4 flex flex-col gap-3">
              {rows.map((r, i) => (
                <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-[var(--grid-gap)]">
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
            <legend className="font-display text-[1.375rem]">3. From the data sheet</legend>
            {selected && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-forest/15 bg-forest-soft/60 px-4 py-3 text-[0.875rem]">
                <span className="inline-flex items-center gap-2 font-semibold text-forest">
                  <BadgeCheck aria-hidden="true" className="size-4" /> Manufacturer data for {selectedProduct?.name}
                </span>
                {source && (
                  <a href={resourceDownloadPath(source.id)} download className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-forest hover:underline">
                    <Download aria-hidden="true" className="size-4" /> {source.title}
                  </a>
                )}
                {selected.note && <span className="basis-full text-muted">{selected.note}</span>}
              </div>
            )}
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={field('rate')} className={label}>
                  Consumption per m² per coat
                </label>
                <div className="flex gap-2">
                  <input id={field('rate')} type="number" min="0" step="any" inputMode="decimal" value={effRate} readOnly={Boolean(selected)} onChange={(e) => setRate(e.target.value)} className={`${inputClass} min-w-0 read-only:bg-sand/60`} />
                  <label htmlFor={field('unit')} className="sr-only">
                    Unit
                  </label>
                  <select id={field('unit')} value={effUnit} disabled={Boolean(selected)} onChange={(e) => setUnit(e.target.value as Unit)} className={`${inputClass} max-w-[6rem] shrink-0 disabled:bg-sand/60`}>
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
                  Pack size ({effUnit === 'kg' ? 'kg' : 'litres'}){selected ? ` per ${selected.packContainer === 'units' ? 'unit' : selected.packContainer.slice(0, -1)}` : ''}
                </label>
                <input id={field('pack')} type="number" min="0" step="any" inputMode="decimal" value={effPack} readOnly={Boolean(selected)} onChange={(e) => setPack(e.target.value)} className={`${inputClass} read-only:bg-sand/60`} />
              </div>
            </div>
          </fieldset>
        </form>

        <aside aria-labelledby="result-title" className="rounded-[var(--radius-card)] bg-forest p-6 text-white lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
          <h2 id="result-title" className="font-display text-[1.5rem]">
            Estimate
          </h2>
          <dl aria-live="polite" className="mt-4 flex flex-col gap-3">
            {(
              [
                ['Total area', `${fmt(area)} m²`, false],
                ['Area incl. allowance', `${fmt(areaWithWaste)} m²`, false],
                ['Material needed', num(effRate) ? `${fmt(material)} ${effUnit === 'kg' ? 'kg' : 'litres'}` : 'Enter consumption', !num(effRate)],
                ['Packs needed', packs !== null ? `${packs}${selected ? ` ${packs === 1 ? selected.packContainer.replace(/s$/, '') : selected.packContainer}` : ''}` : area ? 'Enter pack size' : 'Enter an area', packs === null],
              ] as const
            ).map(([k, v, pending]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/15 pb-2.5">
                <dt className="text-white/75">{k}</dt>
                {/* Prompts are styled as hints so they never read as results. */}
                <dd className={pending ? 'text-right text-[0.8125rem] text-white/55 italic' : 'text-right font-display text-[1.5rem] whitespace-nowrap tabular-nums'}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex gap-2 text-[0.8125rem] text-white/75">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> An estimate only. Actual consumption depends on the substrate, method and conditions.
          </p>
          {selected && packs ? (
            <button type="button" onClick={addToQuote} className={buttonClass('light', 'md', 'mt-5 w-full')}>
              <ShoppingBasket aria-hidden="true" className="size-4" /> Request {packs} {packs === 1 ? selected.packContainer.replace(/s$/, '') : selected.packContainer} in a quote
            </button>
          ) : (
            <ButtonLink to={selected ? `/quote?product=${selected.productSlug}` : '/quote'} variant="light" className="mt-5 w-full">
              Request a quote
            </ButtonLink>
          )}
        </aside>
      </div>
    </>
  )
}
