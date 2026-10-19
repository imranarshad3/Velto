import { imageSizeStyle } from '../../features/cms/imageSizing.ts'
import { useState, type CSSProperties } from "react";
import { Link } from "react-router";
import type { Category } from "../../data/demoCategories.ts";
import { MoveRight } from "lucide-react";

/** Material-inspired placeholder textures, shown until licensed category photography exists. */
const textures: Record<Category["texture"], CSSProperties> = {
  tile: {
    background:
      "linear-gradient(90deg, transparent 47%, #a3968a 47% 53%, transparent 53%) 0 0 / 50% 50%, linear-gradient(0deg, transparent 47%, #a3968a 47% 53%, transparent 53%) 0 0 / 50% 50%, linear-gradient(135deg, #e6ded2, #c3b6a5)",
  },
  water: {
    background:
      "radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.4) 0 18%, transparent 22%) 0 0 / 22% 30%, linear-gradient(160deg, #4a8a99, #1d4b59)",
  },
  grout: {
    background:
      "repeating-linear-gradient(45deg, transparent 0 22%, #8c8173 22% 24%), linear-gradient(135deg, #ddd3c5, #b4a794)",
  },
  concrete: {
    background:
      "linear-gradient(115deg, transparent 48.5%, #57524b 49% 50%, transparent 50.5%), radial-gradient(circle, #8f897f 0 12%, transparent 16%) 0 0 / 14% 18%, linear-gradient(140deg, #bdb7ae, #8b857c)",
  },
  floor: {
    background:
      "linear-gradient(100deg, transparent 35%, rgb(255 255 255 / 0.35) 50%, transparent 65%), linear-gradient(180deg, #a6bdba, #678785)",
  },
  admix: {
    background:
      "radial-gradient(circle, #6d675f 0 10%, transparent 14%) 0 0 / 12% 16%, linear-gradient(150deg, #b0aaa1, #7a746c)",
  },
  surface: {
    background:
      "repeating-linear-gradient(100deg, rgb(255 255 255 / 0.14) 0 3%, transparent 3% 8%), linear-gradient(135deg, #e5c79e, #b98552)",
  },
  tools: {
    background:
      "radial-gradient(circle at 75% 30%, rgb(135 99 41 / 0.55) 0 18%, transparent 40%), linear-gradient(140deg, #4c514d, #262a27)",
  },
};

interface CategoryCardProps {
  category: Category;
  className?: string;
  /** Defaults to the products page filtered by this category. */
  to?: string;
  active?: boolean;
  presentation?: "overlay" | "editorial";
}

export default function CategoryCard({
  category,
  className = "",
  to,
  active = false,
  presentation = "overlay",
}: CategoryCardProps) {
  const Icon = category.icon;
  const [imageFailed, setImageFailed] = useState(false);
  const image = imageFailed ? undefined : category.image;

  if (presentation === "editorial")
    return (
      <Link
        to={to ?? `/products?category=${category.slug}`}
        aria-current={active ? "page" : undefined}
        className={`group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition-colors hover:border-forest/40 ${className}`}
      >
        <div
          className="aspect-[16/10] overflow-hidden"
          style={image ? undefined : textures[category.texture]}
        >
          {image && (
            <img
              src={image.src}
              style={imageSizeStyle(image.displaySize)}
              alt=""
              width={image.width}
              height={image.height}
              onError={() => setImageFailed(true)}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            />
          )}
        </div>
        <span className="flex flex-1 items-center justify-between gap-3 p-4">
          <span className="text-[0.9375rem] leading-snug font-bold text-forest">
            {category.name}
          </span>
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-soft text-forest transition-colors group-hover:bg-forest group-hover:text-white"
          >
            <MoveRight size={15} />
          </span>
        </span>
      </Link>
    );

  return (
    <Link
      to={to ?? `/products?category=${category.slug}`}
      aria-current={active ? "page" : undefined}
      className={`group relative isolate flex aspect-[4/5] h-full flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-forest-dark shadow-[var(--shadow-soft)] ring-offset-2 ring-offset-canvas transition-[box-shadow,transform] duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0 ${active ? "ring-2 ring-copper" : ""} ${className}`}
    >
      <div
        className="absolute inset-0 -z-10"
        style={image ? undefined : textures[category.texture]}
      >
        {/* Decorative image (alt=""): the link text already names the category. */}
        {image && (
          <img
            src={image.src}
              style={imageSizeStyle(image.displaySize)}
            alt=""
            width={image.width}
            height={image.height}
            onError={() => setImageFailed(true)}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.08]"
          />
        )}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(21_43_64/0)_30%,rgb(21_43_64/0.55)_62%,rgb(21_43_64/0.92)_100%)]"
      />
      <span
        aria-hidden="true"
        className="absolute top-2.5 left-2.5 grid size-9 place-items-center rounded-full glass-dark text-white"
      >
        <Icon className="size-[1.125rem]" />
      </span>
      {active && (
        <span className="absolute top-2.5 right-2.5 rounded-full bg-copper px-2 py-0.5 text-[0.625rem] font-bold tracking-[0.1em] text-white uppercase">
          Selected
        </span>
      )}
      <div className="flex items-end justify-between gap-2 p-3 sm:p-3.5">
        <span className="min-w-0">
          <span className="block text-[0.875rem] leading-snug font-bold text-white sm:text-[0.9375rem]">
            {category.name}
          </span>
          {category.productCount !== undefined && (
            <span className="mt-0.5 block text-[0.75rem] text-white/70">
              {category.productCount} Products
            </span>
          )}
        </span>
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 translate-x-1 place-items-center rounded-full bg-white text-forest-dark opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <MoveRight size={14} />
        </span>
      </div>
    </Link>
  );
}
