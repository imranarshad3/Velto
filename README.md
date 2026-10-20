# VELTO

Construction-chemicals storefront: catalogue, product details, quote basket, multi-product quote requests,
customer accounts and a staff admin area. React + Vite + TypeScript, Tailwind CSS v4, Clerk (identity),
Supabase Postgres (data), Vercel Functions (`api/`).

Status and milestone log: `NOVARO_Claude_Code_Kit/docs/PROGRESS.md`. Plan: `NOVARO_Claude_Code_Kit/docs/ROADMAP.md`.
Project rules for Claude Code: `CLAUDE.md`.

## Requirements

- Node **>= 22.15** (`.nvmrc` pins 24; the test runner uses `module.registerHooks`). Run `nvm use` first.
- A Clerk application and a Supabase project for live data. Without them the site runs as a guest-only DEMO.

## Local setup

```bash
nvm use
npm install
cp .env.example .env      # fill in values; .env is git-ignored
npm run dev               # http://localhost:5173 (also serves /api locally)
```

See `.env.example` for every variable. Rules:

- Only `VITE_*` values reach the browser, and only public ones belong there (Clerk publishable key,
  Turnstile site key). The Vite config refuses to start if a `VITE_` name looks like a secret.
- `SUPABASE_SECRET_KEY`, `CLERK_SECRET_KEY`, `QUOTE_HASH_SECRET`, `SUPABASE_DB_URL` are server/tooling only.
- `CLERK_AUTHORIZED_PARTIES` and `ALLOWED_ORIGINS` must list the exact site origin (local: `http://localhost:5173`).

## Data and auth model

The browser never talks to Supabase directly. It calls `/api/*` with a Clerk session token; the server
verifies it (`@clerk/backend`) and scopes every query to the verified user ID. All tables have RLS enabled
and no privileges for `anon`/`authenticated`; only the server's secret key can access them. Admins are listed
in `public.admin_members` and checked on every admin request. Details:
`NOVARO_Claude_Code_Kit/docs/CLERK_SUPABASE_INTEGRATION.md`.

## Database

Apply the migrations **in filename order** (they are idempotent and safe to re-run):

```bash
for f in supabase/migrations/*.sql; do psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

1. `20261013000100_quote_requests.sql` – quotes, rate limits
2. `20261014000100_quote_items.sql` – quote line items, atomic create RPC
3. `20261015000100_accounts.sql` – quote status history, wishlists
4. `20261016000100_contact_messages.sql` – contact form
5. `20261017000100_catalog_admin.sql` – products, admin members, audit log, admin RPCs
6. `20261018000100_harden_privileges.sql` – removes Supabase default grants beyond what the server needs

Preferred: one transaction, so any error rolls everything back:
`psql "$SUPABASE_DB_URL" -1 -v ON_ERROR_STOP=1 $(for f in supabase/migrations/*.sql; do printf -- '-f %s ' "$f"; done)`

Pre-launch rollback (refuses if any customer/admin data exists): `supabase/rollback/rollback_all_pre_launch.sql`.

Demo catalogue: `supabase/seed.sql` (generate with `scripts/generate-seed.ts`). Needed until real products are
added: once Supabase is connected, quotes and wishlists only accept products published in `public.products`.
Grant the first admin manually, using a real Clerk user ID from the Clerk dashboard:
`insert into public.admin_members (clerk_user_id) values ('user_...');`

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server + local `/api` |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint |
| `npm test` | node:test security/unit tests (PostgREST integration test runs only with `SUPABASE_TEST_URL` + `SUPABASE_TEST_JWT_SECRET`) |
| `npm run build` | typecheck + production build |

## Deploying (Vercel)

`vercel.json` holds the SPA/API rewrites and security headers. Set the server variables from `.env.example` in
the Vercel project (use production Clerk keys and a fresh `QUOTE_HASH_SECRET`), and add the production domain to
Clerk's allowed origins/redirects.
