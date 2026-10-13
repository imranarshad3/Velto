import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import type { CatalogProduct } from '../../data/catalog.ts'
import { productPath } from '../../data/catalog.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { cardPrice } from '../../features/catalog/price.ts'
import Img from '../ui/Img.tsx'
import AddToCartButton from './AddToCartButton.tsx'
import WishlistButton from './WishlistButton.tsx'

interface ProductCardProps {
  product: CatalogProduct
  layout?: 'grid' | 'list'
  /** `roomy` enlarges grid cards on large desktops (>= 90rem); smaller viewports are unchanged. */
  density?: 'default' | 'roomy'
}

const categories = new Map(demoCategories.map((c) => [c.slug, c]))

/** DEMO card: no price, stock, rating or cart action until the catalogue is verified. */
export default function ProductCard({ product, layout = 'grid', density = 'default' }: ProductCardProps) {
  const titleId = `${product.id}-title`
  const category = categories.get(product.categorySlug)
  const Icon = category?.icon
  const list = layout === 'list'
  const roomy = density === 'roomy' && !list
  const price = cardPrice(product)

  return (
    <article
      aria-labelledby={titleId}
      className={`@container group relative isolate flex h-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[0_0.0625rem_0.125rem_rgb(23_28_25/0.04)] transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] focus-within:border-forest/40 hover:-translate-y-1 hover:border-forest/25 hover:shadow-[0_1.5rem_3rem_-1.5rem_rgb(23_60_45/0.35)] motion-reduce:hover:translate-y-0 ${list ? 'flex-row' : 'flex-col'}`}
    >
      {/* Copper accent rule that draws in on hover/focus. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-20 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-copper via-copper to-forest transition-transform duration-500 group-focus-within:scale-x-100 group-hover:scale-x-100"
      />
      <div
        className={`relative grid shrink-0 place-items-center overflow-hidden bg-[radial-gradient(120%_90%_at_50%_30%,#fff_0%,#fff_45%,var(--color-sand)_100%)] ${list ? 'm-3 aspect-square w-[clamp(5.5rem,26%,10rem)] self-start rounded-xl p-[6%] ring-1 ring-border sm:m-4' : 'm-2 aspect-square rounded-[calc(var(--radius-card)-0.375rem)] p-[10%]'} ${roomy ? 'min-[90rem]:m-2.5 min-[90rem]:p-[9%]' : ''}`}
      >
        {product.image ? (
          <Img
            image={product.image}
            className="max-h-full w-auto object-contain drop-shadow-[0_0.75rem_1rem_rgb(23_28_25/0.12)] transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sand-deep text-muted">
            {Icon && <Icon aria-hidden="true" className="size-[clamp(1.5rem,22%,2.5rem)] text-forest/60" />}
            <span className={`text-[0.75rem] font-medium ${list ? 'sr-only sm:not-sr-only' : ''}`}>Image coming soon</span>
          </span>
        )}
        {!product.verified && (
          <span className="absolute top-2.5 left-2.5 rounded-full border border-forest/15 bg-surface/85 px-2.5 py-0.5 text-[0.6875rem] font-bold tracking-[0.12em] text-forest backdrop-blur-sm">
            DEMO
          </span>
        )}
        <WishlistButton slug={product.slug} name={product.name} className="absolute top-1.5 right-1.5 z-10 size-10 sm:size-11" />
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${list ? 'p-4 sm:p-5' : 'px-3.5 pt-3 pb-4 @[15rem]:px-5 @[15rem]:pb-5'} ${roomy ? 'min-[90rem]:px-6 min-[90rem]:pt-4 min-[90rem]:pb-6' : ''}`}>
        {category && (
          <p className={`flex items-center gap-1.5 text-[0.6875rem] font-bold tracking-[0.14em] text-copper uppercase ${roomy ? 'min-[90rem]:text-[0.75rem]' : ''}`}>
            {Icon && <Icon aria-hidden="true" className="size-3.5" />}
            {category.name}
          </p>
        )}
        <h3 id={titleId} className={`mt-1.5 font-display text-[clamp(1.1875rem,1.1rem+0.3vw,1.375rem)] leading-[1.2] text-ink ${roomy ? 'min-[90rem]:mt-2 min-[90rem]:text-[clamp(1.5rem,1rem+0.55vw,1.75rem)]' : ''}`}>
          {/* Stretched link: the whole card opens the product; the quote link sits above it. */}
          <Link to={productPath(product)} className="transition-colors after:absolute after:inset-0 after:rounded-[var(--radius-card)] group-hover:text-forest">
            {product.name}
          </Link>
        </h3>
        <p className={`mt-1.5 line-clamp-2 text-[0.875rem] leading-relaxed text-muted ${roomy ? 'min-[90rem]:mt-2 min-[90rem]:text-[0.9375rem]' : ''}`}>{product.usage}</p>
        <div className={`mt-auto flex flex-wrap items-end gap-x-2 gap-y-3 pt-4 ${list ? 'sm:flex-nowrap sm:items-center' : ''} ${roomy ? 'min-[90rem]:gap-y-4 min-[90rem]:pt-5' : ''}`}>
          <div className={`flex min-w-0 items-end justify-between gap-3 ${list ? 'mr-auto' : 'w-full border-t border-border pt-3'}`}>
            <p className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.1em] text-muted uppercase">
                Price
                {price?.demo && <span className="rounded-sm bg-sand px-1 py-0.5 text-[0.625rem] font-bold tracking-[0.08em] text-copper">DEMO</span>}
              </span>
              <span className={`leading-tight font-extrabold text-ink tabular-nums ${price ? 'text-[clamp(1.125rem,1.05rem+0.3vw,1.3125rem)]' : 'text-[0.9375rem]'} ${roomy ? 'min-[90rem]:text-[1.5rem]' : ''}`}>
                {price ? (
                  <>
                    {price.label}
                    {price.demo && <span className="sr-only"> (illustrative demo price)</span>}
                  </>
                ) : (
                  'On request'
                )}
              </span>
            </p>
            {!list && <AddToCartButton slug={product.slug} name={product.name} className="relative z-10" />}
          </div>
          <Link
            to={`/quote?product=${product.slug}`}
            className={`relative z-10 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forest px-4 text-[0.875rem] font-semibold whitespace-nowrap text-white shadow-[0_0.5rem_1rem_-0.5rem_rgb(23_60_45/0.6)] transition-colors hover:bg-forest-dark ${list ? 'flex-1 sm:flex-none' : 'w-full'} ${roomy ? 'min-[90rem]:min-h-12 min-[90rem]:text-[0.9375rem]' : ''}`}
          >
            {/* Narrow cards (two-up on small phones) shorten the label to avoid wrapping. */}
            <span>
              <span className={list ? '' : 'hidden @[13rem]:inline'}>Request </span>Quote<span className="sr-only"> for {product.name}</span>
            </span>
            <ArrowRight aria-hidden="true" className="hidden size-4 shrink-0 @[11rem]:block transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          {list && <AddToCartButton slug={product.slug} name={product.name} className="relative z-10" />}
        </div>
      </div>
    </article>
  )
}
