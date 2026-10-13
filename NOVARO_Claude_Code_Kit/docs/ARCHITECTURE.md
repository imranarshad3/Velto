# React app architecture

## Stack
Vite + React + TypeScript (strict), React Router, Tailwind CSS v4 with design variables/custom CSS, Clerk React SDK (`@clerk/clerk-react`), Supabase JS, PostgreSQL, React Hook Form + Zod, Lucide React. Use Zustand only for genuine shared client-side cart/UI state, GSAP only where needed.

## Source tree (create during milestones, not prematurely)
```text
src/
  app/{App.tsx,router.tsx,providers.tsx}
  components/{layout,ui,commerce}/
  pages/{Home,Shop,Product,Cart,Account,Checkout,Quote,Admin}/
  features/{catalog,cart,checkout,quotes,account,admin}/
  hooks/
  lib/{supabaseClient.ts,auth.ts,format.ts}/
  data/{demoProducts.ts,demoCategories.ts}
  styles/{tokens.css,global.css}
  types/
supabase/migrations/
supabase/functions/  # sensitive server logic, once needed
```

## Authentication
Clerk manages identity, sign-in/up and sessions. Supabase **does not** manage login. The browser Supabase client obtains a Clerk session token using Clerk's supported integration (`getToken`) and forwards it via `accessToken` callback to `createClient`, per tested installed library versions. Supabase third-party Clerk provider must be configured in the dashboard. Postgres RLS must bind records to the verified Clerk subject; no client-provided user ID authority. Server-side roles and totals must be validated. See `docs/CLERK_SUPABASE_INTEGRATION.md`.

## Data and security
Public catalog read, authenticated customer orders and quotes, server-authorized admin modifications. Product payments/prices/tax/stock computed server-side with verified idempotent payment webhook, only once gateway confirmed. Do not expose Supabase service role or Clerk secret in Vite env. Deploy frontend to Vercel; protect privileged server functionality in appropriate server endpoints/Edge Functions.
