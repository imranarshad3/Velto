# Comprehensive Enterprise Security Audit Report

**Target Project:** VELTO Storefront & Backoffice Application  
**Audit Date:** 2026-10-16  
**Auditor:** Principal Application Security Engineer & Defensive Security Architect  
**Scope:** Full-stack codebase, API routes, authentication/authorization layers, database policies/migrations, client-side bundle, deployment configurations, and external integrations.

---

## 1. Project Security Architecture & Attack Surfaces

VELTO is a React/Vite/TypeScript storefront and management portal backed by Vercel serverless functions (`api/`) and Supabase PostgreSQL.

### 1.1 Architecture & Trust Boundaries
- **Client Tier (Untrusted):** Web browser running React SPA. Untrusted execution environment; client-side state (Zustand, localStorage, React form state) is considered untrusted evidence.
- **Identity Provider (Trusted 3rd Party):** Clerk handles user authentication and session tokens (RS256 JWTs). The browser transmits bearer tokens in `Authorization: Bearer <token>` to the API tier.
- **API Tier (Server-Mediated Trust Boundary):** Vercel Functions (`api/*`, `server/*`). All authentication is verified server-side (`@clerk/backend`). The client never connects directly to Supabase; all database transactions are server-mediated.
- **Database & Storage Tier:** Supabase PostgreSQL with strict Row Level Security (RLS) enabled on all tables. `anon` and `authenticated` roles are stripped of all table and function permissions (`REVOKE ALL`). Only the server-side `service_role` has explicit least-privilege grants. Private storage buckets (`technical-resources`) require server-signed URLs.

### 1.2 Key Attack Surfaces Evaluated
1. **Public APIs:**
   - `POST /api/quotes` (Guest & customer quote requests)
   - `POST /api/quotes/status` (Guest lookup with tracking code)
   - `POST /api/contact` (Contact messages)
   - `GET /api/catalog` (Published catalog)
   - `POST /api/track/view` (Product view tracking)
   - `GET /api/resources` & `GET /api/resources/download` (Technical document distribution)
2. **Authenticated Customer APIs:**
   - `GET /api/my/quotes`, `GET /api/my/quotes/:reference` (Customer quote history)
   - `GET /api/my/wishlist`, `PUT /api/my/wishlist` (Saved products)
   - `GET /api/orders`, `POST /api/orders` (Order tracking & COD placement)
3. **Privileged Staff / Admin APIs:**
   - `GET /api/admin/me` (Admin membership verification)
   - `/api/admin/products`, `/api/admin/product-status` (Catalog management)
   - `/api/admin/resources`, `/api/admin/coverage` (Resource center management)
   - `/api/admin/quotes`, `/api/admin/messages`, `/api/admin/customers` (CRM & consultations)
   - `/api/admin/team` (Admin invitations & member lifecycle)
   - `/api/admin/products/ai-generate` (AI vision analysis via Groq/Ollama)
   - `/api/admin/cms`, `/api/admin/media`, `/api/admin/roles`, `/api/admin/leads` (CMS/CRM workspace)
   - `GET /api/orders?admin=1`, `PATCH /api/orders` (Order fulfillment & status changes)

---

## 2. Vulnerability Findings & Classifications

### [SEC-01] HIGH — Broken Function-Level Authorization (BFLA) in `/api/orders`
- **CWE / OWASP:** CWE-285 (Improper Authorization) / OWASP API1:2023 (Broken Object Level Authorization), API5:2023 (Broken Function Level Authorization)
- **Affected File:** `api/orders.ts` (Lines 18–30)
- **Technical Root Cause:** While customer-to-customer isolation was maintained via `query.eq('clerk_user_id', auth.userId)`, the admin check for order review and modification only inspected `admin_members` table membership without validating the user's granular workspace role (`workspace_roles`). Furthermore, non-admin users sending a `PATCH /api/orders` without `?admin=1` in query params were met with an ambiguous 405 Method Not Allowed rather than strict 403 Forbidden enforcement.
- **Security Impact:** A team member assigned the restricted `editor` role (intended strictly for website content and marketing assets) could invoke `GET /api/orders?admin=1` to exfiltrate sensitive customer order records (including full names, delivery addresses, phone numbers, email addresses, and purchase histories) or issue `PATCH /api/orders` to tamper with order fulfillment statuses.
- **Remediation:** Enforced role validation against `workspace_roles`. If a user holds the `editor` role, both `GET /api/orders?admin=1` and `PATCH /api/orders` are rejected with `403 Forbidden` (`Your team role does not permit access to orders.`). Re-aligned `canAccess` to grant `orders` access to `admin` and `sales` roles only.

---

### [SEC-02] HIGH — Cross-Origin Request Forgery / Origin Bypass in API Handlers
- **CWE / OWASP:** CWE-346 (Origin Validation Error), CWE-352 (Cross-Site Request Forgery) / OWASP API8:2023 (Security Misconfiguration)
- **Affected File:** `server/quotes/handlers.ts` (Lines 93–96), `api/orders.ts` (Line 14)
- **Technical Root Cause:** The `originAllowed` check was implemented as `!origin || deps.allowedOrigins.length === 0 || deps.allowedOrigins.includes(origin)`. When `ALLOWED_ORIGINS` was not explicitly populated in environment variables (such as initial deployments or preview branches), `deps.allowedOrigins.length === 0` evaluated to `true`, causing foreign origins (e.g., `https://malicious-site.example`) to be permitted. Additionally, `api/orders.ts` split origins without trimming whitespace.
- **Security Impact:** Malicious third-party websites could forge requests on behalf of visitors or trigger unauthenticated guest mutations (e.g., automated spam quote submissions, bot contact requests, analytics poisoning) without being blocked by origin filtering.
- **Remediation:** Rewrote `originAllowed` to adhere to a deny-by-default posture. If an `Origin` header is present, it is permitted only if it exactly matches the request's own origin (`requestOrigin(request)`) or is explicitly present in `deps.allowedOrigins`. Foreign origins are denied with `403 forbidden_origin`.

---

### [SEC-03] MEDIUM — Missing Content Security Policy (CSP) & Defense-in-Depth Headers in `vercel.json`
- **CWE / OWASP:** CWE-1021 (Improper Restriction of Rendered UI Layers), CWE-319 (Cleartext Transmission) / OWASP A05:2021 (Security Misconfiguration)
- **Affected File:** `vercel.json` (Lines 13–35)
- **Technical Root Cause:** `vercel.json` contained baseline security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`) but lacked `Content-Security-Policy`, `Strict-Transport-Security` (HSTS), `Cross-Origin-Opener-Policy` (COOP), and `Cross-Origin-Resource-Policy` (CORP).
- **Security Impact:** Increased risk of clickjacking on subframes, potential downgrade attacks on insecure network connections, and lack of browser-level restrictions on unauthorized script execution or data exfiltration.
- **Remediation:** Implemented an enterprise-grade CSP policy covering Clerk, Cloudflare Turnstile, Supabase Storage, and Google Fonts. Added HSTS (`max-age=31536000; includeSubDomains; preload`), `Cross-Origin-Opener-Policy: same-origin-allow-popups`, and `Cross-Origin-Resource-Policy: same-origin`. Added `x-frame-options: DENY` and HSTS to all API responses via `server/http.ts`.

---

### [SEC-04] MEDIUM — Missing Rate Limiting on Orders API Endpoints
- **CWE / OWASP:** CWE-799 (Improper Control of Generation of Code/Rate of Requests) / OWASP API4:2023 (Unrestricted Resource Consumption)
- **Affected File:** `api/orders.ts`
- **Technical Root Cause:** Unlike quote submission and contact handlers (which utilized HMAC-keyed rate limiting against Supabase RPC `quote_rate_limit_hit`), `/api/orders` had no request-level rate limiting on `GET` or `POST`. While `place_cod_order` had a database-level daily cap of 20 orders, repeated invocations could flood database connections and acquire table transaction locks (`pg_advisory_xact_lock`).
- **Security Impact:** Resource exhaustion and Denial of Service (DoS) against Supabase database poolers and serverless execution units.
- **Remediation:** Integrated `quote_rate_limit_hit` with fixed 10-minute sliding windows across client IP and user identifiers (`ORDER_LIMITS.ordersPerUser`, `ORDER_LIMITS.ordersPerIp`, `ORDER_LIMITS.getPerUser`).

---

### [SEC-05] LOW — Overly Permissive File Permissions on Local Configuration (`.env.local`)
- **CWE / OWASP:** CWE-732 (Incorrect Permission Assignment for Critical Resource) / OWASP A01:2021 (Broken Access Control)
- **Affected File:** `.env.local`
- **Technical Root Cause:** The local configuration file `.env.local` had file permissions `0664` (`-rw-rw-r--`), allowing read access to other unprivileged local users or processes on the host.
- **Security Impact:** Potential local credential disclosure on shared multi-user workstations or shared development build runners.
- **Remediation:** Re-permissioned `.env.local` to `0600` (`-rw-------`), restricting read and write access exclusively to the file owner.

---

### [SEC-06] LOW — Hardcoded Supabase Project Identifier in Tooling Script
- **CWE / OWASP:** CWE-798 (Use of Hard-coded Credentials/Config) / OWASP A05:2021 (Security Misconfiguration)
- **Affected File:** `scripts/set-db-password.py`
- **Technical Root Cause:** Line 7 had a hardcoded Supabase project reference (`flszrsxbmddnrjhfpjnl`), disclosing infrastructure configuration in the repository.
- **Security Impact:** Information disclosure of backend cloud project IDs; script breakage if deployed to alternate environments.
- **Remediation:** Refactored `set-db-password.py` to extract project ID dynamically from `SUPABASE_URL` in `.env`, fall back to `SUPABASE_PROJECT_ID` environment variable, or prompt interactively.

---

### [SEC-07] LOW — Potential Header Parsing Issues in Signed Document Downloads
- **CWE / OWASP:** CWE-113 (Improper Neutralization of CRLF Sequences in HTTP Headers) / OWASP A03:2021 (Injection)
- **Affected Files:** `server/quotes/handlers.ts` (Line 373), `server/quotes/fileStorage.ts` (Line 48)
- **Technical Root Cause:** While in-memory downloads sanitized `doc.fileName`, the redirect download call `deps.files.downloadUrl(doc.storagePath, doc.fileName)` passed `doc.fileName` directly to Supabase Storage's `createSignedUrl({ download: fileName })`. Unfiltered characters or quotes could trigger malformed `Content-Disposition` response headers.
- **Security Impact:** Response header anomalies or file download misnaming.
- **Remediation:** Applied `fileName.replace(/[^\w.-]+/g, '_')` sanitization across both `resourceDownload` and `createSupabaseFileStorage.downloadUrl`.

---

## 3. Residual Risks & Testing Limitations

1. **Database RLS Verification in Live Environment:** Database tests in `tests/supabase.integration.test.ts` verify that RLS denies `anon` and `authenticated` roles directly via PostgREST. These tests are conditionally run when `SUPABASE_TEST_URL` and `SUPABASE_TEST_JWT_SECRET` are provided. The tests must be re-run in pre-production staging.
2. **Third-Party Service Dependence:** Authentication security depends upon Clerk's service uptime and signature verification keys. Network outages are handled safely via `503 auth_unavailable`.
3. **Turnstile Secret Enforcement:** In local environments without `TURNSTILE_SECRET_KEY`, the Turnstile check is skipped. Production deployments must ensure `TURNSTILE_SECRET_KEY` and `VITE_TURNSTILE_SITE_KEY` are both configured.
