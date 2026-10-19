# Admin panel test checklist

Testing ran against the local development app with fake admin/customer identities and disposable in-memory data. No production data was changed. Statuses reflect the execution in `ADMIN_TEST_REPORT.md`; a passing automated suite verifies the listed test code, not an unconfigured live integration.

| Feature | Routes and discovered scope | Test coverage | Status |
|---|---|---|---|
| Authentication and sessions | `/admin`, sign-in/up, `/api/admin/me` | Guest redirect, customer denial, admin access, API auth and token cases | PASS (automated + browser) |
| Roles and protected access | `/admin/team`, role/workspace/assignee APIs | Protected endpoint cases; read-only team/settings review | PASS (automated + browser); invite delivery not exercised |
| Dashboard | `/admin`, overview API | Overview data, empty/error handling, admin browser render | PASS |
| Products and inventory | `/admin/products`, product detail/editor, status API | CRUD/schema, pricing, stock, validation, search, persistence in memory | PASS (no real DB writes) |
| AI product photo assistant | Product AI generation API/UI | Input and provider failure/success branches | PASS (automated); external provider not configured |
| Categories | `/admin/categories`, reorder/status APIs | Validation, reorder/visibility, empty and browser list | PASS |
| Orders and tracking | `/admin/orders`, order detail/tracking, `/api/orders` | API/auth/unit cases; browser page error state | BLOCKED for live data: no isolated order database configured |
| Quotes | `/admin/quotes`, quote detail and status/history APIs | Create/list/filter/update, internal note, validation and browser flow | PASS (memory-backed browser + automated) |
| Analytics | `/admin/analytics`, tracking API | Date/filter/range and data aggregation; browser filters | PASS; “Most sold” intentionally unavailable |
| Customers and messages | `/admin/customers`, `/admin/messages` | Auth/data API cases, browser populated/empty states | PASS (read-only sample) |
| CMS and page editor | `/admin/website`, `/admin/pages`, `/admin/settings`, CMS/revisions/content APIs | Draft/publish/revision/API tests, draft recovery and save in browser, field labels, image sizing and loaded preview | PASS |
| Media library | `/admin/media`, media API | Metadata/list/replace API tests and empty state | PASS for API/empty state; browser file picker BLOCKED by browser file-access permission |
| CRM and sales pipeline | `/admin/pipeline`, leads and event APIs | Lead API cases and browser empty state | PASS; sales conversion reporting unavailable without verified transaction source |
| Resources and coverage | `/admin/resources`, resources/uploads/coverage APIs | Validation, filtering and browser empty state | PASS |
| Invitations | `/admin/team`, invitation API | API permission/validation cases, read-only UI review | PASS for API checks; real delivery not exercised |
| Database isolation and RLS | Supabase tables, RPCs and storage policies | Integration test is conditional on `SUPABASE_TEST_URL` and `SUPABASE_TEST_JWT_SECRET` | BLOCKED: no isolated test database credentials supplied; production was not queried |
| Notifications | No separate admin notifications feature discovered | Inventory check | SKIP (not implemented/discoverable) |
| Product variants | No admin variant management feature discovered | Inventory check | SKIP (not implemented/discoverable) |
| Sales rankings | Analytics “Most sold” data source is explicitly unavailable | UI/inventory check | SKIP (not implemented) |

## Responsive sample

Admin dashboard, product/category, quote detail, analytics/customer/message/page and media screens were sampled at CSS viewport widths 360, 390, 768, 1024, 1440 and 1920. No horizontal document overflow was observed on the sampled screens. This is a responsive smoke check, not a full visual/accessibility audit of every route. Keyboard, screen-reader, contrast, zoom-200%, and performance certification remain unverified.

## Count convention

The final automated suite contains 141 passing cases. The manual browser/API matrix contains 28 additional, separately identified checks: 22 PASS, 3 BLOCKED, and 3 SKIP. Combined totals are 169 cases: 163 PASS, 0 FAIL, 3 SKIP, 3 BLOCKED. See the report for expected/actual outcomes and evidence paths.
