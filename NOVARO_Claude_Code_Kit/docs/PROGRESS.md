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
- Migrations: applied in filename order twice on a throwaway Postgres 16 with Supabase roles — idempotent; RLS on all 9 tables; `anon`/`authenticated` denied on every table and RPC. **Correction:** the claim that `service_role` cannot update/delete `admin_audit_log`/`quote_events` held only on plain Postgres; Supabase's default privileges give `service_role` ALL — fixed by migration 6 (see Live database readiness). No policies are needed because the browser never queries Supabase.
- Live checks (read-only): Supabase project reachable, `public` schema empty (migrations NOT applied). Dev API with real keys: forged/fake tokens → 401 via real Clerk verification; foreign origin → 403; catalogue → 500 until migrations exist.
- Not yet verified live: signed-in Clerk flow end-to-end, two-user isolation and admin access on the real database (blocked on applying migrations + creating test users/admin).

## Live database readiness (2026-10-13) — superseded below: migrations applied with approval
- Live project: DB connection and `SUPABASE_URL` point to the same project ref; Postgres 17.11; roles anon/authenticated/service_role present; `public` empty (0 tables/functions/types); `auth.users` 0; storage buckets 0; no name clashes; no migration-tracking schema. Supabase default privileges grant anon/authenticated/service_role ALL on new public tables, functions and sequences.
- New migration `20261018000100_harden_privileges.sql`: revokes API-role access to identity sequences and trigger functions; resets `service_role` to exactly the grants migrations 1–5 intend, making `admin_audit_log`/`quote_events` append-only and `admin_members` read-only even for the server key. Revoke/grant only.
- New `supabase/rollback/rollback_all_pre_launch.sql`: refuses to run if any quote/message/wishlist/admin/audit row exists; otherwise drops all migration objects.
- `CatalogProvider`: seeded (unverified, unpriced) products keep the bundled, labelled DEMO price; verified DB prices win.
- Rehearsal on the local `supabase/postgres:17.11.0.002` image (same version, Supabase roles and default ACLs) + PostgREST v16.4: 6 migrations in one transaction ✔, re-run ✔, seed + re-seed (27 products) ✔; 9 tables, RLS on all, 0 policies; anon/authenticated have no table, function or sequence access; `tests/supabase.integration.test.ts` 3/3 ✔ (direct-access denials, guest + account flow, ownership isolation, wishlist, rate limits, admin RPCs + audit). service_role via REST: PATCH/DELETE audit log 403, DELETE quote_events 403, INSERT admin_members 403, SELECT 200. Rollback: refused with data present ✔; clean on seed-only ✔; re-apply after rollback ✔.
- Note: the pooler ignores `PGOPTIONS` read-only startup options; live inspection used SELECT statements only.
- Checks: typecheck ✔, oxlint ✔, 34 unit tests ✔ (integration file skips without `SUPABASE_TEST_URL`), production build ✔ — Node 24.
- Blocked on approval: apply migrations + seed to live; first admin (needs your real Clerk user ID); live signed-in two-user and admin tests.

## Live Supabase integration (2026-10-13) — applied with owner approval
- Backup: schema-only `pg_dump` (Postgres 17 tools) → `supabase/backups/pre_migration_schema_*.sql` (git-ignored, mode 600); `public` was empty.
- Applied migrations 1–6 to the live project in ONE transaction (psql exit 0), then `supabase/seed.sql` in one transaction: 27 DEMO products, all published, none verified, none priced.
- Verified live: 9 tables, RLS on all, 0 policies; anon/authenticated have no table, function or sequence privileges; service_role limited to the intended grants. Role probes (inside always-rolled-back transactions): anon/authenticated denied select/insert/self-grant-admin/RPCs; service_role denied UPDATE audit log, DELETE quote_events, INSERT admin_members. Public REST with the publishable key: 401 on all tables and admin RPCs; GraphQL extension disabled.
- Live API (dev server with production-like env): `/api/catalog` 200 with 27 products and no price fields; guest lookup with wrong code 404 (no enumeration); my quotes / quote detail / wishlist / admin without or with forged token 401; dev fake token rejected (not enabled); foreign origin 403.
- No test quotes, messages, wishlists or admins created (owner chose rehearsal + read-only live). Only side effect: 2 rate-limit counter rows (HMAC'd keys, auto-pruned).
- Write-path isolation (guest + account quotes, cross-user denial, wishlists, admin RPCs + audit) verified on the Supabase 17.11 rehearsal (3/3), not on live.
- Remaining blockers: first admin needs the owner's real Clerk user ID + approval; signed-in browser flow (Clerk token → API → DB) and two-user isolation on live need real Clerk test users; Vercel env + production Clerk keys not configured.

## Premium UI/UX redesign (2026-10-13) — awaiting approval
- Foundation: premium design system v2 (see DESIGN_SYSTEM.md) — tokens, utilities, `buttonClass`, StatCard, Reveal, Skeleton, upgraded PageHeader/SectionHeading/EmptyState/Pagination/inputs/Toaster, header/mobile menu/footer, image-led CategoryCard, ApplicationTile, HelpBanner; admin routes without marketing chrome.
- Pages redesigned: home (all sections), products (hero, category rail, toolbar, filters), product detail (BuyBox: labelled DEMO price, quantity + unit stepper → cart), cart, wishlist, checkout, quote form/sidebar/success receipt, track, sign-in/up, account shell/dashboard/quote cards, admin shell/dashboard/quotes list, about, contact, solutions, applications, resources hub, FAQ accordion, legal reading layout, 404. Remaining account/admin/resource pages received the shared card/button treatment only.
- Perf: `quantityUnits` moved to zod-free `features/quotes/units.ts` (re-exported by schema) so zod stays out of the main chunk (476 kB vs 564 kB).
- QA: typecheck, oxlint, 34 tests, production build ✔ (Node 24). Headless Chrome at 1440/390 on 15 changed routes: no overflow, broken images or console errors.
- Follow-up (same day): About layout/copy/imagery fixed; homepage hero trust bar, packshot blending (ProductCard), banner crop, inspiration grid, resources column; theme-color/color-scheme/Manrope 800; header CTA visibility bug. Remaining pages reviewed at 1440: consistent via shared system — calculator result hints and admin quote item thumbnails fixed; no rewrite needed.
- Not done: full 360/768/1024/1920 sweep of every route.

## Auth fix: false "session expired" after sign-in (2026-10-13)
- Cause: the server collapsed every Clerk verification failure (azp/origin mismatch, wrong keys, missing keys, JWKS outage, real expiry) into 401 `session_invalid` "session expired"; azp had to equal the single configured origin, and the dev API rebuilt request URLs as `http://localhost` (port dropped). Client fetched once with a possibly stale cached token.
- Fix: `server/quotes/auth.ts` classifies failures (expired / rejected / unconfigured / unavailable), always accepts the API's own request origin as azp in addition to `CLERK_AUTHORIZED_PARTIES`, and logs the failing claim (never the token). Handlers map: expired → 401 `session_invalid`; rejected → 401 `session_rejected`; unconfigured/unavailable → 503 `auth_unavailable`. `vite.config.ts` keeps host:port. `useAuthedRemote` waits for auth `loaded` and retries an expired 401 once with `getToken({ skipCache: true })`.
- Diagnostics (no secrets printed): publishable/secret keys from the same Clerk instance; clock skew 0.6 s; JWKS reachable. Browser sign-in itself not reproducible headlessly — if a rejection persists, the dev/server log line `[auth] Clerk token rejected (...)` names the exact claim.
- Tests: new `tests/auth.test.ts` (12): immediate post-login token, own-origin azp, foreign azp, expired, wrong signing key, unconfigured, status mapping, valid empty list. Suite 46/46.

## M10: Product analytics + admin refresh (2026-10-13)
- DB: `supabase/migrations/20261019000100_product_analytics.sql` — `product_view_daily` (daily aggregates), `product_view_dedup` (visitor/product/UTC-day ledger, self-pruning), `record_product_view`, `admin_product_activity`; indexes on items/quotes; service_role-only grants. Rollback script updated. **Apply the migration before deploying.**
- API: `POST /api/track/view` (always 204; bot/headless/scripted UA, cross-site and missing-fetch-metadata requests ignored; 120/IP/10 min; visitor = HMAC of IP+UA+language, nothing raw stored). `GET /api/admin/analytics?range=7d|30d|90d|all` (admin-only) aggregated in `server/admin/analytics.ts`.
- UI: `/admin/analytics` (KPIs with period deltas, daily views and quote-request charts, most viewed/requested/trending/sold rankings, sortable performance table); dashboard "Product activity"; per-product view counts in the products list; product detail sends a view after 1.5 s visible dwell. Admin gold accents → mint.
- Sales: no verified orders source exists, so every sales figure reads "No sales data"; quote requests are never counted as sales.
- QA: 11 new tests (`tests/analytics.test.ts`), suite 57/57, typecheck, oxlint, build ✔. Headless Chrome on the memory store at 360/390/768/1024/1440/1920 for dashboard/analytics/products: no overflow; real page visit counted once, repeat visit deduped.

## M11: Admin products table (2026-10-13)
- DB: `20261020000100_product_status.sql` adds `products.archived` (+ check: never archived and published; trigger un-archives on publish), `admin_set_product_status`, `admin_delete_product` (refuses products referenced by quote requests → 409, archive instead; removes wishlist entries/view stats; audited). **Apply before deploying.** Rollback updated.
- API (admin-only): `PATCH /api/admin/product-status/:slug {status: published|draft|archived}`, `DELETE /api/admin/products/:slug`. Public catalog never exposes `archived`.
- UI `/admin/products`: All/Published/Draft/Demo/Archived tabs with counts, search (name/category/slug; no SKU field exists), sortable table with real view counts, inline status select (optimistic, rolls back on error), edit/delete with native modal confirm, pagination (10), toasts, empty states; card layout below lg.
- QA: 5 new API tests (suite 62/62), typecheck, oxlint, build ✔; headless Chrome e2e at 1440/390 (status persists, tabs recount, search, delete via dialog), no overflow at 360–1920.

## M12: Admin team invitations (2026-10-13)
- DB: `20261021000100_admin_invitations.sql` — `admin_invitations` (one open invite per email, 7-day expiry) and SECURITY DEFINER functions `admin_create_invitation`, `admin_revoke_invitation`, `accept_admin_invitation`, `admin_remove_member` (never self, never the last admin). service_role stays SELECT-only on `admin_members`; all changes audited. **Apply before deploying.** Rollback updated.
- Server: `server/quotes/directory.ts` (Clerk Backend API: verified emails, sign-up invitation emails, member names; dev `dev_*` users own `<id>@example.test`). `/api/admin/me` accepts an open invite only when the user's Clerk-verified email matches exactly. Routes: `GET team`, `POST team/invites`, `DELETE team/invites/:id`, `DELETE team/members/:userId`; invites limited to 20 per admin per 10 min.
- UI: `/admin/team` (invite form, delivery notice + copy link, admins list with remove, pending invites with resend/revoke); shared `ConfirmDialog` now also used by products.
- QA: 6 new tests (suite 68/68), typecheck, oxlint, build ✔; headless Chrome flow at 1440/390 (customer refused → invite → invitee gains admin → removal revokes), no overflow 360–1440.

## M11b: Products dashboard polish (2026-10-13)
- `/admin/products`: KPI row (total, published, draft, total views), status tabs + search + category filter + sort menu, Quote requests column (all-time + 30 days from analytics), larger thumbnails with broken-image fallback, zebra rows, three-dot actions menu (Edit, View in store, Duplicate → unverified draft copy via existing create API, Delete), popover status menu with saving state. New shared `src/pages/Admin/Menu.tsx` (native popover, keyboard support). No migrations, no API changes.
- QA: 69/69 tests, typecheck, oxlint, build ✔; headless Chrome e2e at 1440/390 (filters, sort, status, duplicate, delete, Escape/focus return), no overflow 360–1920.

## M13: Resource Center (2026-10-13)
- DB (not applied live): `20261022000100_technical_resources.sql` — `technical_resources`, `product_coverage`, private `technical-resources` bucket (PDF, 20 MB, no storage policies). Rollback updated.
- API: `GET /api/resources` (published docs + coverage for verified products), `GET /api/resources/download?id=` (60 s signed URL); admin `resources` (upload ticket, CRUD, file replace/remove) and `coverage` routes. Uploads go browser → one-time signed URL; size/type re-checked from storage.
- UI: Resource Center (search, type/category filters, downloads, assistance CTA), calculator uses verified coverage → "Request N bags in a quote" (cart), product Technical Resources section, hub/home "Coming soon" removed, contact deep-link prefill, `/admin/resources`, coverage panel in product editor.
- QA: 7 new tests (76/76), typecheck, oxlint, build ✔; headless e2e (upload → publish → download → product page → calculator → quote basket), no overflow 360–1920.

## Rebrand: NOVARO → VELTO (2026-10-14)
- User-facing brand is now **VELTO** — tagline "Building Better Foundations"; new V mark in `Logo.tsx` and `public/favicon.svg`; title/meta in `index.html`; all UI/admin/CMS defaults updated.
- Unchanged by design: env vars (`NOVARO_DEV_FAKE_AUTH`), localStorage keys and window events (`novaro:*`), package name, DB/storage identifiers, the `NOVARO_Claude_Code_Kit/` folder, ULTRA manufacturer branding.
- Saved CMS content is not rewritten: one unpublished draft still mentions NOVARO; edit it in the Website Editor. Clerk email/app name must be changed in the Clerk dashboard.
