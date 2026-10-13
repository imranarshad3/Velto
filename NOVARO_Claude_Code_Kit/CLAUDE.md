# NOVARO — Claude Code Project Instructions

Read only this file and the **current task's** linked spec, then inspect relevant existing source files. Never dump entire repo or re-read all docs each turn.

## Mission
Build a polished, usable, secure, production-oriented NOVARO construction products storefront, faithfully reflecting `NOVARO_Claude_Code_Kit/designs/homepage/NOVARO_Desktop_Homepage.png`. The mockup is directional; preserve layout, composition, colors, spacing and premium industrial feel while fixing any illegible mockup text in code. Do NOT recreate the mockup as a single image; implement real semantic responsive components.

## Identity and data isolation (critical)
Use **Clerk** for sign-in/up, sessions, user management, and auth UI. Use **Supabase PostgreSQL** for catalog, customer data, orders, quotes, and storage; never use Supabase Auth for customer sessions. **Implemented model (server-mediated):** the browser never queries Supabase. It calls `/api/*` (Vercel Functions in `api/`, logic in `server/`) with a Clerk bearer token; the server verifies it with `@clerk/backend` and takes identity only from the verified `sub`. Every table has RLS enabled with **no grants or policies for `anon`/`authenticated`**; only the server's secret key (`service_role`) can read or write, and every query is scoped to the verified user. Admin rights come from the `admin_members` table, checked server-side per request. Do not rely on `userId` provided by browser requests. Moving to direct browser access (Supabase third-party auth + per-user RLS policies) is a deliberate future change, not a default. See `NOVARO_Claude_Code_Kit/docs/CLERK_SUPABASE_INTEGRATION.md` before auth work.

## Tech
React + Vite + TypeScript, Tailwind CSS v4 (with shared CSS variables), React Router, Supabase/Postgres + Clerk authentication, Zustand only for cross-component client state, React Hook Form + Zod for validated forms, Lucide React, GSAP only for purposeful animation. Prefer few dependencies. Node >= 22.15 (`.nvmrc`: 24). Deploy to Vercel when ready.

## Hard design rules
- Body text, headings, line heights where unit-bearing, spacing, radii and layout dimensions use **rem** or percentages/fr/viewport units; no `px` authored in app CSS for font/spacing/sizing. Exception: hairline borders (`1px`) and unavoidable browser/media interfaces. Use relative `clamp()` with rem endpoints for fluid text. Do not assume 1rem is always 16px.
- Mobile-first, responsive at 360, 390, 768, 1024, 1440 and 1920 CSS-pixel viewport widths; no horizontal overflow. Tap targets >= 2.75rem. Zoom to 200% without breaking flow.
- Use semantic HTML, keyboard focus states, WCAG AA contrast, alt text, visible labels, accessible modal/menu/cart behavior, and reduced-motion support.
- Optimize images; lazy-load below fold; reserve aspect ratio to avoid CLS; use locally licensed/authorized images. Hero has priority loading.
- Do not hardcode product prices, reviews, counts, inventory, or technical claims as true. Mock values clearly marked `DEMO` until real company data is available.
- Only build the **approved page/milestone**. Reuse existing components. Avoid rewriting unrelated files or overengineering.
- Never put Supabase service role key or secret payment keys in browser. Auth checks and pricing/order validation must happen server-side, with least-privilege RLS and verified payment webhooks when backend is added.

## Delivery contract for every task
1. State one-line plan; modify only relevant files.
2. Run available build/typecheck/lint/tests relevant to changes (or state why blocked).
3. End with max 6 bullets: changed paths, result, tests, blockers, next milestone; no giant code dumps or verbose narration.
4. Do not invent tasks or initiate next milestone without approval.

## Files to consult
All docs live in `NOVARO_Claude_Code_Kit/docs/` (designs in `NOVARO_Claude_Code_Kit/designs/`). Homepage: `HOMEPAGE_SPEC.md`; auth: `CLERK_SUPABASE_INTEGRATION.md`; design tokens: `DESIGN_SYSTEM.md`; implementation: `ARCHITECTURE.md`; plan: `ROADMAP.md`; status log: `PROGRESS.md`; data policy: `CONTENT_GUARDRAILS.md`; later pages: `PAGE_REGISTRY.md`. Setup and env vars: `README.md`, `.env.example`.
