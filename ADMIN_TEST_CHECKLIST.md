# Admin test checklist

Initial inventory; execution results will replace pending statuses. PASS only means the named check ran, not the entire feature is certified. No production writes permitted.

| ID | Feature / routes | Automated coverage | Status | Expected | Actual |
|---|---|---|---|---|---|
| F01 | Authentication and sessions: `/admin; /api/admin/me` | auth.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F02 | Roles and team protection: `/admin/team; roles; workspace-access; assignees` | protected-admin.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F03 | Dashboard: `/admin; overview` | admin.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F04 | Products and inventory: `/admin/products; /admin/products/:slug; products; product-status` | admin.test.ts; product-editor.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F05 | AI product photo assistant: `products/ai-generate` | aiProduct.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F06 | Categories: `/admin/categories; categories; categories/order` | admin.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F07 | Orders and tracking: `/admin/orders; /admin/orders/:orderId; /api/orders` | orders.test.ts; order-tracking.test.ts; order-view.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F08 | Project consultations: `/admin/quotes; /admin/quotes/:reference; quotes` | admin.test.ts; quotes.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F09 | Analytics: `/admin/analytics; analytics; /api/track/view` | analytics.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F10 | Customers and messages: `/admin/customers; /admin/messages; customers; messages` | admin.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F11 | CMS website/pages/settings: `/admin/website; /admin/pages; /admin/settings; cms/:page; cms/:page/revisions; /api/content` | workspace.test.ts; cms-image-sizing.test.ts; cms-caching-performance.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F12 | Media library: `/admin/media; media/:id` | workspace.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F13 | CRM and sales pipeline: `/admin/pipeline; leads/:id; leads/:id/events` | workspace.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F14 | Resources and coverage: `/admin/resources; resources; uploads; coverage` | resources.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F15 | Invitations: `/admin/team; team; invitations` | team.test.ts | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |
| F16 | Database isolation and RLS: `Supabase tables, RPCs, storage` | supabase.integration.test.ts; tests/sql/*.sql | BLOCKED | Authorized valid requests succeed; invalid/unauthorized requests fail safely | Pending sequential execution |

For every implemented page: browser happy path, loading/empty/error state, keyboard access, mobile/tablet/desktop, refresh persistence; database-backed checks remain BLOCKED without an isolated database. Unimplemented notifications/variant management must be SKIP, never PASS.
