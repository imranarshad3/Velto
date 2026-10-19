import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { inputClass } from '../../components/ui/form/Field.tsx'

const links = [
  { to: '/products#product-results', label: 'Products' },
  { to: '/applications', label: 'Applications' },
  { to: '/resources', label: 'Resources' },
  { to: '/contact', label: 'Contact' },
]

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}#product-results` : '/products#product-results')
  }

  return (
    <section aria-labelledby="not-found-title" className="relative isolate grid min-h-[64dvh] place-items-center overflow-hidden bg-cream px-[var(--page-gutter)] py-[var(--section-gap)] text-center">
      <title>Page not found — VELTO</title>
      <meta name="robots" content="noindex" />
      <div className="max-w-[36rem]">
        <p className="font-display text-[clamp(6rem,4rem+9vw,11rem)] leading-none tracking-[-0.03em] text-transparent [-webkit-text-stroke:1px_var(--color-copper)]">404</p>
        <h1 id="not-found-title" className="mt-2 font-display text-[clamp(1.75rem,1.4rem+1.5vw,2.5rem)]">
          This page doesn’t exist
        </h1>
        <p className="mt-3 text-muted">This link may be old, or the page may have moved. Search for a product instead.</p>
        <form role="search" onSubmit={onSearch} className="mx-auto mt-6 flex max-w-[28rem] gap-2">
          <label htmlFor="notfound-search" className="sr-only">
            Search products
          </label>
          <input id="notfound-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className={inputClass} />
          <button type="submit" className="grid size-12 shrink-0 place-items-center rounded-xl bg-forest text-white shadow-[var(--shadow-button)] transition-colors hover:bg-forest-dark" aria-label="Search">
            <Search aria-hidden="true" className="size-5" />
          </button>
        </form>
        <nav aria-label="Popular pages" className="mt-6">
          <ul className="flex flex-wrap justify-center gap-2">
            {links.map((l) => (
              <li key={l.to}>
                <ButtonLink to={l.to} variant="secondary">
                  {l.label}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink to="/" variant="ghost" className="mt-4">
          Back to home
        </ButtonLink>
      </div>
    </section>
  )
}
