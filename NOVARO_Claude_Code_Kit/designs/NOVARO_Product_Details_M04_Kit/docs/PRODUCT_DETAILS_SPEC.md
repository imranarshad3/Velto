# M04 — Product Detail page specification

## Route & data
- Use existing routing and catalog identifiers; a route like `/products/:slug` is appropriate only if it matches current conventions.
- Resolve product from shared M03 catalog; unknown slug => accessible 404/not-found state.
- A generic product type must not be renamed to an unverified ULTRA trade SKU. If an item is demo, label it DEMO visibly.
- Future Supabase-friendly product model: id, slug, name, category, description, images[], useCases[], benefits[], technicalSpecifications[], packSizes[], coverage, documents[], price, stock, verifiedStatus. Optional fields are optional, not mocked.

## Sections / order
1. Shared announcement and header
2. Breadcrumb with links back to Products and chosen category
3. Desktop image gallery left / details right: main image, thumbnails, zoom/lightbox, status/brand, title, short description, benefits only if present; CTA Request Quote. Missing images use clean labeled fallback.
4. Mobile gallery above detail text; sticky CTA only if it doesn't obstruct content
5. Overview, specifications, usage, coverage, packaging, documents and FAQ: render only supported content; hide empty tabs/panels rather than filling with invented material
6. Application areas from existing shared data, related items from the same catalogue, help selecting the product, shared footer
7. Request Quote: until a backend is ready, link to a clearly marked quote form/coming-soon experience or implement safe client-only form with no submission-success claim; later integrate secure server endpoint and Supabase.

## UX and quality
- Use forest green, cream, graphite; typography and spacing in rem; responsive Grid/Flex/clamp.
- desktop split ~48/52, tablet stack where appropriate, mobile single column.
- gallery packshots `object-fit: contain`; applications `object-fit: cover`; local optimized images; alt text; lazy below fold.
- Tabs keyboard accessible (or prefer navigation anchors); arrows/buttons >=2.75rem; visible focus, Escape closes lightbox; support reduced motion.
- Do not make nonfunctional wishlist, PDF download, stock/price controls, cart or quote submission appear functional.
- Preserve URL-aware M03 search/filter navigation, components, routes.

## Acceptance
- Working details navigation from M03 cards, breadcrumb back, gallery/thumbs where available, verified-detail sections, related products, mobile layout.
- Not-found and missing-data cases handled.
- Typecheck + lint + build; browser test at 320/375/768/1024/1440; no broken images/overflow. Update `NOVARO_Claude_Code_Kit/docs/PROGRESS.md`.
