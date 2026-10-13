import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import type { Category } from '../../data/demoCategories.ts'

/** Material-inspired placeholder textures, shown until licensed category photography exists. */
const textures: Record<Category['texture'], CSSProperties> = {
  tile: {
    background:
      'linear-gradient(90deg, transparent 47%, #a3968a 47% 53%, transparent 53%) 0 0 / 50% 50%, linear-gradient(0deg, transparent 47%, #a3968a 47% 53%, transparent 53%) 0 0 / 50% 50%, linear-gradient(135deg, #e6ded2, #c3b6a5)',
  },
  water: {
    background:
      'radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.4) 0 18%, transparent 22%) 0 0 / 22% 30%, linear-gradient(160deg, #4a8a99, #1d4b59)',
  },
  grout: {
    background:
      'repeating-linear-gradient(45deg, transparent 0 22%, #8c8173 22% 24%), linear-gradient(135deg, #ddd3c5, #b4a794)',
  },
  concrete: {
    background:
      'linear-gradient(115deg, transparent 48.5%, #57524b 49% 50%, transparent 50.5%), radial-gradient(circle, #8f897f 0 12%, transparent 16%) 0 0 / 14% 18%, linear-gradient(140deg, #bdb7ae, #8b857c)',
  },
  floor: {
    background:
      'linear-gradient(100deg, transparent 35%, rgb(255 255 255 / 0.35) 50%, transparent 65%), linear-gradient(180deg, #a6bdba, #678785)',
  },
  admix: {
    background:
      'radial-gradient(circle, #6d675f 0 10%, transparent 14%) 0 0 / 12% 16%, linear-gradient(150deg, #b0aaa1, #7a746c)',
  },
  surface: {
    background:
      'repeating-linear-gradient(100deg, rgb(255 255 255 / 0.14) 0 3%, transparent 3% 8%), linear-gradient(135deg, #e5c79e, #b98552)',
  },
  tools: {
    background:
      'radial-gradient(circle at 75% 30%, rgb(165 83 42 / 0.55) 0 18%, transparent 40%), linear-gradient(140deg, #4c514d, #262a27)',
  },
}

interface CategoryCardProps {
  category: Category
  className?: string
  /** Defaults to the products page filtered by this category. */
  to?: string
  active?: boolean
}

export default function CategoryCard({ category, className = '', to, active = false }: CategoryCardProps) {
  const Icon = category.icon
  const [imageFailed, setImageFailed] = useState(false)
  const image = imageFailed ? undefined : category.image

  return (
    <Link
      to={to ?? `/products?category=${category.slug}`}
      aria-current={active ? 'page' : undefined}
      className={`group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-surface ${active ? 'border-forest ring-2 ring-forest' : 'border-border'} transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="relative aspect-[3/2] overflow-hidden" style={image ? undefined : textures[category.texture]}>
        {/* Decorative image (alt=""): the link text already names the category. */}
        {image ? (
          <img
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            onError={() => setImageFailed(true)}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center transition-transform duration-500 group-hover:scale-105"
          >
            <span className="grid size-12 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/40 backdrop-blur-sm">
              <Icon className="size-6" />
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-3.5 py-3">
        <span className={`text-[0.875rem] leading-snug font-semibold group-hover:text-forest ${active ? 'text-forest' : 'text-ink'}`}>{category.name}</span>
        {category.productCount !== undefined && (
          <span className="mt-0.5 text-[0.75rem] text-muted">{category.productCount} Products</span>
        )}
      </div>
    </Link>
  )
}
