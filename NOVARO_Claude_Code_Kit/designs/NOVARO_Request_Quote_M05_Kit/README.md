# NOVARO M05 — Request Quote (Guest + Clerk + Supabase)

This is a **design and implementation instruction kit**, not a runnable backend.

## Put it in the existing project
Place this folder at `NOVARO_Claude_Code_Kit/designs/NOVARO_Request_Quote_M05_Kit/`. Keep the Vite root untouched. Do **not** copy the kit's own folders into `public/public`.

### Contents
- `designs/quote/`: full design board and desktop/mobile crops (concept mockups, not shipping UI elements).
- `docs/`: page specification, secure integration architecture, assets manifest and test plan.
- `supabase/migrations/`: PostgreSQL baseline for quote data. **Review and apply via Supabase migration workflow, not directly without review.**
- `prompts/M05_CLAUDE_CODE.md`: short implementation prompt.

### Existing NOVARO paths
Reuse `src/data/catalog.ts`, `src/features/catalog/`, `src/pages/Products/`, `src/components/commerce/`, `src/components/layout/`, `src/components/ui/` and `NOVARO_Claude_Code_Kit/docs/PROGRESS.md`. Routes: `/quote?product=<slug>` and optionally `/account/quotes`.

### Important
Mockup imagery and figures are illustrative. Real ULTRA labels, certifications, product prices, performance specs, photos and testimonies must be verified. **Do not make public quote inserts into Supabase from the browser.** Deploy a server function with server-held credentials and abuse prevention.
