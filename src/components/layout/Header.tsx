import { useContentData, useContentReady } from "../../features/cms/context.ts";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink } from "react-router";
import { ArrowRight, Heart, Menu, Search, ShoppingCart } from "lucide-react";
import {
  storefrontNav,
  primaryNav as defaultPrimaryNav,
} from "../../data/navigation.ts";
import { useCart } from "../../features/cart/cartStore.ts";
import { useWishlist } from "../../features/wishlist/wishlistStore.ts";
import Logo from "../ui/Logo.tsx";
import Skeleton from "../ui/Skeleton.tsx";
import { buttonArrow, buttonClass } from "../ui/button.ts";
import AccountControl from "./AccountControl.tsx";
import MobileNav from "./MobileNav.tsx";
import ProductSearch from "./ProductSearch.tsx";

const iconButton =
  "relative grid size-11 place-items-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white";

export default function Header() {
  const ready = useContentReady("site");
  const primaryNav = storefrontNav(
    useContentData("site", "Navigation.data", defaultPrimaryNav),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const cartCount = useCart((s) => s.items.length);
  const wishlistCount = useWishlist((s) => s.slugs.length);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300 border-white/[0.08] bg-nav ${scrolled ? "shadow-[0_0.75rem_2rem_-1rem_rgb(21_43_64/0.6)]" : ""}`}
    >
      <div className="container-page flex min-h-[var(--header-height)] items-center gap-2 xl:gap-5">
        <button
          type="button"
          className={`${iconButton} -ml-2 shrink-0 xl:hidden`}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden="true" className="size-6" />
        </button>

        <Logo className="!text-emerald-muted [&>span>span:first-child]:text-white [&>span>span:last-child]:text-white/55" />

        <nav aria-label="Main" className="mx-auto hidden xl:block">
          {!ready ? (
            <div className="flex items-center gap-4 py-2" aria-hidden="true">
              <Skeleton className="h-4 w-12 rounded-md bg-white/10" />
              <Skeleton className="h-4 w-16 rounded-md bg-white/10" />
              <Skeleton className="h-4 w-24 rounded-md bg-white/10" />
              <Skeleton className="h-4 w-24 rounded-md bg-white/10" />
              <Skeleton className="h-4 w-20 rounded-md bg-white/10" />
              <Skeleton className="h-4 w-14 rounded-md bg-white/10" />
            </div>
          ) : (
            <ul className="flex items-center gap-0.5 xl:gap-1.5">
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `relative inline-flex min-h-11 items-center rounded-full px-3 xl:px-3.5 text-[0.9375rem] font-medium transition-colors duration-200 after:absolute after:inset-x-3 xl:after:inset-x-3.5 after:bottom-1.5 after:h-0.5 after:origin-left after:rounded-full after:bg-emerald-muted after:transition-transform after:duration-300 hover:bg-white/[0.06] hover:text-white ${isActive ? "font-semibold text-white after:scale-x-100" : "text-white/75 after:scale-x-0"}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 xl:ml-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={iconButton}
            aria-label="Search products"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
          >
            <Search aria-hidden="true" className="size-[1.375rem]" />
          </button>
          <Link
            to="/wishlist"
            className={`${iconButton} hidden sm:grid`}
            aria-label={`Wishlist, ${wishlistCount} saved`}
          >
            <Heart aria-hidden="true" className="size-[1.375rem]" />
            {wishlistCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1 right-0.5 grid min-w-[1.125rem] place-items-center rounded-full bg-emerald-muted px-1 text-[0.625rem] leading-[1.125rem] font-bold text-nav ring-2 ring-nav"
              >
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            className={iconButton}
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          >
            <ShoppingCart aria-hidden="true" className="size-[1.375rem]" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1 right-0.5 grid min-w-[1.125rem] place-items-center rounded-full bg-emerald-muted px-1 text-[0.625rem] leading-[1.125rem] font-bold text-nav ring-2 ring-nav"
              >
                {cartCount}
              </span>
            )}
          </Link>
          {/* Visibility lives on the wrapper: buttonClass sets display, which would override a bare `hidden`. */}
          <div className="ml-2 hidden min-[90rem]:block">
            <Link to="/quote" className={buttonClass("accent", "sm")}>
              Get a project price
              <ArrowRight
                aria-hidden="true"
                className={`size-4 ${buttonArrow}`}
              />
            </Link>
          </div>
          <div className="ml-2 hidden md:block xl:ml-3">
            <AccountControl />
          </div>
        </div>
      </div>

      <MobileNav open={menuOpen} onClose={closeMenu} />
      <ProductSearch open={searchOpen} onClose={closeSearch} />
    </header>
  );
}
