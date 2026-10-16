# Production Security Hardening & Operational Checklist

**Target:** VELTO Storefront & Backoffice Application  
**Version:** Production Readiness Baseline  

This checklist provides essential deployment verification, secret handling procedures, ongoing monitoring, and incident response guidelines.

---

## 1. Environment & Secret Configuration Safeguards

| Variable | Scope | Purpose | Production Check |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Browser | Client-side Clerk widget (`pk_live_...`) | Must NOT use test keys in production |
| `VITE_TURNSTILE_SITE_KEY` | Browser | Cloudflare Turnstile CAPTCHA widget | Must match Cloudflare site key |
| `CLERK_SECRET_KEY` | Server | Clerk token verification (`sk_live_...`) | Never prefix with `VITE_`; never commit |
| `CLERK_JWT_KEY` | Server | Optional PEM public key for networkless verification | Reduces Clerk API round-trips |
| `CLERK_AUTHORIZED_PARTIES` | Server | Valid token `azp` origins | Must be set to production domain (e.g. `https://velto.com`) |
| `ALLOWED_ORIGINS` | Server | Browser origins permitted to mutate `/api` | Must match storefront domain |
| `SUPABASE_URL` | Server | Supabase project URL (`https://<ref>.supabase.co`) | Never prefix with `VITE_` |
| `SUPABASE_SECRET_KEY` | Server | Server key bypassing RLS (`service_role` or `sb_secret_...`) | Critical secret; server-only |
| `QUOTE_HASH_SECRET` | Server | Keyed HMAC for tracking codes and rate limits | Minimum 32 random characters (`openssl rand -base64 48`) |
| `TURNSTILE_SECRET_KEY` | Server | Turnstile server-side verification secret | Required to enforce bot protections |
| `GROQ_API_KEY` | Server | Product vision analysis | Server-only; restricted budget |
| `OLLAMA_API_KEY` | Server | Fallback vision analysis | Optional; server-only |
| `NOVARO_DEV_FAKE_AUTH` | Dev Only | Local mock auth bypass | **MUST BE 0 OR UNSET IN PRODUCTION** |
| `VITE_DEV_FAKE_AUTH` | Dev Only | Local mock auth UI | **MUST BE 0 OR UNSET IN PRODUCTION** |

---

## 2. Pre-Deployment Verification Checklist

- [x] **Browser Secret Leak Check:** Build pipeline includes `assertNoBrowserSecrets()` to fail the build if any `VITE_` variable contains `SECRET`, `PRIVATE`, `PASSWORD`, `DB_URL`, or `JWT_KEY`.
- [x] **Dev Auth Disablement:** `withDevAuth` verifies `!isDeployed(env)` (`VERCEL === '1' || NODE_ENV === 'production'`) and rejects all `dev:<id>` tokens in production.
- [x] **File Permissions:** `.env` and `.env.local` set to `0600` on hosting runners.
- [x] **Security Headers:** `vercel.json` includes CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy.
- [x] **API Response Headers:** `server/http.ts` applies `x-frame-options: DENY`, `cache-control: no-store`, and HSTS on all API endpoints.
- [x] **Deny-by-Default Origin Filtering:** Foreign `Origin` headers are blocked with 403 across quotes, contact, orders, tracking, and admin APIs.
- [x] **Row Level Security (RLS):** All 19 Supabase tables have RLS enabled with `REVOKE ALL` from `anon` and `authenticated`.
- [x] **Function-Level RBAC:** Role enforcement checks `workspace_roles` server-side per request; editors are blocked from customer orders and CRM leads.

---

## 3. Credential Rotation Procedures

### 3.1 Clerk Secret Key Rotation
1. In Clerk Dashboard → API Keys, generate a new secret key.
2. In Vercel Project Settings → Environment Variables, update `CLERK_SECRET_KEY`.
3. Trigger a redeploy of the Vercel Functions.
4. Verify admin and customer sign-in flows.
5. In Clerk Dashboard, revoke the old secret key.

### 3.2 Supabase Service Role Key Rotation
1. In Supabase Dashboard → Project Settings → API, rotate the service role key.
2. Update `SUPABASE_SECRET_KEY` in Vercel.
3. Redeploy Vercel Functions.
4. Verify catalog loading, quote submissions, and admin dashboard.

### 3.3 Quote Hash Secret Rotation
1. Generate a new secret: `openssl rand -base64 48`.
2. Update `QUOTE_HASH_SECRET` in Vercel.
3. *Note:* Rotating `QUOTE_HASH_SECRET` resets active rate limit buckets and invalidates unauthenticated guest lookup tokens minted under the previous secret. Active customer accounts are unaffected (they use Clerk sessions).

---

## 4. Ongoing Security Monitoring & Incident Response

1. **Audit Log Inspection:** Monitor `public.admin_audit_log` and `public.workspace_audit` in Supabase for unauthorized admin actions or suspicious invitation attempts.
2. **Rate Limit Alerts:** Set up log-drains in Vercel for HTTP 429 responses on `/api/quotes`, `/api/orders`, and `/api/admin/products/ai-generate`.
3. **Automated Dependency Scans:** Run `npm audit` on every pull request in CI/CD.
4. **Clerk Security Logs:** Review Clerk security audit logs for repeated session anomalies or token rejection spikes.
