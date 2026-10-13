# NOVARO visual design system

## Direction
Premium architectural editorial commerce. Store brand NOVARO; ULTRA Chemicals products featured using **verified real product photos** once available. Soft ivory, forest green, graphite, sand and subtle bronze accents. Concept photos are not sellable catalog assets.

## Design tokens
- Forest `#173C2D`, deep `#102A21`, graphite `#171C19`
- Bronze `#A5532A`, light canvas `#F8F7F3`, sandstone `#EFE9E2`, border `#E5E1DB`, white `#FFFFFF`
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
