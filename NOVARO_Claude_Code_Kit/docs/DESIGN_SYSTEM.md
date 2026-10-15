# VELTO visual design system

## Direction
Premium architectural editorial commerce. Store brand VELTO; ULTRA Chemicals products featured using **verified real product photos** once available. Slate blue, warm ivory, graphite and muted brass accents. The Slate & Brass palette selected on 2026-10-14 supersedes the original green palette; legacy token names remain for compatibility. Concept photos are not sellable catalog assets.

## Design tokens
- Slate blue `#294C68`, deep navy `#152B40`, graphite `#202C36`
- Brass `#876329`, light canvas `#F8F8F6`, warm ivory `#F4F2EC`, sandstone `#EAE7DF`, border `#DCE1E4`, white `#FFFFFF`
- Typography: Manrope for UI, DM Serif Display for editorial headings (self-host or load efficiently; fallbacks)
- Base `1rem`, small `0.875rem`, captions `0.75rem`; h1 `clamp(2.5rem, 5vw, 4.75rem)`, h2 `clamp(1.75rem, 3vw, 2.75rem)`
- Container `min(calc(100% - 2rem), 84rem)`; gutters `clamp(1rem, 4vw, 4rem)`; section padding `clamp(3rem, 6vw, 6.5rem)`; radius `1rem`; buttons min `2.75rem`
- All authored font sizes, spacing, radii and dimensions in `rem` or relative units, except `1px` borders; responsive breakpoints can be rem. No fixed widths that cause overflow. Honor 200% text zoom.

## Breakpoints and layout
- Mobile under `48rem`: compact header, offcanvas mobile navigation, vertical hero, 2-column product grid only if legible, single column for narrow screens, swipeable categories.
- Tablet `48rem`–`64rem`: proportional hero, 2–3 columns.
- Desktop `64rem+`: high-impact 42/58 hero editorial split, horizontal categories, 4–5 product cards with readable labels.
- Check viewport widths 360, 390, 768, 1024, 1440, 1920 CSS px, reduced motion, keyboard accessibility.

## UI behavior
Accessible sticky navigation, search, wishlists, cart, dropdowns and quote CTAs. No false interactions; demo UX clearly labeled until backend is ready. Keep animations mostly CSS transitions with GSAP only where beneficial. Consistent skeleton/loading/error states. Respect `prefers-reduced-motion`.

## Premium system v2 (implemented 2026-10-13)

The descriptions below document the original palette. Current color values are defined above and in `src/styles/tokens.css`; green-named tokens now resolve to slate blue.
Source of truth: `src/styles/tokens.css`, `src/styles/global.css`, `src/components/ui/*`.

**Tokens.** Colours add `forest-deep` (#0b1f18, dark bands/footer), `forest-mid` (button gradient), `copper-soft`, `gold` (#e3c58f accent on dark) / `gold-deep`, `cream` (#f6f1e9 headers), `danger-soft`, `success`/`success-soft`. Radii: `--radius-card` 1rem (cards), `--radius-panel` 1.5rem (feature panels). Elevation: `--shadow-soft` (resting cards), `--shadow-card`, `--shadow-lift` (hover), `--shadow-float` (feature panels, toasts), `--shadow-button`. Easing: `--ease-premium` cubic-bezier(0.2,0.7,0.2,1). No existing Tailwind scale was overridden.

**Utilities.** `surface-card`, `glass` / `glass-dark`, `bg-grain` (inline SVG noise), `bg-blueprint` / `bg-blueprint-light` (3rem architectural grid), `rule-gold`, `container-wide` (108rem frame on >= 90rem), `[data-reveal]` scroll reveal (hidden only when motion is allowed), `shimmer` keyframes; global `::selection` and balanced headings.

**Components.**
- `button.ts` → `buttonClass(variant, size)`: primary (forest gradient), accent (copper), secondary, ghost, light, outline-light, danger; sizes sm/md/lg (all >= 2.75rem); `buttonArrow` nudges arrow icons. `ButtonLink` wraps it.
- `SectionHeading` (eyebrow with accent rule, optional centred alignment), `PageHeader` (cream + blueprint + gold glow, optional `aside`), `EmptyState` (ringed icon medallion), `StatCard` (KPI tile, optional link), `Reveal`, `Skeleton`, refined `Pagination`, form `inputClass` (focus halo, invalid tint), dark glass `Toaster`.
- Layout: coloured header (forest gradient, gold hairline, gold logo mark, white nav with gold active underline, light Sign In, copper "Request a Quote" CTA at >= 90rem, gold cart badge only when non-empty, shadow on scroll) under a forest-deep announcement strip; mobile menu active bar + quote CTA; footer forest-deep with blueprint, brand statement, CTAs, gold rule and outline wordmark. Admin routes render without the announcement bar and storefront footer.
- Commerce: image-led `CategoryCard` (4:5, gradient scrim, icon chip, hover arrow, copper ring when active), `ApplicationTile` with arrow medallion, `HelpBanner` as a forest-deep feature panel, `ProductCard` (roomy density on large screens, labelled DEMO prices).

**Rules.** Alternate section backgrounds (canvas / cream / white / one dark band); one feature panel per page at most; hover = lift + `shadow-lift` + border tint with `motion-reduce` fallbacks; white text only on forest/copper/ink or a dark scrim.

**Spacing system (2026-10-13).** Fluid tokens in `tokens.css` `:root`: `--section-gap` 4.5→9rem (vertical rhythm between sections), `--heading-gap` 2.25→4rem (section heading → its content), `--grid-gap` 1→1.75rem (card grids), `--grid-gap-lg` 1.5→2.5rem (card grids on md/lg+), `--content-pad` 2.5→4.5rem (page body under PageHeader), `--page-gutter` 1.25→4.5rem. Use them via `py-[var(--section-gap)]`, `mt-[var(--heading-gap)]`, `gap-[var(--grid-gap)]`; do not hand-pick new spacing values for these roles.
