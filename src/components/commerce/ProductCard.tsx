import { Link } from "react-router";
import { ArrowRight, Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";

import type { CatalogProduct } from "../../data/catalog.ts";
import { productPath } from "../../data/catalog.ts";
import { demoCategories } from "../../data/demoCategories.ts";
import { MAX_CART_ITEMS, useCart } from "../../features/cart/cartStore.ts";
import { cardPrice } from "../../features/catalog/price.ts";
import { useToasts } from "../../features/ui/toastStore.ts";
import Img from "../ui/Img.tsx";
import WishlistButton from "./WishlistButton.tsx";

interface ProductCardProps {
  product: CatalogProduct;
  layout?: "grid" | "list";
}

const categories = new Map(demoCategories.map((c) => [c.slug, c]));

const MAX_QTY = 9999;

const clamp = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.round(n) || 1));

export default function ProductCard({
  product,
  layout = "grid",
}: ProductCardProps) {
  const titleId = `${product.id}-title`;
  const category = categories.get(product.categorySlug);
  const categoryLabel = product.categoryName ?? category?.name;
  const Icon = category?.icon;
  const list = layout === "list";
  const price = cardPrice(product);

  const cartItem = useCart((s) => s.items.find((i) => i.slug === product.slug));

  const show = useToasts((s) => s.show);
  const qty = clamp(cartItem?.quantity ?? 1);
  const unit = cartItem?.unit ?? "units";

  const addToCart = () => {
    const { add, update } = useCart.getState();
    const result = add(product.slug);

    if (result === "full") {
      show(
        `Your cart holds up to ${MAX_CART_ITEMS} products. Complete your current cart first.`,
        {
          label: "View cart",
          to: "/cart",
        },
      );
      return;
    }

    update(product.slug, {
      quantity: 1,
      unit,
    });

    show(`${product.name} added to your cart`, {
      label: "View cart",
      to: "/cart",
    });
  };

  const setQty = (n: number) => {
    useCart.getState().update(product.slug, {
      quantity: clamp(n),
    });
  };

  const decrement = () => {
    if (qty > 1) {
      setQty(qty - 1);
      return;
    }

    useCart.getState().remove(product.slug);

    show(`${product.name} removed from your cart`, {
      label: "View cart",
      to: "/cart",
    });
  };

  const step =
    "grid h-12 w-11 shrink-0 place-items-center text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent";

  return (
    <article
      aria-labelledby={titleId}
      className={`
        @container group relative isolate
        flex h-full overflow-hidden
        rounded-[var(--radius-card)]
        border border-border/80
        bg-surface
        shadow-[0_0.125rem_0.375rem_rgb(32_44_54/0.04)]
        transition-[transform,box-shadow,border-color]
        duration-500 ease-[var(--ease-premium)]
        focus-within:border-forest/35
        hover:-translate-y-1
        hover:border-forest/20
        hover:shadow-[0_1.5rem_3rem_-1.75rem_rgb(41_76_104/0.4)]
        motion-reduce:hover:translate-y-0
        ${list ? "flex-col sm:flex-row" : "flex-col"}
      `}
    >
      {/* Fixed-ratio frame; the photo is contained inside it, so every card has the
          same media height and the whole product stays visible and undistorted. */}
      <div
        className={`
          relative shrink-0 overflow-hidden
          border-b border-border/60 bg-white
          ${
            list
              ? "aspect-[5/4] w-full sm:aspect-square sm:w-[clamp(12rem,30%,17rem)] sm:border-r sm:border-b-0"
              : "aspect-square w-full"
          }
        `}
      >
        {product.image ? (
          <div
            className="
              absolute inset-0 grid place-items-center
              p-2
              @[18rem]:p-3
              @[24rem]:p-4
            "
          >
            <Img
              image={product.image}
              fit="contain"
              className="block size-full object-contain object-center"
            />
          </div>
        ) : (
          <span
            className="
              absolute inset-0 flex flex-col
              items-center justify-center
              gap-2 text-muted
            "
          >
            {Icon && (
              <Icon aria-hidden="true" className="size-9 text-forest/50" />
            )}

            <span className="text-[0.75rem] font-medium">
              Image coming soon
            </span>
          </span>
        )}

        {/* DEMO BADGE */}
        {!product.verified && (
          <span
            className="
              absolute top-3 left-3 z-10
              rounded-full bg-forest
              px-3 py-1 text-[0.6875rem]
              leading-none font-bold
              tracking-[0.12em] text-white
              @[18rem]:top-4
              @[18rem]:left-4
              @[18rem]:px-3.5
              @[18rem]:py-1.5
              @[18rem]:text-[0.75rem]
            "
          >
            DEMO
          </span>
        )}

        {/* WISHLIST */}
        <WishlistButton
          slug={product.slug}
          name={product.name}
          className="
            absolute top-2 right-2 z-10
            bg-white
            @[18rem]:top-3
            @[18rem]:right-3
            @[18rem]:size-12
          "
        />
      </div>

      {/* PRODUCT CONTENT */}
      <div
        className="
          flex min-w-0 flex-1 flex-col p-4
          @[18rem]:p-5
          @[24rem]:p-6
        "
      >
        {/* CATEGORY - height reserved even when a product has no category */}
        <p
          className="
            min-h-[1.4em] text-[0.6875rem]
            font-semibold tracking-[0.16em]
            text-sage uppercase
            @[18rem]:text-[0.75rem]
          "
        >
          {categoryLabel}
        </p>

        {/* TITLE AND PRICE */}
        <div
          className="
            mt-1 flex flex-col gap-x-4 gap-y-1
            @[22rem]:flex-row
            @[22rem]:items-start
            @[22rem]:justify-between
          "
        >
          <h3
            id={titleId}
            className="
              min-w-0 min-h-[2.3em] font-display
              text-[1.25rem] leading-[1.15]
              text-forest-deep
              @[20rem]:text-[1.5rem]
              @[28rem]:text-[1.625rem]
            "
          >
            <Link
              to={productPath(product)}
              className="
                line-clamp-2 transition-colors
                after:absolute
                after:inset-0
                after:rounded-[var(--radius-card)]
                hover:text-forest
              "
            >
              {product.name}
            </Link>
          </h3>

          <p
            className="
              flex min-h-[2.4em] shrink-0
              flex-col justify-start
              @[22rem]:items-end
              @[22rem]:pt-0.5
            "
          >
            <span
              className={`
      leading-tight font-extrabold
      whitespace-nowrap tabular-nums
      ${
        price
          ? "text-[1.1875rem] @[18rem]:text-[1.3125rem] text-copper-hover"
          : "text-[1rem] text-forest"
      }
    `}
            >
              {price ? price.label : "Price on request"}

              {price?.demo && (
                <span className="sr-only"> (illustrative demo price)</span>
              )}
            </span>

            {price?.demo && (
              <span
                aria-hidden="true"
                className="
        text-[0.6875rem]
        font-semibold
        tracking-[0.08em]
        text-forest uppercase
      "
              >
                Demo price
              </span>
            )}
          </p>
        </div>

        {/* DESCRIPTION */}
        <p
          className="
            mt-3 line-clamp-2 min-h-[3.25em]
            text-[0.9375rem]
            leading-relaxed text-muted
          "
        >
          {product.usage}
        </p>

        {/* ACTION BUTTONS */}
        <div
          className={`
            relative z-10 mt-auto
            grid grid-cols-1 items-stretch
            gap-2 pt-5
            @[19rem]:grid-cols-2
            ${list ? "@[40rem]:ml-auto @[40rem]:max-w-[26rem]" : ""}
          `}
        >
          {/* BUY NOW */}
          <Link
            to={`/checkout?product=${product.slug}&qty=${qty}`}
            className="
              order-last inline-flex min-h-12
              w-full items-center justify-center
              gap-2 rounded-full
              bg-forest px-3
              text-[0.9375rem]
              font-semibold whitespace-nowrap
              text-white
              shadow-[0_0.5rem_1rem_-0.5rem_rgb(41_76_104/0.6)]
              transition-colors
              hover:bg-forest-dark
              @[20rem]:px-5
            "
          >
            <span>
              Buy now
              <span className="sr-only">
                {" "}
                for {qty} {unit} of {product.name}
              </span>
            </span>

            <ArrowRight
              aria-hidden="true"
              className="
                size-4 shrink-0
                transition-transform duration-300
                group-hover:translate-x-0.5
              "
            />
          </Link>

          {/* CART QUANTITY */}
          {cartItem ? (
            <div
              role="group"
              aria-label={`Cart quantity for ${product.name}`}
              className="
                flex min-h-12 w-full items-center
                overflow-hidden rounded-full
                border border-forest/40
                bg-surface
              "
            >
              <button
                type="button"
                className={`${step} bg-canvas ${
                  qty <= 1 ? "hover:text-danger" : ""
                }`}
                onClick={decrement}
                aria-label={
                  qty <= 1
                    ? `Remove ${product.name} from cart`
                    : "Decrease quantity"
                }
              >
                {qty <= 1 ? (
                  <Trash2 aria-hidden="true" className="size-4" />
                ) : (
                  <Minus aria-hidden="true" className="size-4" />
                )}
              </button>

              <label htmlFor={`${product.id}-qty`} className="sr-only">
                Quantity in cart ({unit})
              </label>

              <input
                id={`${product.id}-qty`}
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_QTY}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="
                  h-12 w-full min-w-8
                  border-x border-border
                  bg-surface text-center
                  text-[1rem] font-semibold
                  text-ink tabular-nums
                  [appearance:textfield]
                  focus:outline-none
                  focus-visible:bg-forest-soft/50
                  @[20rem]:w-12
                  [&::-webkit-inner-spin-button]:appearance-none
                "
              />

              <button
                type="button"
                className={`${step} bg-canvas`}
                onClick={() => setQty(qty + 1)}
                disabled={qty >= MAX_QTY}
                aria-label="Increase quantity"
              >
                <Plus aria-hidden="true" className="size-4" />
              </button>
            </div>
          ) : (
            /* ADD TO CART */
            <button
              type="button"
              onClick={addToCart}
              aria-label={`Add ${product.name} to cart`}
              className="
                inline-flex min-h-12
                w-full items-center
                justify-center gap-2
                rounded-full
                border border-forest
                bg-surface px-3
                text-[0.9375rem]
                font-semibold whitespace-nowrap
                text-forest
                transition-colors
                hover:bg-forest
                hover:text-white
                @[20rem]:px-5
              "
            >
              <ShoppingBasket
                aria-hidden="true"
                className="size-[1.125rem] shrink-0"
              />

              <span>Add to cart</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
