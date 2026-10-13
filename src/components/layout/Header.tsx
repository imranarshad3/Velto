import { useCallback, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Heart, Menu, Search, ShoppingCart } from 'lucide-react'
import { primaryNav } from '../../data/navigation.ts'
import { useCart } from '../../features/cart/cartStore.ts'
import { useWishlist } from '../../features/wishlist/wishlistStore.ts'
import Logo from '../ui/Logo.tsx'
import AccountControl from './AccountControl.tsx'
import MobileNav from './MobileNav.tsx'

const iconButton =
  'relative grid size-11 place-items-center rounded-lg text-ink transition-colors hover:bg-sand hover:text-forest'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const cartCount = useCart((s) => s.items.length)
  const wishlistCount = useWishlist((s) => s.slugs.length)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="container-page flex min-h-[var(--header-height)] items-center gap-2 lg:gap-6">
        <button
          type="button"
          className={`${iconButton} -ml-2 lg:hidden`}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden="true" className="size-6" />
        </button>

        <Logo />

        <nav aria-label="Main" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-3">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative inline-flex min-h-11 items-center rounded-md px-2.5 xl:px-3 text-[0.9375rem] font-medium transition-colors after:absolute after:inset-x-2.5 xl:after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-copper after:transition-transform hover:text-forest ${isActive ? 'text-forest after:scale-x-100' : 'text-ink after:scale-x-0'}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1 lg:ml-0">
          <Link to="/products" className={iconButton} aria-label="Search products">
            <Search aria-hidden="true" className="size-[1.375rem]" />
          </Link>
          <Link to="/wishlist" className={`${iconButton} hidden sm:grid`} aria-label={`Wishlist, ${wishlistCount} saved`}>
            <Heart aria-hidden="true" className="size-[1.375rem]" />
            {wishlistCount > 0 && (
              <span aria-hidden="true" className="absolute top-1 right-0.5 grid min-w-[1.125rem] place-items-center rounded-full bg-copper px-1 text-[0.625rem] leading-[1.125rem] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className={iconButton} aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>
            <ShoppingCart aria-hidden="true" className="size-[1.375rem]" />
            <span
              aria-hidden="true"
              className="absolute top-1 right-0.5 grid min-w-[1.125rem] place-items-center rounded-full bg-forest px-1 text-[0.625rem] leading-[1.125rem] font-bold text-white"
            >
              {cartCount}
            </span>
          </Link>
          <div className="ml-2 hidden md:block xl:ml-3">
            <AccountControl />
          </div>
        </div>
      </div>

      <MobileNav open={menuOpen} onClose={closeMenu} />
    </header>
  )
}
