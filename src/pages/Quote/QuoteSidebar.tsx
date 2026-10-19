import { Link } from 'react-router'
import { ArrowRight, ImageOff, LockKeyhole, MailCheck, Package } from 'lucide-react'
import Img from '../../components/ui/Img.tsx'
import type { CatalogProduct } from '../../data/catalog.ts'
import { productPath } from '../../data/catalog.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'

const steps = [
  { title: 'Send your request', text: 'Share the products, quantities and project details.' },
  { title: 'We review it', text: 'Our team checks product suitability and availability.' },
  { title: 'Receive your quote', text: 'We contact you by email or phone with pricing.' },
]

const assurances = [
  { icon: MailCheck, text: 'No payment needed to request a quote.' },
  { icon: LockKeyhole, text: 'Your details are only used to respond to this request.' },
]

export default function QuoteSidebar({ products }: { products: CatalogProduct[] }) {
  const { categories } = useCatalog()
  return (
    <aside aria-label="Quote summary" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
      <section aria-labelledby="selected-product-title" className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-float)]">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-cream/70 px-5 py-4">
          <h2 id="selected-product-title" className="text-[0.75rem] font-bold tracking-[0.16em] text-ink uppercase">
            {products.length === 1 ? 'Selected product' : `Selected products (${products.length})`}
          </h2>
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-forest-soft text-forest">
            <Package className="size-4" />
          </span>
        </div>
        <div className="p-5">
          {products.length ? (
            <ul className="-my-1 flex max-h-[22rem] flex-col overflow-y-auto">
              {products.map((product) => {
                const category = categories.find((c) => c.slug === product.categorySlug) ?? (product.categoryName ? { name: product.categoryName } : undefined)
                return (
                  <li key={product.slug} className="flex items-center gap-3 border-b border-border/70 py-3 last:border-0">
                    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_35%,var(--color-surface),var(--color-cream)_75%)] p-1 ring-1 ring-border ring-inset">
                      {product.image ? (
                        <Img image={product.image} alt="" className="max-h-full w-auto object-contain" />
                      ) : (
                        <ImageOff aria-hidden="true" className="size-5 text-muted/70" />
                      )}
                    </div>
                    <div className="min-w-0">
                      {category && <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-copper uppercase">{category.name}</p>}
                      <Link to={productPath(product)} className="font-semibold text-ink transition-colors hover:text-forest hover:underline">
                        {product.name}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-[0.9375rem] text-muted">No products selected. Add products in the form, or describe what you need.</p>
          )}
          <p className="mt-4 rounded-xl bg-canvas px-3.5 py-2.5 text-[0.8125rem] text-muted">Pricing and availability are confirmed in your quote.</p>
        </div>
      </section>

      <section aria-labelledby="process-title" className="relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep p-6 text-white">
        <h2 id="process-title" className="font-display text-[1.5rem] leading-tight">
          What happens next
        </h2>
        <ol className="relative mt-5 flex flex-col gap-5">
          <span aria-hidden="true" className="absolute top-4 bottom-4 left-4 w-px bg-white/15" />
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-3.5">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-deep text-[0.8125rem] font-bold text-gold ring-1 ring-gold/50">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{step.title}</span>
                <span className="block text-[0.875rem] text-white/75">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <ul className="mt-6 flex flex-col gap-2.5 border-t border-white/12 pt-5">
          {assurances.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5 text-[0.8125rem] text-white/80">
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
              {text}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="unsure-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
        <h2 id="unsure-title" className="font-display text-[1.1875rem] text-ink">
          Not sure what you need?
        </h2>
        <p className="mt-1 text-[0.875rem] text-muted">Describe the surface and the job in the project details — we will suggest suitable products.</p>
        <div className="mt-2 flex flex-wrap gap-x-5">
          <Link to="/products" className="group inline-flex min-h-11 items-center gap-1.5 text-[0.875rem] font-semibold text-forest hover:underline">
            Browse products <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link to="/resources" className="group inline-flex min-h-11 items-center gap-1.5 text-[0.875rem] font-semibold text-forest hover:underline">
            Technical resources <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </aside>
  )
}
