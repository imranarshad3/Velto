import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useProductViewTracking } from '../../features/analytics/trackView.ts'
import { ArrowLeft, ArrowRight, BadgeCheck, Calculator, Check, ClipboardList, Download, FileText, MessageSquareText, PackageX, Share2 } from 'lucide-react'
import { formatBytes, resourceDownloadPath, resourceKindLabels } from '../../features/resources/types.ts'
import { useResources } from '../../features/resources/useResources.ts'
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
import { demoCategories } from '../../data/demoCategories.ts'
import { applications } from '../../data/homeContent.ts'
import BuyBox from './BuyBox.tsx'
import ProductGallery, { type GallerySlide } from './ProductGallery.tsx'

const RELATED_LIMIT = 3

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
        await navigator.share({ title: `${name} — VELTO`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setStatus('Link copied')
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') setStatus('Could not share. Copy the address bar link instead.')
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3">
      <button type="button" onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[0.875rem] font-semibold text-ink transition-colors hover:text-forest">
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
    <section aria-labelledby="not-found-title" className="relative isolate overflow-hidden bg-cream">
      <title>Product not found — VELTO</title>
      <meta name="robots" content="noindex" />
      <div className="container-page py-[clamp(1rem,2.5vw,1.75rem)]">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }, { label: 'Not found' }]} />
        <div className="relative isolate mx-auto mt-[clamp(1.5rem,4vw,3rem)] mb-[var(--section-gap)] flex max-w-[44rem] flex-col items-center overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface px-6 py-[clamp(3rem,7vw,5rem)] text-center shadow-[var(--shadow-float)]">
          <span className="relative grid size-20 place-items-center rounded-full bg-cream ring-1 ring-sand-deep before:absolute before:-inset-3 before:rounded-full before:ring-1 before:ring-sand-deep/60">
            <span className="grid size-14 place-items-center rounded-full bg-[linear-gradient(180deg,var(--color-forest-mid),var(--color-forest))] text-white shadow-[var(--shadow-button)]">
              <PackageX aria-hidden="true" className="size-6" />
            </span>
          </span>
          <p className="mt-7 text-[0.75rem] font-bold tracking-[0.2em] text-copper uppercase">Error 404</p>
          <h1 id="not-found-title" className="mt-2 font-display text-[length:var(--h2)] leading-tight">
            Product not found
          </h1>
          <p className="mt-3 max-w-[30rem] text-[0.9375rem] leading-relaxed text-muted">
            This product may have moved or is no longer listed. Browse the catalogue to find what you need.
          </p>
          <ButtonLink to="/products" className="mt-7 px-6">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to products
          </ButtonLink>
        </div>
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
  const category = demoCategories.find((c) => c.slug === product?.categorySlug) ?? (product ? { slug: product.categorySlug, name: product.categoryName || product.categorySlug.replaceAll('-', ' '), image: undefined } : undefined)
  const related = useMemo(() => (product ? relatedProducts(product, products) : []), [product, products])
  useProductViewTracking(product?.slug)
  const [resources] = useResources()
  // Highlights the section currently in view in the "On this page" nav.
  const [activeSection, setActiveSection] = useState('overview')
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-product-section]')]
    if (!els.length || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActiveSection(top.target.id)
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [product?.slug, resources.kind])

  if (!product && status === 'loading') {
    return <div aria-busy="true" aria-label="Loading product" className="container-page my-8 h-[32rem] animate-pulse rounded-[var(--radius-card)] bg-sand" />
  }
  if (!product) return <NotFound />

  const productApplications = applications.filter((a) => product.applications.includes(a.slug))
  const slides: GallerySlide[] = product.images?.length ? product.images.map((image, i) => ({ key: image.src, caption: `${product.name} · image ${i + 1}`, image })) : [
    { key: 'pack', caption: product.image ? 'Illustrative concept packshot' : 'Product image coming soon', image: product.image },
    ...(category?.image
      ? [{ key: 'context', caption: `${category.name}: illustrative application photo`, image: category.image, fill: true }]
      : []),
  ]
  const hasSpecs = !!product.specifications?.length
  const hasPackaging = !!product.packSizes?.length || !!product.coverage
  // Uploaded documents linked to this product, and verified coverage (public API only returns it for verified products).
  const linkedDocs = resources.kind === 'ready' ? resources.data.resources.filter((r) => r.productSlugs.includes(product.slug)) : []
  const coverage = resources.kind === 'ready' ? resources.data.coverage.find((c) => c.productSlug === product.slug) : undefined
  const hasDocs = !!product.documents?.length || linkedDocs.length > 0 || !!coverage
  const hasFaq = !!product.faq?.length
  const technicalPending = !hasSpecs && !hasPackaging && !hasDocs

  const sections = [
    { id: 'overview', label: 'Overview' },
    productApplications.length > 0 && { id: 'applications', label: 'Applications' },
    hasSpecs && { id: 'specifications', label: 'Specifications' },
    hasPackaging && { id: 'packaging', label: 'Packaging & Coverage' },
    hasDocs && { id: 'downloads', label: 'Technical Resources' },
    technicalPending && { id: 'technical', label: 'Technical Information' },
    hasFaq && { id: 'faq', label: 'FAQ' },
  ].filter((s): s is { id: string; label: string } => Boolean(s))

  const quoteHref = `/quote?product=${product.slug}`

  return (
    <>
      <title>{`${product.name} — VELTO`}</title>
      <meta name="description" content={product.description ?? product.usage} />

      <div className="bg-cream">
        <div className="container-page pt-4 pb-[clamp(3rem,6vw,5rem)]">
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              { label: 'Products', to: '/products' },
              ...(category ? [{ label: category.name, to: `/products?category=${category.slug}` }] : []),
              { label: product.name },
            ]}
          />

          <div className="mt-6 grid gap-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start xl:gap-[clamp(3rem,5vw,5rem)]">
            <ProductGallery key={product.slug} slides={slides} productName={product.name} />

            <div className="animate-rise flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-3">
                {category && (
                  <Link to={`/products?category=${category.slug}`} className="inline-flex min-h-11 items-center text-[0.75rem] font-semibold tracking-[0.16em] text-sage uppercase hover:text-forest">
                    {category.name}
                  </Link>
                )}
                {!product.verified && <span className="rounded-full bg-forest px-3 py-1 text-[0.6875rem] leading-none font-bold tracking-[0.12em] text-white">DEMO</span>}
              </div>
              <h1 className="mt-2 font-display text-[clamp(2.25rem,1.5rem+2.8vw,3.5rem)] leading-[1.08] tracking-[-0.02em] text-forest-deep">{product.name}</h1>
              <p className="mt-4 max-w-[34rem] text-[clamp(1.0625rem,1rem+0.25vw,1.1875rem)] leading-relaxed text-muted">{product.usage}</p>

              {product.benefits?.length ? (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {product.benefits.map((b) => (
                    <li key={b} className="flex gap-2 text-[0.9375rem]">
                      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-forest" /> {b}
                    </li>
                  ))}
                </ul>
              ) : null}

              <dl className="my-6 grid gap-[var(--grid-gap)] border-y border-border py-5 sm:grid-cols-2">
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

              <BuyBox key={product.slug} product={product} quoteHref={quoteHref} />

              <div className="mt-3 flex flex-wrap items-center gap-x-4">
                <WishlistButton slug={product.slug} name={product.name} variant="text" />
                <ShareButton name={product.name} />
              </div>

              {/* Service links: real site features only, no product claims. */}
              <ul className="mt-5 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border sm:grid-cols-3">
                {[
                  { icon: ClipboardList, title: 'Cash on Delivery', text: 'Rs. 300 delivery per order', to: '/checkout?product='+product.slug },
                  { icon: Calculator, title: 'Calculator', text: 'Estimate packs needed', to: `/resources/coverage-calculator${coverage ? `?product=${product.slug}` : ''}` },
                  { icon: FileText, title: 'Data sheets', text: 'Guides & documents', to: '/resources/documents' },
                ].map(({ icon: ItemIcon, title, text, to }) => (
                  <li key={title} className="bg-surface">
                    <Link to={to} className="group flex h-full min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-cream">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-soft text-forest">
                        <ItemIcon aria-hidden="true" className="size-4" />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block text-[0.875rem] font-semibold text-ink group-hover:text-forest">{title}</span>
                        <span className="block text-[0.75rem] text-muted">{text}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 pt-[clamp(2.5rem,5vw,4rem)] pb-[var(--section-gap)] lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-14">
        <nav aria-label="Product information" className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start lg:rounded-[var(--radius-card)] lg:border lg:border-border lg:bg-surface lg:p-3">
          <p className="hidden px-3 pt-1 pb-2 text-[0.6875rem] font-semibold tracking-[0.16em] text-sage uppercase lg:block">On this page</p>
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
            {sections.map((s) => {
              const active = activeSection === s.id
              return (
                <li key={s.id} className="shrink-0">
                  <a
                    href={`#${s.id}`}
                    aria-current={active ? 'location' : undefined}
                    className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[0.875rem] font-medium whitespace-nowrap transition-colors lg:flex lg:rounded-lg lg:border-transparent lg:px-3 ${active ? 'border-forest bg-forest-soft text-forest lg:font-semibold' : 'border-border bg-surface hover:border-forest hover:text-forest lg:bg-transparent lg:hover:bg-cream'}`}
                  >
                    {s.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-[clamp(2.5rem,5vw,3.5rem)]">
          <section id="overview" aria-labelledby="overview-title" data-product-section className={sectionClass}>
            <h2 id="overview-title" className={h2Class}>
              Overview
            </h2>
            <p className="mt-3 max-w-[44rem] text-muted">{product.description ?? product.usage}</p>
            <dl className="mt-6 grid overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface sm:grid-cols-3">
              {[
                ['Category', category?.name ?? '—'],
                ['Use area', product.areas.map((a) => areaLabels[a]).join(' & ')],
                ['Applications', productApplications.map((a) => a.name).join(', ') || '—'],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-border p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
                  <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-sage uppercase">{label}</dt>
                  <dd className="mt-1.5 font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {productApplications.length > 0 && (
            <section id="applications" aria-labelledby="applications-title" data-product-section className={sectionClass}>
              <h2 id="applications-title" className={h2Class}>
                Application Areas
              </h2>
              <ul className="mt-5 grid gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 xl:grid-cols-3">
                {productApplications.map((a) => (
                  <li key={a.slug}>
                    <ApplicationTile application={a} to={`/products?application=${a.slug}`} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasSpecs && (
            <section id="specifications" aria-labelledby="specifications-title" data-product-section className={sectionClass}>
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
            <section id="packaging" aria-labelledby="packaging-title" data-product-section className={sectionClass}>
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
            <section id="downloads" aria-labelledby="downloads-title" data-product-section className={sectionClass}>
              <h2 id="downloads-title" className={h2Class}>
                Technical Resources
              </h2>
              {coverage && (
                <div className="mt-5 flex flex-col gap-4 rounded-[var(--radius-card)] border border-forest/15 bg-forest-soft/50 p-[clamp(1.25rem,3vw,1.75rem)] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold tracking-[0.08em] text-forest uppercase">
                      <BadgeCheck aria-hidden="true" className="size-4" /> Manufacturer coverage
                    </p>
                    <p className="mt-1 text-[1.0625rem] font-semibold text-ink">
                      {coverage.rate} {coverage.rateUnit === 'kg' ? 'kg' : 'litres'} per m² per coat · {coverage.coats} {coverage.coats === 1 ? 'coat' : 'coats'} · {coverage.packAmount} {coverage.rateUnit === 'kg' ? 'kg' : 'litre'} {coverage.packContainer === 'units' ? 'units' : coverage.packContainer}
                    </p>
                    {coverage.note && <p className="mt-1 text-[0.875rem] text-muted">{coverage.note}</p>}
                  </div>
                  <ButtonLink to={`/resources/coverage-calculator?product=${product.slug}`} variant="secondary" className="shrink-0">
                    <Calculator aria-hidden="true" className="size-4" /> Calculate quantity
                  </ButtonLink>
                </div>
              )}
              {(linkedDocs.length > 0 || !!product.documents?.length) && (
                <ul className="mt-5 grid gap-[var(--grid-gap)] sm:grid-cols-2">
                  {linkedDocs.map((d) => (
                    <li key={d.id}>
                      <a href={resourceDownloadPath(d.id)} download className="group flex min-h-11 items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-forest">
                        <FileText aria-hidden="true" className="size-6 shrink-0 text-copper" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-ink group-hover:text-forest">{d.title}</span>
                          <span className="block text-[0.8125rem] text-muted">
                            {resourceKindLabels[d.kind]} · PDF · {formatBytes(d.fileSize)}
                          </span>
                        </span>
                        <Download aria-hidden="true" className="size-4 shrink-0 text-muted group-hover:text-forest" />
                      </a>
                    </li>
                  ))}
                  {product.documents?.map((d) => (
                    <li key={d.url}>
                      <a href={d.url} download className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-forest">
                        <FileText aria-hidden="true" className="size-6 text-copper" />
                        <span className="flex-1 font-semibold">{d.title}</span>
                        <span className="text-[0.75rem] text-muted uppercase">{d.fileType}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.875rem] text-muted">
                Need another document?
                <Link to={`/contact?topic=products&message=${encodeURIComponent(`Please send me the technical documents for ${product.name}.`)}`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-forest hover:underline">
                  <MessageSquareText aria-hidden="true" className="size-4" /> Request a document
                </Link>
              </p>
            </section>
          )}

          {technicalPending && (
            <section id="technical" aria-labelledby="technical-title" data-product-section className={sectionClass}>
              <h2 id="technical-title" className={h2Class}>
                Technical Information
              </h2>
              <div className="mt-5 flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(1.25rem,3vw,2rem)] sm:flex-row sm:items-start">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                  <FileText aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">Specifications are being verified</p>
                  <p className="mt-1 max-w-[42rem] text-muted">
                    Specifications, pack sizes, coverage rates and data sheets are published here once confirmed by the manufacturer. Until then, we’ll share current product details with your quote.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink to={quoteHref}>Request product details</ButtonLink>
                    <ButtonLink to={`/contact?topic=products&message=${encodeURIComponent(`Please send me the technical documents for ${product.name}.`)}`} variant="secondary">
                      Request a document
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </section>
          )}

          {hasFaq && (
            <section id="faq" aria-labelledby="faq-title" data-product-section className={sectionClass}>
              <h2 id="faq-title" className={h2Class}>
                FAQ
              </h2>
              <div className="mt-5 flex flex-col gap-2">
                {product.faq!.map((f) => (
                  <details key={f.question} className="rounded-xl border border-border bg-surface p-4">
                    <summary className="min-h-11 cursor-pointer py-2 font-semibold">{f.question}</summary>
                    <p className="mt-2 text-muted">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {!product.verified && (
            <DemoNotice>
              DEMO listing for storefront testing. Product names, prices and packaging are illustrative concepts,
              not verified manufacturer data or official product photographs.
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
              eyebrow="Explore the range"
              description="Compare products for similar applications and project needs."
              action={
                <ButtonLink to={category ? `/products?category=${category.slug}` : '/products'} variant="ghost" className="-mr-3 px-3 text-[0.875rem]">
                  View All <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
              }
            />
            <ul className="mt-[var(--heading-gap)] grid grid-cols-1 gap-[var(--grid-gap)] min-[30rem]:grid-cols-2 md:grid-cols-3 lg:gap-[var(--grid-gap-lg)]">
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
