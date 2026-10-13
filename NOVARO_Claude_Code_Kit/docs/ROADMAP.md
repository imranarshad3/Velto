# NOVARO delivery roadmap — one milestone per approval

Numbering matches `PROGRESS.md` (the authoritative log). [x] = built and checked locally; "approval" = owner sign-off still pending.

- [x] M00–M01 Foundation (Vite React TS, Tailwind v4, router, tokens) + header, announcement bar, homepage hero — awaiting approval
- [x] M02 Complete homepage: categories, featured products (DEMO), benefits, applications, resources, quote CTA, footer — awaiting approval
- [x] M03 Products page: search, faceted filters, sort (incl. DEMO price), grid/list, pagination — awaiting approval
- [x] M04 Product details: gallery/lightbox, application areas, related products, 404 — awaiting approval
- [x] M05 Request Quote: validated form, server API, guest tracking, rate limits, security tests — awaiting approval
- [x] M06 Cart as quote basket, wishlist, multi-product quotes, honest blocked checkout — awaiting approval
- [x] M07 Clerk accounts: sign in/up, account dashboard, my quotes, profile, track page — awaiting approval
- [x] M08 Content and help pages: solutions, applications, about, contact (API), resources, FAQ, legal drafts — awaiting approval
- [x] M09 Admin: database catalogue, admin membership, quotes/customers/messages, audit log — awaiting approval
- [ ] Live integration: apply migrations to Supabase, first admin, Clerk origins, two-user isolation test on live services (see PROGRESS "Integration readiness")
- [ ] M10 Online checkout: verified prices, region-appropriate payment provider, server-verified orders, signed webhooks
- [ ] M11 Production QA: performance, accessibility (screen readers, 200% zoom), SEO, licensed images, real catalogue data, legal review
- [ ] M12 Production deployment on Vercel (requires approval)

**Gate:** approve each design under `designs/<slug>/` before implementing its page. Review code, tests and screenshots at each milestone. Clerk controls identity; Supabase stores application data; never duplicate customer sign-in.
