import { Link } from 'react-router'
import { ImageOff } from 'lucide-react'
import Img from '../../components/ui/Img.tsx'
import type { CatalogProduct } from '../../data/catalog.ts'
import { productPath } from '../../data/catalog.ts'
import { demoCategories } from '../../data/demoCategories.ts'

const steps = [
  { title: 'Send your request', text: 'Share the products, quantities and project details.' },
  { title: 'We review it', text: 'Our team checks product suitability and availability.' },
  { title: 'Receive your quote', text: 'We contact you by email or phone with pricing.' },
]

export default function QuoteSidebar({ products }: { products: CatalogProduct[] }) {

  return (
    <aside aria-label="Quote summary" className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
      <section aria-labelledby="selected-product-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 id="selected-product-title" className="text-[0.75rem] font-semibold tracking-[0.14em] text-muted uppercase">
          {products.length === 1 ? 'Selected product' : `Selected products (${products.length})`}
        </h2>
        {products.length ? (
          <ul className="mt-3 flex max-h-[22rem] flex-col gap-3 overflow-y-auto">
            {products.map((product) => {
              const category = demoCategories.find((c) => c.slug === product.categorySlug)
              return (
                <li key={product.slug} className="flex items-center gap-3">
                  <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white p-1">
                    {product.image ? (
                      <Img image={product.image} alt="" className="max-h-full w-auto object-contain" />
                    ) : (
                      <ImageOff aria-hidden="true" className="size-5 text-muted" />
                    )}
                  </div>
                  <div className="min-w-0">
                    {category && <p className="text-[0.75rem] font-semibold text-copper">{category.name}</p>}
                    <Link to={productPath(product)} className="font-bold text-ink hover:text-forest hover:underline">
                      {product.name}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-2 text-[0.9375rem] text-muted">No products selected. Add products in the form, or describe what you need.</p>
        )}
        <p className="mt-3 border-t border-border pt-3 text-[0.8125rem] text-muted">Pricing and availability are confirmed in your quote.</p>
      </section>

      <section aria-labelledby="process-title" className="rounded-[var(--radius-card)] bg-forest p-5 text-white">
        <h2 id="process-title" className="font-display text-[1.375rem]">
          What happens next
        </h2>
        <ol className="mt-4 flex flex-col gap-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-[0.875rem] font-bold text-[#e3c58f]">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{step.title}</span>
                <span className="block text-[0.875rem] text-white/75">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="unsure-title" className="rounded-[var(--radius-card)] border border-border bg-sand/60 p-5">
        <h2 id="unsure-title" className="font-bold text-ink">
          Not sure what you need?
        </h2>
        <p className="mt-1 text-[0.875rem] text-muted">Describe the surface and the job in the project details — we will suggest suitable products.</p>
        <div className="mt-2 flex flex-wrap gap-x-4">
          <Link to="/products" className="inline-flex min-h-11 items-center text-[0.875rem] font-semibold text-forest hover:underline">
            Browse products
          </Link>
          <Link to="/resources" className="inline-flex min-h-11 items-center text-[0.875rem] font-semibold text-forest hover:underline">
            Technical resources
          </Link>
        </div>
      </section>
    </aside>
  )
}
