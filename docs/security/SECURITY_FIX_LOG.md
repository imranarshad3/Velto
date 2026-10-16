# Security Remediation & Fix Log

**Project:** VELTO Storefront & Backoffice Application  
**Execution Date:** 2026-10-16  
**Auditor / Engineer:** Principal Application Security Engineer  

This log details the security corrections implemented across the codebase, rationale, affected files, and verification test references.

---

### Fix 1: Broken Function-Level Authorization & Privilege Escalation in `/api/orders`
- **Finding ID:** `SEC-01`
- **Severity:** HIGH
- **Files Modified:**
  - `api/orders.ts`
  - `src/features/cms/permissions.ts`
- **Implementation Details:**
  1. Refactored `api/orders.ts` into a structured, injectable `createOrdersHandler` alongside standard exports (`GET`, `POST`, `PATCH`).
  2. Implemented role-based verification against `workspace_roles`. If an authenticated user holds the `editor` role, both `GET /api/orders?admin=1` and `PATCH /api/orders` return `403 Forbidden` (`Your team role does not permit access to orders.`).
  3. Ensured any non-admin attempting `PATCH /api/orders` (even without `?admin=1`) receives a strict `403 Forbidden` response rather than 405.
  4. Updated `canAccess` in `src/features/cms/permissions.ts` to grant `orders` access to `admin` and `sales` roles, explicitly excluding `editor`.
  5. Supported standard session failure responses via `sessionInvalid(auth.reason)` and local testing via `withDevAuth`.
- **Verification Tests:**
  - `tests/orders.test.ts` ("BFLA defense: blocks team member with editor role from accessing GET /api/orders?admin=1")
  - `tests/orders.test.ts` ("BFLA defense: blocks team member with editor role from calling PATCH /api/orders")
  - `tests/orders.test.ts` ("prevents non-admin customer from calling PATCH /api/orders")

---

### Fix 2: Cross-Origin Request Forgery & Default Allowlist Bypass
- **Finding ID:** `SEC-02`
- **Severity:** HIGH
- **Files Modified:**
  - `server/quotes/handlers.ts`
  - `api/orders.ts`
- **Implementation Details:**
  1. In `server/quotes/handlers.ts`, replaced permissive `!origin || deps.allowedOrigins.length === 0 || deps.allowedOrigins.includes(origin)` logic with a strict deny-by-default algorithm:
     - If no `Origin` header is provided (e.g. non-browser API call), allow.
     - If `Origin` matches the request's own origin (`requestOrigin(request)`), allow.
     - If `Origin` is explicitly included in `deps.allowedOrigins`, allow.
     - Otherwise, reject with `403 forbidden_origin`.
  2. In `api/orders.ts`, normalized and trimmed origins from `ALLOWED_ORIGINS` and enforced matching against `url.origin` and the allowlist.
- **Verification Tests:**
  - `tests/quotes.test.ts` ("blocks disallowed browser origins even when allowedOrigins is unconfigured")
  - `tests/quotes.test.ts` ("blocks disallowed browser origins")
  - `tests/orders.test.ts` ("blocks disallowed cross-browser origins on mutations")

---

### Fix 3: Enterprise Browser Security Headers & Content Security Policy (CSP)
- **Finding ID:** `SEC-03`
- **Severity:** MEDIUM
- **Files Modified:**
  - `vercel.json`
  - `server/http.ts`
- **Implementation Details:**
  1. Configured strict Content Security Policy in `vercel.json` restricting scripts, frames, workers, connect destinations, fonts, and images to required domains (Clerk, Cloudflare Turnstile, Supabase Storage, Google Fonts).
  2. Added `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` to `vercel.json`.
  3. Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` and `Cross-Origin-Resource-Policy: same-origin` to `vercel.json`.
  4. Restricted Permissions Policy to `camera=(), microphone=(), geolocation=(), payment=()`.
  5. Updated `baseHeaders` in `server/http.ts` to include `x-frame-options: DENY` and HSTS across all API responses.
- **Verification Tests:**
  - Production build and routing validation.

---

### Fix 4: Request Rate Limiting on Orders API
- **Finding ID:** `SEC-04`
- **Severity:** MEDIUM
- **Files Modified:**
  - `api/orders.ts`
- **Implementation Details:**
  1. Integrated `quote_rate_limit_hit` with fixed 10-minute sliding windows (600s).
  2. Applied limits on `POST /api/orders`: `ORDER_LIMITS.ordersPerIp` (60) and `ORDER_LIMITS.ordersPerUser` (30).
  3. Applied limits on `GET /api/orders`: `ORDER_LIMITS.getPerUser` (300).
  4. Keys are securely hashed with HMAC-SHA-256 (`hmac(hashSecret, ...)`), preventing raw IP storage or disclosure.
- **Verification Tests:**
  - `tests/orders.test.ts` ("enforces rate limits on GET and POST requests")

---

### Fix 5: Environment File Permission Hardening
- **Finding ID:** `SEC-05`
- **Severity:** LOW
- **Files Modified:**
  - `.env.local`
- **Implementation Details:**
  1. Changed file permissions from `0664` to `0600` via `chmod 600 .env.local`.
- **Verification Tests:**
  - Verified with `ls -la .env*` (`-rw------- 1 net_imran net_imran`).

---

### Fix 6: Infrastructure Project ID Leak Removal in Database Utility Script
- **Finding ID:** `SEC-06`
- **Severity:** LOW
- **Files Modified:**
  - `scripts/set-db-password.py`
- **Implementation Details:**
  1. Replaced hardcoded project reference `flszrsxbmddnrjhfpjnl` with dynamic extraction from `SUPABASE_URL` in `.env`.
  2. Added fallback to `SUPABASE_PROJECT_ID` environment variable or interactive input prompt.
- **Verification Tests:**
  - Script syntax and execution verification.

---

### Fix 7: Filename Sanitization for Signed Document Downloads
- **Finding ID:** `SEC-07`
- **Severity:** LOW
- **Files Modified:**
  - `server/quotes/handlers.ts`
  - `server/quotes/fileStorage.ts`
- **Implementation Details:**
  1. Sanitized filenames using `.replace(/[^\w.-]+/g, '_')` prior to invoking `deps.files.downloadUrl` in `server/quotes/handlers.ts`.
  2. Applied the same sanitization inside `createSupabaseFileStorage.downloadUrl` in `server/quotes/fileStorage.ts`.
- **Verification Tests:**
  - `tests/resources.test.ts` (all 5 test suites passing).
