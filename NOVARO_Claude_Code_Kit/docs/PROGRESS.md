# NOVARO progress

## M00 + M01 — Foundation & homepage hero (awaiting approval, 2026-10-13)
- Stack: Tailwind v4 (`@tailwindcss/vite`), React Router, Lucide. Tokens in `src/styles/tokens.css` (`@theme`).
- Built: announcement bar, sticky header, `<dialog>` mobile menu, hero, data-gated hero stats, category preview, coming-soon route for unbuilt pages.
- Placeholders: hero is an SVG illustration and category tiles use CSS material textures until licensed photos exist (`HeroVisual image` prop / `Category.image`).
- Data policy: `heroStats` empty (hidden), category counts omitted, categories marked DEMO, no delivery/phone claims.
- Not yet: GSAP (CSS entrance motion only), Zustand (cart count static 0), Clerk, Supabase.

## M02 — Complete homepage (awaiting approval, 2026-10-13)
- Images: concept crops moved to `public/images/` (was nested in `public/public/`). Mapped via `src/data/images.ts`, `demoCategories.ts`, `demoProducts.ts`. Derived crops (`*-crop.webp`, `products/concept-pack-0N.webp`) remove baked-in mockup text, prices and stats; originals untouched. All images illustrative, with load-error fallbacks (hero → SVG, categories → texture).
- Sections added: Why Choose NOVARO, Featured Products (DEMO, no price/stock/cart), Solutions by Application + waterproofing banner, Built for Professionals, Inspiration (labelled illustrative), Technical Resources (3 "Coming soon", Quote help → #quote), Request a Quote CTA, Footer.
- Hero: concept photo replaces SVG; "Built for…" script overlay and floating card removed (overlapped the product packs).
- QA: no horizontal overflow at 320–1920px; typecheck, oxlint, build pass. Not yet tested: 200% zoom manually, screen readers.
- Open: replace concept images with licensed photos; verified catalog data, contact details, legal pages.

## M03 — Products page `/products` (awaiting approval, 2026-10-13)
- Images: all 19 M03 kit images are byte-identical to existing `public/images/` files, so none were copied (no duplicates, no nested `public/`). Reused cleaned crops: hero, category tiles, `products/concept-pack-0N.webp`, contractor banner.
- Data: `src/data/catalog.ts` — 27 DEMO generic product types (no trade names, prices, stock, ratings, pack sizes). 4 use concept packshots; the rest show a neutral "Image coming soon" placeholder. Homepage featured products now derive from it.
- Logic: `src/features/catalog/` — URL-state query (`q`, `category`, `application`, `area`, `sort`, `view`, `page`), faceted counts, sorting (featured/name/category), pagination (12/page), invalid params sanitised.
- UI: hero + breadcrumb, category nav (reuses CategoryCard with active state), sticky filter sidebar / mobile `<dialog>` drawer, search, sort, grid/list toggle, filter chips, empty state, Pagination, Shop by Application (ApplicationTile, extracted from homepage), "Need help choosing?" banner.
- No price filter/sort and no wishlist/cart/availability — no verified data exists. Request Quote links go to the ComingSoon placeholder.
- QA: typecheck, oxlint, build pass; scripted headless Chrome tests for search, filters, sort, paging, view switch, drawer focus/Escape; no overflow or broken images at 320–1920px.

## M04 — Product details `/products/:slug` (awaiting approval, 2026-10-13)
- Model: `CatalogProduct` gains `slug`, `verified` (false) and optional supplier-only fields (description, benefits, specifications, packSizes, coverage, documents, faq) — all unset; never mocked. `findProduct`, `productPath` helpers.
- Page: breadcrumb (Home › Products › Category › Product), gallery (packshot or labelled placeholder + category application photo; thumbnails, arrows, keyboard ←/→, `<dialog>` lightbox with Escape; images capped at natural size to avoid upscaling small crops), category/DEMO pills, applications + use area, Request Quote (`/quote?product=slug` → ComingSoon), Share (Web Share / copy link). Section nav (sticky desktop, scrollable chips mobile): Overview, Application Areas, then Specs/Packaging/Downloads/FAQ only if data exists — otherwise one "Technical Information" notice. Related products (same category, then shared applications), HelpBanner. Unknown slug → noindex "Product not found".
- Reuse/refactor: ProductCard title is now a stretched link to the detail page; new shared `Breadcrumb` (also used by products hero) and `HelpBanner` (extracted from ProductsAssistance). Kit concept gallery image NOT used (marked not for production).
- QA: typecheck, oxlint, build pass; headless Chrome: no overflow/broken images at 320–1920px on detail, 404, products, home; gallery/lightbox/keyboard/related/404 tests pass; M03 regression tests pass. Products view toggle raised to 2.75rem.

## M05 — Request Quote system (awaiting approval, 2026-10-13)
- Routes: `/quote?product=slug` (lazy chunk) and `/account/quotes` (lazy chunk). Header/menu use `AccountControl`: Clerk sign-in/UserButton + "My quotes" when `VITE_CLERK_PUBLISHABLE_KEY` is set; otherwise the site runs guest-only (placeholder Sign In).
- Form: React Hook Form + shared Zod schema (`src/features/quotes/schema.ts`) — contact, product (preselected from M04 catalogue; unknown slug handled), quantity + unit, project type/details, city + optional site area (no full address), consent; honeypot, timing signal, optional Turnstile. Inline errors with aria-invalid/aria-describedby, focus on first invalid field, global alert, loading state, success with reference + one-time guest tracking code (never in URL). No prices, specs, certifications or response times.
- API (Vercel web-standard functions): `POST /api/quotes`, `POST /api/quotes/status` (guest: reference + secret code), `GET /api/my/quotes` (verified Clerk user only). Shared logic in `server/quotes/` with injected deps. Clerk bearer tokens verified server-side (`@clerk/backend` verifyToken + authorizedParties); body identity fields ignored; guest tokens are 256-bit random, stored only as HMAC-SHA-256; 16 KB body cap, JSON-only, origin allow-list, Postgres-backed rate limits (HMAC'd IP/user keys); generic errors, no PII in logs; 503 when unconfigured.
- Database: `supabase/migrations/20261013000100_quote_requests.sql` (reviewed kit baseline: no pgcrypto, stricter checks, `quote_rate_limits` + `quote_rate_limit_hit()`), RLS on, all privileges revoked from anon/authenticated, no policies; server uses the Supabase secret key only.
- Config: `.env.example` (VITE_ public vs server-only secrets), `.gitignore` env files, `vercel.json` SPA rewrite + security headers, dev-only Vite middleware runs `/api` locally (`QUOTE_DEV_MEMORY_STORE=1` for a no-DB local store; ignored in production).
- Tests: `npm test` → 18 node:test security tests (guest/user isolation, forged IDs, expired session, validation, honeypot, size/type limits, rate limits, origin, Turnstile, 503, no PII leakage). Verified on local Postgres 16 with Supabase roles: anon/authenticated denied all CRUD + RPC, constraints, trigger, rate-limit fn. `tests/supabase.integration.test.ts` passed against PostgREST (set `SUPABASE_TEST_URL` + `SUPABASE_TEST_JWT_SECRET`). Browser E2E (Vite → API → PostgREST → Postgres): submit, validation, lookup, unknown slug, offline API; no overflow 320–1920px; M03/M04 regressions pass. Client bundle scanned: no secrets/server code.
- Blockers: needs real Supabase project (apply migration), Clerk app keys, `QUOTE_HASH_SECRET`, optional Turnstile keys; Clerk token verification and Vercel function bundling are untested against live services. No email notification/admin status workflow yet (statuses change only via DB/admin, future milestone).

## M06 — Cart (quote basket), wishlist, multi-product quotes (2026-10-13)
- Catalogue access centralised in `CatalogProvider`/`useCatalog()` (static DEMO source; M09 swaps in the database).
- Zustand stores: `useCart` (persisted, ≤20 items, slug + optional qty/unit, sanitised on rehydrate), `useWishlist` (persisted), toast store + `Toaster` live region; `useQuoteResult` (memory only — tracking code never persisted).
- UI: `WishlistButton`, `AddToCartButton` on product cards/detail; header counts; `/cart` (qty/unit editing, unavailable-item handling, "Request a quote for these items"), `/wishlist` (add all to cart), `/checkout` (honest blocked state: needs verified prices + payment provider; no fake payment form; `checkoutAvailable()` gate), `/quote/confirmation`.
- Quotes now carry `items[]` (≤20, unique): migration `20261014000100_quote_items.sql` adds `quote_request_items`, atomic server-only `create_quote_request()` RPC, migrates/drops M05 single-product columns idempotently. Form uses a field array, prefilled from `?product=` or `?source=cart`; submitted cart items are removed from the cart.
- Tests: 20 unit tests; PostgREST integration (incl. anon/authenticated denied on items table + RPC); upgrade path M05→M06 with data, re-runnable; browser E2E cart→quote→confirmation with DB verification; layout 320–1920 for 8 routes: no overflow.

## M07 — Accounts (2026-10-13)
- Auth context now has `mode` (`none`/`clerk`/`dev`), `user`, `signOut`. Clerk bridge uses `useAuth`/`useUser`/`useClerk`.
- Pages: `/sign-in/*`, `/sign-up/*` (Clerk `<SignIn>`/`<SignUp>` path routing, NOVARO appearance; guest-only message when Clerk unset), `/account` layout with UI guard (redirect to sign-in with `redirect_url`) + nav, Dashboard (stats, recent quotes), My quotes, Quote details (`/account/quotes/:reference`: items, project, own contact details, status history), Orders (honest empty state), Profile (Clerk `<UserProfile>`), public `/track` (guest lookup moved here).
- API: `GET /api/my/quotes/:reference` (owner-scoped, 404 otherwise), `GET/PUT /api/my/wishlist` (verified user only; unknown slugs dropped; ≤100). Migration `20261015000100_accounts.sql`: `quote_events` (history; first event created atomically), `wishlist_items`, `replace_wishlist()` — server-only like the rest. Read limits raised to 300/10 min per user.
- Wishlist sync: guest items merge into the account on sign-in; local list is tagged with its owner so another account's leftovers are never merged, and is cleared after sign-out/expired session.
- Dev-only fake auth (`VITE_DEV_FAKE_AUTH=1` + `NOVARO_DEV_FAKE_AUTH=1`, refused on Vercel/production; verified absent from the production bundle) to test account/admin UIs locally without Clerk.
- Tests: 25 unit tests (detail isolation, wishlist isolation/validation, dev-auth gating), integration on PostgREST with all migrations; E2E with two users: redirect when signed out, dashboard/list/detail/history, B cannot open A's quote, wishlist carry-over and isolation; no overflow 320–1920.

## M08 — Content & help pages (2026-10-13)
- Pages: `/solutions`, `/applications`, `/applications/:slug` (typical sequence, categories, matching products, other applications), `/about`, `/contact` (validated form → `POST /api/contact`), `/resources`, `/resources/documents` (verified documents only; honest empty state), `/resources/coverage-calculator` (arithmetic on user-entered data-sheet values), `/faq`, `/privacy`, `/terms` (drafts describing actual data handling, marked pending legal review), real 404 (noindex, search) replacing ComingSoon.
- Content rules: no company stats, dates, certifications, contact numbers/addresses, delivery promises or product performance claims. Application steps are general planning guidance with a data-sheet caveat.
- Contact backend: migration `20261016000100_contact_messages.sql` (server-only), shared Zod schema, honeypot/timing/Turnstile, rate limit 5/10 min/IP, owner only from verified session.
- Navigation: utility nav = Help/Track/Contact; footer rebuilt; removed links to unconfirmed policies (shipping & returns, dealer login).
- Fixes found by tests: page grids now use explicit `minmax(0,1fr)` columns; fieldsets `min-w-0`; calculator select width conflict.
- Tests: 27 unit tests; crawler visited 43 pages — no internal link lands on 404; contact E2E stored in Postgres; calculator arithmetic verified (5×4 m, +10%, 1.5 kg/m² × 2 coats → 66 kg, 3×25 kg packs); no overflow 320–1920 on all new pages.

## M09 — Admin & database catalogue (built; entry added retroactively 2026-10-13)
- Migration `20261017000100_catalog_admin.sql`: `products` (published catalogue, optional verified price), `admin_members`, append-only `admin_audit_log`; RPCs `admin_save_product`, `admin_update_quote`, `admin_update_message`, `admin_customers`, `admin_overview` (each writes an audit row atomically). Server-only like all other tables.
- API: single `/api/admin/*` function (vercel.json rewrite); every request needs a verified Clerk session AND an `admin_members` row (checked per request; `/api/admin/me` only reports membership). `/api/catalog` serves published products; the bundled DEMO list stays as fallback.
- UI: `/admin` dashboard, quotes (list/detail/status + customer note + internal notes), products (list/edit with Zod-validated form), customers, messages. UI guard is cosmetic; the server enforces access.

## Storefront polish (2026-10-13)
- Product card redesign; DEMO PKR prices on the bundled catalogue only (`demoPrice`, display-only, labelled DEMO, never used in cart/quote/order totals; verified DB prices take precedence). Price sort options.
- Products page: unified search/toolbar, larger cards and wider frame at >= 90rem (`container-wide`), 4 columns only from 112.5rem.

## Integration readiness (2026-10-13)
- Env: `.env` normalised to the names the code reads (`VITE_CLERK_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, …); unused `NEXT_PUBLIC_*` duplicate removed; DB connection string renamed `SUPABASE_DB_URL` (tooling only); local `QUOTE_HASH_SECRET` generated; local origins set; file mode 600. `.env.example` documents every variable.
- Guards: Vite config refuses secret-looking `VITE_` names; server logs an error in production if `CLERK_AUTHORIZED_PARTIES`/`ALLOWED_ORIGINS` are empty. Production bundle scanned: no server secret values present.
- Node: `.nvmrc` (24) + `engines >= 22.15` — Node 18 fails the build (rolldown) and tests (`module.registerHooks`).
- Migrations: applied in filename order twice on a throwaway Postgres 16 with Supabase roles — idempotent; RLS on all 9 tables; `anon`/`authenticated` denied on every table and RPC; `service_role` cannot update/delete `admin_audit_log` or `quote_events`. No policies are needed because the browser never queries Supabase.
- Live checks (read-only): Supabase project reachable, `public` schema empty (migrations NOT applied). Dev API with real keys: forged/fake tokens → 401 via real Clerk verification; foreign origin → 403; catalogue → 500 until migrations exist.
- Not yet verified live: signed-in Clerk flow end-to-end, two-user isolation and admin access on the real database (blocked on applying migrations + creating test users/admin).
