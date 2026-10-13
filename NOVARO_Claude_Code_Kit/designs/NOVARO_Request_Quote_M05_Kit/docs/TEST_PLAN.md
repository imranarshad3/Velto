# M05 acceptance plan

- Guest can submit; required fields validated; spam protection/rate limits; visible success reference, no other guest records exposed.
- Signed-in Clerk customer can submit and view only own quotes; signed-out client cannot browse quote table.
- A different Clerk identity cannot retrieve another account's quote; forged request-body user ID is ignored.
- Guest quote is not auto-linked by matching email; reclaim only after token/email verification.
- Direct Supabase anon SELECT/INSERT/UPDATE/DELETE against quote tables is rejected; test with separate anonymous and authenticated contexts.
- Fail cleanly for bogus product slug, invalid email, oversized description, rate-limited traffic, expired Clerk token, offline function.
- Form focus/error messages, Enter/keyboard control and reduced-motion.
- Typecheck, lint, production build; end-to-end test desktop/mobile 320/375/768/1024/1440/1920 plus 200% zoom.
- Confirm secrets absent from bundled JS; do not include contact PII in console logs, analytics or URLs.
