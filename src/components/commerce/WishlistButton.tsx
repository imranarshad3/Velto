import { Heart } from 'lucide-react'
import { useWishlist } from '../../features/wishlist/wishlistStore.ts'
import { useToasts } from '../../features/ui/toastStore.ts'

interface WishlistButtonProps {
  slug: string
  name: string
  variant?: 'icon' | 'text'
  className?: string
}

export default function WishlistButton({ slug, name, variant = 'icon', className = '' }: WishlistButtonProps) {
  const saved = useWishlist((s) => s.slugs.includes(slug))
  const toggle = useWishlist((s) => s.toggle)
  const show = useToasts((s) => s.show)

  const onClick = () => {
    const nowSaved = toggle(slug)
    show(nowSaved ? `${name} saved to your wishlist` : `${name} removed from your wishlist`, nowSaved ? { label: 'View wishlist', to: '/wishlist' } : undefined)
  }

  const icon = <Heart aria-hidden="true" className={`size-[1.125rem] transition-colors ${saved ? 'fill-forest text-forest' : ''}`} />

  if (variant === 'text') {
    return (
      <button type="button" onClick={onClick} aria-pressed={saved} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[0.875rem] font-semibold text-ink hover:text-forest ${className}`}>
        {icon} {saved ? 'Saved to wishlist' : 'Save to wishlist'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={`Save ${name} to wishlist`}
      className={`grid size-11 place-items-center rounded-full bg-surface/95 text-ink shadow-[var(--shadow-card)] transition-transform hover:scale-105 hover:text-forest ${className}`}
    >
      {icon}
    </button>
  )
}
