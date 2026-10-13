# Copy into Claude Code — first instruction

Act as a senior React + TypeScript storefront engineer. Read `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, and `docs/ROADMAP.md`. The storefront is **NOVARO**, selling **ULTRA Chemicals** products. Current visual references: `designs/homepage/NOVARO_Desktop_Homepage.png` and `NOVARO_Mobile_References.png`. Clerk will own authentication and Supabase will own application data; consult `docs/CLERK_SUPABASE_INTEGRATION.md` when reaching the auth/data milestone.

Implement **M00 ONLY**: Vite React TS, Tailwind CSS v4, CSS design tokens, React Router, accessible simple branded shell, lint/build/typecheck. Do not build other pages or configure secrets yet. Create `docs/PROGRESS.md`. Strict `rem` text/spacing/dimensions, mobile-first responsive. Summarize changes/tests in <=6 bullets; await approval.
