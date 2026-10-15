import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Search, X, Package } from 'lucide-react'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import Img from '../ui/Img.tsx'

function Highlight({ title, query }: { title: string; query: string }) {
  const index = title.toLocaleLowerCase().indexOf(query.toLocaleLowerCase())
  if (!query || index < 0) return title
  return <>{title.slice(0, index)}<mark className="rounded bg-gold/30 text-ink">{title.slice(index, index + query.length)}</mark>{title.slice(index + query.length)}</>
}

export default function ProductSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const { products } = useCatalog()
  const navigate = useNavigate()
  const term = query.trim().slice(0, 80)
  const matches = products.filter(p => !term || `${p.name} ${p.usage}`.toLowerCase().includes(term.toLowerCase())).slice(0, 6)
  useEffect(() => {
    const dialog = ref.current
    if (open && dialog && !dialog.open) { dialog.showModal(); input.current?.focus() }
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return <dialog ref={ref} aria-labelledby="product-search-title" onClose={onClose} onClick={e => { if (e.target === e.currentTarget) onClose() }} className="m-auto max-h-[85dvh] w-[min(92vw,40rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-ink shadow-xl backdrop:bg-ink/60">
    <div className="flex items-center justify-between gap-4"><h2 id="product-search-title" className="font-display text-2xl">Search products</h2><button type="button" onClick={onClose} aria-label="Close search" className="grid size-11 place-items-center rounded-full hover:bg-sand"><X aria-hidden="true" /></button></div>
    <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); navigate(`/products?q=${encodeURIComponent(term)}`); onClose() }}>
      <label htmlFor="product-search-input" className="sr-only">Product name or job</label><input ref={input} id="product-search-input" type="search" maxLength={80} value={query} onChange={e => setQuery(e.target.value)} placeholder="Try tile adhesive or waterproofing" className="min-h-12 min-w-0 flex-1 rounded-xl border border-border px-4" />
      <button type="submit" aria-label="See all search results" className="grid size-12 shrink-0 place-items-center rounded-xl bg-forest text-white"><Search aria-hidden="true" /></button>
    </form>
    <p role="status" className="mt-5 text-sm text-muted">{term ? `${matches.length} suggestions` : 'Suggested products'}</p>
    <ul className="mt-2 divide-y divide-border">{matches.map(p => <li key={p.slug}><Link onClick={onClose} to={`/products/${p.slug}`} className="flex min-h-20 items-center gap-4 rounded-xl p-3 hover:bg-sand focus-visible:bg-sand"><span className="grid size-14 shrink-0 place-items-center rounded-lg bg-canvas">{p.image ? <Img image={p.image} className="size-full object-contain mix-blend-multiply" /> : <Package aria-hidden="true" />}</span><span className="min-w-0"><span className="block font-semibold"><Highlight title={p.name} query={term} /></span><span className="block truncate text-sm text-muted">{p.usage}</span></span></Link></li>)}</ul>
    {!matches.length && <p className="py-6 text-muted">No matching products. Try a shorter name, or browse all products.</p>}
    <Link to={`/products?q=${encodeURIComponent(term)}`} onClick={onClose} className="mt-3 inline-flex min-h-11 items-center font-semibold text-forest underline">View all results</Link>
  </dialog>
}
