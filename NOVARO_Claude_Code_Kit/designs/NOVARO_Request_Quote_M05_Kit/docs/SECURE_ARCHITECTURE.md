# Security architecture — Clerk + Supabase + guest quotes

## Trust boundary
The Vite browser is untrusted. It may hold Clerk's **publishable** key and Supabase anon URL/key for RLS-restricted read scenarios, but it must **never** contain Supabase secret/service-role, Clerk secret, database passwords, SMTP secrets, or guest-token hashes.

Use a deployed HTTPS serverless endpoint (e.g., Vercel Functions), not a Vite frontend-only handler. POST `/api/quotes` should:
1. Restrict payload size, validate and normalize all fields server-side (Zod); accept only known product slugs looked up server-side.
2. Apply rate limiting by IP/risk signals and bot defense (e.g. Turnstile verification if configured); do not rely on honeypot alone.
3. Optionally authenticate the Clerk session on the server using verified Clerk middleware/session token. **Do not trust a `userId` or email from request body to assign ownership.** Guest stays allowed.
4. Create a random cryptographically strong tracking secret for guests; store only a one-way hash (`SHA-256` or keyed HMAC-SHA-256 with secret server key) in database, never raw token. Deliver raw token only once on success, preferably via verified email delivery or guarded success UI. Keep token out of URLs/analytics/logs.
5. Insert with a server-only Supabase privileged client; set `clerk_user_id` from verified auth only. Return minimal reference/status; no internal IDs, private metadata or raw database errors.
6. For signed-in accounts, implement GET `/api/my/quotes` with verified Clerk identity and server-scoped equality filtering, or Clerk token pass-through to Supabase RLS using Clerk's current supported JWT integration; **never solely filter in browser**.
7. Guest status lookup, if implemented, must require the secret or a verified email challenge, impose rate limits, and not reveal other users' information. Linking a previous guest quote to an account requires proof of guest token ownership or an explicit verified-email confirmation flow, never mere email equality.

## Database safeguards
- Quotes and quote events are private; RLS enabled; no anonymous/public SELECT/INSERT policies.
- Service-role server access bypasses RLS so MUST be confined to trusted functions with strict auth/rate limits.
- Only admin/backend operations update quote statuses; server checks admin authorization via trusted roles/claims, not user-provided flags.
- Minimize PII; define retention/deletion policy, encryption-at-rest defaults and log redaction; never store or log full submitted payloads by default.
- `updated_at` maintained by trigger; admin statuses constrain to safe values.
- Never expose raw guest hashes or internal notes in account responses.
- Use parameterized queries via Supabase client / database methods.

## Local development
Separate `.env.example` for Vite public variables and server secrets; omit actual keys. `.gitignore` `.env*` except example. Integration must be tested on the actual deployed/server runtime; Vite dev server alone doesn't execute cloud functions.
