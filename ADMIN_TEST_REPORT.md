# Admin panel test report

## Follow-up — 2026-10-21

Scope: live image verification, CMS, orders/tracking and admin notifications,
checkout, permissions, and the requested shorter application cards. Live checks
were read-only. Writes used disposable PostgreSQL 17/PostgREST 16.4 on loopback,
with local test identities. Storage bucket metadata was a fixture; actual Storage
uploads and real Clerk session refresh were not exercised. The application handlers
and SQL functions were real; test identity verification was injected locally.

The built-in browser verified the live images and opened the isolated CMS. The
subsequent interruption removed browser control and stopped the temporary server;
the disposable database was restarted for API/database tests. Fresh browser
recovery, notifications, checkout and card visuals are therefore BLOCKED, not PASS.

| ID | Test | Expected | Actual | Status |
|---|---|---|---|---|
| Q01 | Live All Products image | New high-resolution image loads | `/images/categories/all-products.webp`, loaded 1122×1402 | PASS |
| Q02 | Live homepage image frames | No empty bands or horizontal overflow | At 1280 viewport: Why Choose 539×926 and Professionals 512×649 matched wrappers, cover fit, no overflow | PASS |
| Q03 | CMS draft persistence/privacy | Save in DB without public exposure | Draft row stored; published null; public API omitted draft | PASS |
| Q04 | CMS stale write | Reject outdated version | 409; no overwrite | PASS |
| Q05 | CMS publish | Public API returns saved headline | Published test headline returned | PASS |
| Q06 | CMS revision/private edit | Keep revisions; new edit remains private | Revision rows present; second draft did not replace published headline | PASS |
| Q07 | CMS browser interruption/reload | Unsaved draft restored; save/publish usable | Unit recovery checks passed, but fresh browser recovery flow not executed after interruption | BLOCKED |
| Q08 | Admin new-order feed | New isolated order appears | Admin feed returned newly created order with placed status | PASS |
| Q09 | Shipment persistence | Save status, courier and tracking ID | API and DB agreed on shipped status; VT tracking ID and QA courier saved | PASS |
| Q10 | Guest tracking | Require matching contact; mask private details | Matching email returned masked view/public note; wrong contact returned 404 | PASS |
| Q11 | Order transition protection | Reject stale/backwards/closed changes | 409 stale, 422 backwards, successful delivery, 409 closed | PASS |
| Q12 | Notification UI | Toast for a newly received order; actionable new-order banner | Polling/toast implementation found and feed tested; actual browser toast/banner interaction not completed | BLOCKED |
| Q13 | Invalid checkout | Clear rejection and no order | 422 with delivery/cart guidance | PASS |
| Q14 | Tampered price | Server rejects incorrect total | 409 on total of 1 | PASS |
| Q15 | Order creation/idempotency | One DB order for repeated request key | Two requests returned 201; one row with correct customer, two grout units and total 2800 | PASS |
| Q16 | Browser checkout | Form → submit → confirmation | Isolated API flow passed; browser flow not executed | BLOCKED |
| Q17 | Admin order permissions | Guests/customers/editors denied | 401/403/403 respectively | PASS |
| Q18 | Customer isolation | Customer B cannot read A's order | Empty scoped result | PASS |
| Q19 | Editor tracking bypass | No unmasked lookup by reference alone | Initially 200 (defect B04); after fix, 422 contact-required; regression cases passed | PASS |
| Q20 | CMS write permissions | Customers and sales cannot publish | Both received 403 | PASS |
| Q21 | Direct database access | anon/authenticated cannot read protected tables | Orders, CMS pages/revisions, memberships and roles all denied via PostgREST | PASS |
| Q22 | SQL tracking regression | Database transitions, history and anon RPC access enforced | All SQL assertions passed; transaction rolled back | PASS |
| Q23 | Live unauthenticated APIs | Deny protected data without credentials | `/api/admin/cms`, `/api/admin/products`, `/api/admin/roles`, `/api/orders?admin=1`, `/api/my/quotes`: all 401 | PASS |
| Q24 | Card frame implementation | Shorter image area without stretching | 4:5 → square reduces image height by 20% at equal width; cover fit retained | PASS |
| Q25 | Card visual regression | Good subjects/layout on phone/tablet/desktop | Browser tool unavailable; no new visual pass claimed | BLOCKED |
| Q26 | TypeScript | No type errors | Node 24 typecheck passed | PASS |
| Q27 | Production build | Build completes | Vite production build passed | PASS |
| Q28 | Targeted lint | Changed source/test files pass | No lint errors/warnings in targeted files | PASS |
| Q29 | Email notifications | Deferred pending verified sender | Not enabled or sent, as requested | SKIP |

Automated evidence in `qa/admin/2026-10-21/`: `cms.tap` (10), `orders.tap`
(36), `checkout.tap` (4), `permissions.tap` (14): **64 cases, all passing**.
Run with Node 24.22.0, `--import ./tests/register.mjs --test --test-isolation=none
--test-reporter=tap` and the respective existing test files. Isolation-none was
used for explicit individual-case reporting; no new dependencies were installed.
`order-database.log` records the existing SQL regression. API/database results
above are backed by the task's executed assertions against the disposable DB.

| Metric | Result |
|---|---:|
| Total Test Cases | 93 |
| Passed | 88 |
| Failed | 0 |
| Skipped | 1 |
| Blocked | 4 |
| Fixed Bugs (verified this run) | 1 |
| Remaining Bugs (awaiting visual retest) | 1 |

Counts combine 64 automated cases and Q01–Q29 (24 PASS, 4 BLOCKED, 1 SKIP).
The first order fixture omitted `paymentMethod: cod` and correctly failed schema
validation; correcting the fixture allowed the real order flow to execute. A new
permission-error regression initially exposed an unawaited tracking promise; both
tracking callers were corrected and the complete order suite then passed.

## Historical full-admin audit

The local admin app was tested with disposable in-memory data and local fake identities. No production database, customer records, or live integrations were modified. “PASS” applies only to the stated check and environment.

| ID | Test / feature | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| A01 | Automated admin/auth/API/admin feature suite | Unit/API cases pass | 141 passed, 0 failed, 0 skipped | PASS | `qa/admin/full-suite.tap` |
| A02 | CMS draft recovery and image-sizing focused tests | Unsaved draft matches same account/page/version; fixed frame fills its container | 9 focused tests passed; image sizing validated | PASS | `qa/admin/cms-fix.tap`; `qa/admin/final-suite.tap` |
| A03 | Typecheck and production build | Supported Node 24 build completes | TypeScript and Vite build completed under Node 24.22.0 | PASS | Build output in QA session; `dist/` generated |
| A04 | Guest access to `/admin` | Redirect to sign-in | Redirect observed | PASS | Browser session, local app |
| A05 | Customer access to admin | Denied server-side/UI access | “You don’t have access” observed | PASS | Browser session, local fake customer |
| A06 | Admin dashboard load | Overview renders for admin | Dashboard rendered | PASS | Browser session, local fake admin |
| A07 | Product search with no match | Empty state, no unrelated rows | No-results state shown | PASS | Browser session |
| A08 | Product form invalid required fields | Inline validation; no save | Validation shown; no item saved | PASS | Browser session |
| A09 | Create disposable product and reload | Local save persists and appears in list | Saved and survived reload in the in-memory store | PASS | Browser session; data was local/disposable |
| A10 | Category visibility/list | Toggle/list state behaves and renders | Category list and visible state verified | PASS | Browser session |
| A11 | Quote status and internal note | Update persists and history reflects change | Status/note appeared in local quote detail/history | PASS | `qa/admin/local-quote.json`; browser session |
| A12 | Analytics filters/search | Filtered view updates without layout failure | Filter/search interaction worked | PASS | Browser session |
| A13 | Customers view | Customer data/empty state renders safely | Seeded quote customer displayed | PASS | Browser session, local memory store |
| A14 | Messages view | Empty/loading/error state is understandable | Empty state displayed | PASS | Browser session |
| A15 | CMS page inventory | Available pages are listed | Page list rendered | PASS | Browser session |
| A16 | CMS unsaved-draft recovery after reload | Draft is recovered with a clear notice | Edited headline returned after refresh; recovery notice shown | PASS | `qa/admin/cms-browser-save.json`; browser session |
| A17 | CMS explicit Save draft and reload | Saved draft persists and reports success | Draft saved in local in-memory store and remained after reload | PASS | `qa/admin/cms-browser-save.json`; browser session |
| A18 | CMS field titles | Labels explain field purpose | Why Choose fields showed eyebrow, heading, highlight, description, link destination and button label | PASS | Browser inspection |
| A19 | Why Choose image fit | Image fills the section frame without blank panel | Image loaded (935×324 intrinsic), fills its preview frame (539×723 CSS px), and renders with `object-fit: cover` | PASS | Local CMS iframe DOM/computed-style inspection; `tests/cms-image-sizing.test.ts` |
| A20 | Media library empty state | Empty state is clear and usable | Empty state displayed | PASS | Browser session |
| A21 | CRM pipeline empty state | Empty state renders without errors | Empty state displayed | PASS | Browser session |
| A22 | Resources page empty state | Empty state renders without errors | Empty state displayed | PASS | Browser session |
| A23 | Team and settings read-only review | Current permissions are understandable; no accidental invite | Pages reviewed; no invitation sent | PASS | Browser session |
| A24 | Responsive sampled screens | No horizontal overflow at 360, 390, 768, 1024, 1440, 1920 CSS px | No horizontal document overflow on sampled admin pages | PASS | Browser viewport measurements |
| A25 | CMS embedded live preview | Preview renders the current CMS draft | Preview loaded after local admin session initialization and showed the current storefront draft | PASS | Local CMS iframe DOM snapshot; image computed-style inspection |
| A26 | Orders browser page | Orders load or present a configured empty state | “Ordering is temporarily unavailable” appeared because backend is unconfigured | BLOCKED | Browser session; automated order API tests passed separately |
| A27 | Browser-based media file upload | Selected local image uploads and appears in library | CUA file chooser denied file URL permission; upload not completed in browser | BLOCKED | Browser session; do not treat as upload pass |
| A28 | Supabase database/RLS integration | Isolated test DB denies public roles and permits scoped admin operations | Test is conditional on `SUPABASE_TEST_URL` and `SUPABASE_TEST_JWT_SECRET`; credentials were absent, so DB assertions did not execute | BLOCKED | `qa/admin/supabase-integration.tap`; test source `tests/supabase.integration.test.ts` |
| A29 | Notifications admin feature | Implemented feature has working states and permissions | No separate admin notifications feature discovered | SKIP | Route/API inventory |
| A30 | Product variant management | Admin can manage variants if implemented | No admin variant management discovered | SKIP | Route/API inventory |
| A31 | Analytics “Most sold” ranking | Ranking derives from verified transaction data | UI explicitly has no verified transaction source | SKIP | Analytics UI inspection |

The manual matrix is A04-A31: 22 PASS, 3 BLOCKED, and 3 SKIP. A01-A03 are validation summaries; they are not additional unique cases.

| Metric | Result |
|---|---:|
| Total Test Cases | 169 |
| Passed | 163 |
| Failed | 0 |
| Skipped | 3 |
| Blocked | 3 |
| Fixed Bugs | 3 |
| Remaining Confirmed Bugs | 0 |

Totals include 141 automated checks and 28 manual checks. The remaining blocked checks are unresolved environment limitations rather than confirmed defects.

The Supabase integration test was first invoked without the project’s TS loader and failed to resolve a TypeScript module; rerunning with `tests/register.mjs` loaded the test successfully. The test condition skipped its database body because isolated credentials were unavailable. The default `npm run build` wrapper selected system Node 18 and failed because Vite requires the project’s Node 24 runtime. Running TypeScript and Vite directly with Node 24.22.0 succeeded.
