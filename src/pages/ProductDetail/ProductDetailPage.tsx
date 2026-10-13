import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, ClipboardList, FileText, PackageX, Share2 } from 'lucide-react'
import AddToCartButton from '../../components/commerce/AddToCartButton.tsx'
import ApplicationTile from '../../components/commerce/ApplicationTile.tsx'
import WishlistButton from '../../components/commerce/WishlistButton.tsx'
import HelpBanner from '../../components/commerce/HelpBanner.tsx'
import ProductCard from '../../components/commerce/ProductCard.tsx'
import Breadcrumb from '../../components/ui/Breadcrumb.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import DemoNotice from '../../components/ui/DemoNotice.tsx'
import SectionHeading from '../../components/ui/SectionHeading.tsx'
import type { CatalogProduct } from '../../data/catalog.ts'
import { areaLabels } from '../../data/catalog.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { displayPrice } from '../../features/catalog/price.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { applications } from '../../data/homeContent.ts'
import ProductGallery, { type GallerySlide } from './ProductGallery.tsx'

const RELATED_LIMIT = 4

/** Same category first, then products sharing an application. */
function relatedProducts(product: CatalogProduct, catalog: CatalogProduct[]): CatalogProduct[] {
  const score = (p: CatalogProduct) =>
    (p.categorySlug === product.categorySlug ? 10 : 0) + p.applications.filter((a) => product.applications.includes(a)).length
  return catalog
    .filter((p) => p.id !== product.id)
    .map((p) => ({ p, s: score(p) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, RELATED_LIMIT)
    .map(({ p }) => p)
}

function ShareButton({ name }: { name: string }) {
  const [status, setStatus] = useState('')

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} — NOVARO`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setStatus('Link copied')
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') setStatus('Could not share. Copy the address bar link instead.')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[0.875rem] font-semibold text-ink hover:text-forest">
        <Share2 aria-hidden="true" className="size-4" /> Share product
      </button>
      <span role="status" className="text-[0.8125rem] text-muted">
        {status}
      </span>
    </div>
  )
}

function NotFound() {
  return (
    <section aria-labelledby="not-found-title" className="container-page py-[var(--section-gap)]">
      <title>Product not found — NOVARO</title>
      <meta name="robots" content="noindex" />
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }, { label: 'Not found' }]} />
      <div className="mt-6 flex max-w-[36rem] flex-col items-start">
        <PackageX aria-hidden="true" className="size-12 text-muted" />
        <h1 id="not-found-title" className="mt-4 font-display text-[length:var(--h2)] leading-tight">
          Product not found
        </h1>
        <p className="mt-3 text-muted">This product may have moved or is no longer listed. Browse the catalogue to find what you need.</p>
        <ButtonLink to="/products" className="mt-8">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to products
        </ButtonLink>
      </div>
    </section>
  )
}

const sectionClass = 'scroll-mt-[calc(var(--header-height)+1.5rem)]'
const h2Class = 'font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-tight'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { products, find, status } = useCatalog()
  const product = find(slug)
  const category = demoCategories.find((c) => c.slug === product?.categorySlug)
  const related = useMemo(() => (product ? relatedProducts(product, products) : []), [product, products])

  if (!product && status === 'loading') {
    return <div aria-busy="true" aria-label="Loading product" className="container-page my-8 h-[32rem] animate-pulse rounded-[var(--radius-card)] bg-sand" />
  }
  if (!product) return <NotFound />

  const productApplications = applications.filter((a) => product.applications.includes(a.slug))
  const slides: GallerySlide[] = [
    { key: 'pack', caption: product.image ? 'Illustrative concept packshot' : 'Product image coming soon', image: product.image },
    ...(category?.image
      ? [{ key: 'context', caption: `${category.name}: illustrative application photo`, image: category.image }]
      : []),
  ]
  const hasSpecs = !!product.specifications?.length
  const hasPackaging = !!product.packSizes?.length || !!product.coverage
  const hasDocs = !!product.documents?.length
  const hasFaq = !!product.faq?.length
  const technicalPending = !hasSpecs && !hasPackaging && !hasDocs

  const sections = [
    { id: 'overview', label: 'Overview' },
    productApplications.length > 0 && { id: 'applications', label: 'Applications' },
    hasSpecs && { id: 'specifications', label: 'Specifications' },
    hasPackaging && { id: 'packaging', label: 'Packaging & Coverage' },
    hasDocs && { id: 'downloads', label: 'Downloads' },
    technicalPending && { id: 'technical', label: 'Technical Information' },
    hasFaq && { id: 'faq', label: 'FAQ' },
  ].filter((s): s is { id: string; label: string } => Boolean(s))

  const quoteHref = `/quote?product=${product.slug}`

  return (
    <>
      <title>{`${product.name} — NOVARO`}</title>
      <meta name="description" content={product.description ?? product.usage} />

      <div className="bg-[#f6f1e9]">
        <div className="container-page pt-2 pb-[clamp(2rem,5vw,4rem)]">
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              { label: 'Products', to: '/products' },
              ...(category ? [{ label: category.name, to: `/products?category=${category.slug}` }] : []),
              { label: product.name },
            ]}
          />

          <div className="mt-3 grid gap-[clamp(1.5rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,48fr)_minmax(0,52fr)] lg:items-start">
            <ProductGallery key={product.slug} slides={slides} productName={product.name} />

            <div className="animate-rise flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-sand-deep/80 px-3 text-[0.8125rem] font-semibold text-forest hover:bg-sand-deep"
                  >
                    {category.name}
                  </Link>
                )}
                {!product.verified && (
                  <span className="rounded-full bg-forest px-2.5 py-0.5 text-[0.6875rem] font-bold tracking-[0.08em] text-white">DEMO</span>
                )}
              </div>
              <h1 className="mt-3 font-display text-[clamp(2rem,1.4rem+2.6vw,3.25rem)] leading-[1.05] text-ink">{product.name}</h1>
              <p className="mt-3 text-[clamp(1rem,0.95rem+0.25vw,1.125rem)] text-muted">{product.description ?? product.usage}</p>

              {product.benefits?.length ? (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {product.benefits.map((b) => (
                    <li key={b} className="flex gap-2 text-[0.9375rem]">
                      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-forest" /> {b}
                    </li>
                  ))}
                </ul>
              ) : null}

              <dl className="mt-6 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">Applications</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {productApplications.map((a) => (
                      <Link key={a.slug} to={`/products?application=${a.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-3 text-[0.8125rem] hover:border-forest hover:text-forest">
                        {a.name}
                      </Link>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">Use area</dt>
                  <dd className="mt-1.5 text-[0.9375rem] font-semibold text-ink">{product.areas.map((a) => areaLabels[a]).join(' & ')}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sand text-copper">
                  <ClipboardList aria-hidden="true" className="size-6" />
                </span>
                <div className="flex-1">
                  <p className="font-bold text-ink">{displayPrice(product) ?? 'Pricing on request'}</p>
                  <p className="text-[0.875rem] text-muted">
                    {displayPrice(product) ? 'Request a quote to confirm availability and delivery.' : 'Request a quote for pricing, pack options and availability.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink to={quoteHref} className="px-6">
                    Request Quote <ArrowRight aria-hidden="true" className="size-4" />
                  </ButtonLink>
                  <AddToCartButton slug={product.slug} name={product.name} variant="full" />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4">
                <WishlistButton slug={product.slug} name={product.name} variant="text" />
                <ShareButton name={product.name} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[var(--section-gap)] lg:grid-cols-[14rem_minmax(0,1fr)] xl:gap-14">
        <nav aria-label="Product information" className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
          <h2 className="hidden font-display text-[1.375rem] lg:block">Product Information</h2>
          <ul className="no-scrollbar -mx-[var(--page-gutter)] flex gap-2 overflow-x-auto px-[var(--page-gutter)] lg:mx-0 lg:mt-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-[0.875rem] font-medium whitespace-nowrap hover:border-forest hover:text-forest lg:flex lg:rounded-lg lg:border-transparent lg:bg-transparent lg:px-3 lg:hover:bg-sand">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-[clamp(2.5rem,5vw,3.5rem)]">
          <section id="overview" aria-labelledby="overview-title" className={sectionClass}>
            <h2 id="overview-title" className={h2Class}>
              Overview
            </h2>
            <p className="mt-3 max-w-[44rem] text-muted">{product.description ?? product.usage}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['Category', category?.name ?? '—'],
                ['Use area', product.areas.map((a) => areaLabels[a]).join(' & ')],
                ['Applications', productApplications.map((a) => a.name).join(', ')],
              ].map(([label, value]) => (
                <li key={label} className="rounded-xl bg-sand/70 p-4">
                  <span className="block text-[0.75rem] font-semibold tracking-[0.12em] text-muted uppercase">{label}</span>
                  <span className="mt-1 block font-semibold text-ink">{value}</span>
                </li>
              ))}
            </ul>
          </section>

          {productApplications.length > 0 && (
            <section id="applications" aria-labelledby="applications-title" className={sectionClass}>
              <h2 id="applications-title" className={h2Class}>
                Application Areas
              </h2>
              <ul className="mt-5 grid gap-3 min-[30rem]:grid-cols-2 xl:grid-cols-3">
                {productApplications.map((a) => (
                  <li key={a.slug}>
                    <ApplicationTile application={a} to={`/products?application=${a.slug}`} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasSpecs && (
            <section id="specifications" aria-labelledby="specifications-title" className={sectionClass}>
              <h2 id="specifications-title" className={h2Class}>
                Technical Specifications
              </h2>
              <table className="mt-5 w-full overflow-hidden rounded-xl border border-border bg-surface text-[0.9375rem]">
                <tbody>
                  {product.specifications!.map((s) => (
                    <tr key={s.label} className="border-b border-border last:border-0">
                      <th scope="row" className="w-2/5 p-3 text-left font-semibold">{s.label}</th>
                      <td className="p-3 text-muted">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {hasPackaging && (
            <section id="packaging" aria-labelledby="packaging-title" className={sectionClass}>
              <h2 id="packaging-title" className={h2Class}>
                Packaging & Coverage
              </h2>
              {product.packSizes?.length ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {product.packSizes.map((size) => (
                    <li key={size} className="rounded-full border border-border bg-surface px-4 py-2 font-semibold">{size}</li>
                  ))}
                </ul>
              ) : null}
              {product.coverage && <p className="mt-4 text-muted">{product.coverage}</p>}
            </section>
          )}

          {hasDocs && (
            <section id="downloads" aria-labelledby="downloads-title" className={sectionClass}>
              <h2 id="downloads-title" className={h2Class}>
                Downloads
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {product.documents!.map((d) => (
                  <li key={d.url}>
                    <a href={d.url} download className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-forest">
                      <FileText aria-hidden="true" className="size-6 text-copper" />
                      <span className="flex-1 font-semibold">{d.title}</span>
                      <span className="text-[0.75rem] text-muted uppercase">{d.fileType}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {technicalPending && (
            <section id="technical" aria-labelledby="technical-title" className={sectionClass}>
              <h2 id="technical-title" className={h2Class}>
                Technical Information
              </h2>
              <div className="mt-5 flex flex-col gap-4 rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-[clamp(1.25rem,3vw,2rem)]">
                <p className="max-w-[44rem] text-muted">
                  Specifications, pack sizes, coverage rates and technical data sheets will be published here once
                  confirmed by the manufacturer. Until then, request a quote and we will share current product details.
                </p>
                <div className="flex flex-wrap gap-3">
                  <ButtonLink to={quoteHref}>Request Product Details</ButtonLink>
                  <ButtonLink to="/resources" variant="secondary">Technical Resources</ButtonLink>
                </div>
              </div>
            </section>
          )}

          {hasFaq && (
            <section id="faq" aria-labelledby="faq-title" className={sectionClass}>
              <h2 id="faq-title" className={h2Class}>
                FAQ
              </h2>
              <div className="mt-5 flex flex-col gap-2">
                {product.faq!.map((f) => (
                  <details key={f.question} className="rounded-xl border border-border bg-surface p-4">
                    <summary className="min-h-7 cursor-pointer font-semibold">{f.question}</summary>
                    <p className="mt-2 text-muted">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {!product.verified && (
            <DemoNotice>
              DEMO listing: a generic product type, not a verified ULTRA product. Images are illustrative concepts or
              placeholders, not official product photographs.
            </DemoNotice>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-border bg-canvas py-[var(--section-gap)]">
          <div className="container-page">
            <SectionHeading
              id="related-title"
              title="Related Products"
              action={
                <ButtonLink to={category ? `/products?category=${category.slug}` : '/products'} variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
                  View All <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
              }
            />
            <ul className="mt-8 grid grid-cols-1 gap-4 min-[22rem]:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <HelpBanner />
    </>
  )
}
