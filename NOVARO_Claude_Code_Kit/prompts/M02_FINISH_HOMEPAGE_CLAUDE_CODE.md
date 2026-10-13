# Paste into Claude Code — M02 complete homepage

You are the senior React/Vite/TypeScript UI engineer implementing NOVARO, an ecommerce storefront for ULTRA construction-chemical products.

## Project context (already done)
- M01 passed typecheck, lint and build. `src/app/`, `src/components/{layout,ui,commerce}/`, `src/pages/{Home,ComingSoon}/`, `src/data/`, and `src/styles/tokens.css` exist.
- Existing header has responsive dialog mobile menu, accessible 2.75rem targets and 320–1920px browser testing.
- Hero uses an SVG placeholder, and categories use graphic textures. No Clerk/Supabase integration yet.
- `NOVARO_Claude_Code_Kit/` is the design and rules directory, with `docs/PROGRESS.md`.
- The new image pack in `public/images/` is concept-derived, **not official product photography**.

## Do M02 only — complete the HOME page
1. Inspect only relevant files: `src/pages/Home*`, `src/components/`, `src/data/`, tokens, `NOVARO_Claude_Code_Kit/docs/HOMEPAGE_SPEC.md`, and the design references. Do not reinitialize the app or rewrite working M01 components.
2. Replace the SVG/abstract visuals with local WebP files from `public/images/hero/` and `public/images/categories/` using maintainable mappings (update `HeroVisual` image prop / `Category.image` in `src/data/demoCategories.ts`). Add graceful fallback. Treat every crop as an illustrative placeholder, not an official product photograph.
3. Complete the remaining homepage sections, in order, matching `design-references/` and the approved NOVARO forest-green/cream design: **Why Choose NOVARO**, **Featured Products** (clearly labeled DEMO, illustrative cards with no fabricated prices/stock/ratings), **Solutions by Application**, **Built for Professionals** editorial banner, **Projects/Inspirations** if real content exists (otherwise labeled illustrative), **Technical Resources** (real links or clearly unavailable), **Request a Quote CTA**, and **complete Footer**. Keep existing announcement bar, header, hero and category preview.
4. Ensure functional links to implemented routes or to existing ComingSoon placeholder. Product/Cart/Sign In and quote CTAs must not pretend to be functional. No fake review testimonials, logos, 'trusted by' claims, customer counts, warranties, contact details or application performance claims.
5. Use small reusable components, semantic markup, accessible buttons/links, correct image alt descriptions, keyboard functionality and reduced-motion support. Styling: rem for fonts and spacing, mobile-first Grid/Flex and clamp(). Keep animations CSS-only for now; do not install GSAP unless truly necessary.
6. Responsive QA at 320, 360, 375, 390, 768, 1024, 1440 and 1920px: no overflow, image cropping readable, mobile category swipe behavior preserved, no banner overlap. Preserve 2.75rem minimum tap targets and 200% zoom usability as far as testing permits.
7. Run typecheck, ESLint and production build; fix only errors introduced by M02. Update `NOVARO_Claude_Code_Kit/docs/PROGRESS.md` with short accurate status.

## Token economy / scope control
Only open relevant files; avoid whole-repository dumps and repeated rereads of unchanged docs. Edit existing files surgically, skip packages and setup already done. Do not do Clerk, Supabase, checkout, cart state, API, admin, or other pages. Stop after M02 and await approval. Output only modified paths, checks, and genuine open blockers.
