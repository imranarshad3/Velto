# Clerk + Supabase integration: security and implementation

> **Implemented model (2026-10-13): server-mediated access.** The browser does not create a Supabase client.
> It calls `/api/*` with `Authorization: Bearer <Clerk session token>`; `server/quotes/auth.ts` verifies the token
> (`@clerk/backend` `verifyToken`, `authorizedParties` from `CLERK_AUTHORIZED_PARTIES`) and uses only the `sub`
> claim. The server talks to Supabase with `SUPABASE_SECRET_KEY` and scopes every query to that user
> (`clerk_user_id = sub`); guests need reference + HMAC-hashed tracking code. All tables: RLS on, every privilege
> revoked from `anon`/`authenticated`, no policies — so direct requests with the publishable key reach nothing.
> Admins: `public.admin_members`, checked per request; admin writes go through RPCs that append to `admin_audit_log`.
> Supabase third-party auth is therefore **not required** today. The guidance below applies only if direct
> browser → Supabase access is introduced later (then add per-user `TO authenticated` policies and tests first).

## Authentication model
- **Clerk** is the only identity/session provider. Use `@clerk/react` with `ClerkProvider`, Clerk sign-in/sign-up components, `useAuth()`, `useUser()`, and protected route UI. **Never** implement duplicate Supabase Auth sign-up/sign-in.
- **Supabase** provides Postgres with RLS, product/inventory and account/order/quote data; storage and server-side functions as needed.
- Connect Clerk's verified session JWT to Supabase using **Supabase Auth third-party auth provider configuration for Clerk**. Do not use obsolete custom JWT-template tutorials unless current SDK/docs explicitly require them.
- Read current Clerk and Supabase documentation before implementation as configuration options and SDK signatures may change. The installed package versions and verified supported `getToken` flow are authoritative.

## One-time dashboards
1. Create Clerk app; enable email sign-in/sign-up, allowed methods, production domain and redirect URLs.
2. Create Supabase project; configure Authentication → Third-Party Auth → Clerk with the dashboard's required domain/provider information (check current UI/docs).
3. Set up `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or current project public anon key). Public browser keys only. Keep `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, webhook signing keys **server-only**, never `VITE_` prefixed. Commit `.env.example`, ignore `.env.local`.
4. Pass a *fresh Clerk session access token* to the Supabase client; do not rely on a static token captured once at initialization. Ensure the token's claims and audience/issuer match the Supabase integration settings; verify in dev.

## Example pattern (verify current installed SDK signatures)
```ts
import { createClient } from '@supabase/supabase-js';
import type { GetToken } from '@clerk/types';

export function makeSupabaseClient(getToken: GetToken) {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { accessToken: async () => (await getToken()) ?? null },
  );
}
```
Create client with `useAuth().getToken` where provider context exists; keep stable via memoization and verify token-refresh behavior. Supabase expects the JWT and RLS-compatible role/claims; diagnose integration errors rather than weakening policies.

## RLS requirements
- `profiles.clerk_user_id`, `orders.clerk_user_id`, `quotes.clerk_user_id`, etc. store the server-authenticated Clerk subject (text), unique/foreign-key appropriate.
- Policies compare to `(auth.jwt() ->> 'sub')`; use `auth.uid()` **only if** the actual Clerk subject and Supabase integration make it appropriate (Clerk user IDs are generally strings, not UUIDs).
- For users with Clerk JWTs that have Supabase-recognized `authenticated` role, use `TO authenticated` policies. Test this role/claim path; do not broaden to `anon` as workaround.
- Example read policy for customer-owned orders (run only after creating schema and verifying JWT role integration):
```sql
create policy "Customers read own orders"
on public.orders for select to authenticated
using (clerk_user_id = (auth.jwt() ->> 'sub'));
```
- `WITH CHECK` on INSERT/UPDATE must likewise verify authenticated Clerk subject, plus business validation. Customers may never assign admin roles or mutate order totals.
- Admin authorization is held server-side in a protected admin-membership table or trusted Clerk organizational roles; never let a customer set admin via editable profile metadata.
- Avoid use of service-role key for normal browser data requests. For privileged server functions, verify Clerk session with server SDK, then enforce admin roles and scoped access; RLS bypass is dangerous.

## Minimum isolation tests
- User A cannot list/view/update User B's profiles, carts, addresses, quotes, orders or files through direct Supabase requests.
- Logged-out user cannot access customer-only data.
- User cannot submit another user's Clerk ID or elevate role by modifying request body.
- Admin-only create/update/delete fails for normal signed-in users.
- Expired/rotated Clerk token refreshes without requiring full reload; logout invalidates client access.
- UI protected routes are not sufficient by themselves; database policies must enforce access.

## No production release until
JWT auth path works in browser and server, RLS is exercised with two distinct real test users, secrets are server-only, verified pricing and payments are securely implemented.
