# Admin bug report

## Confirmed defects and retests

| ID | Severity | Defect | Fix | Retest |
|---|---|---|---|---|
| B01 | P2 | The CMS page loader depended on the Clerk `getToken` function identity. A token refresh could rerun the load effect, replace the working draft, and discard unsaved edits. | Keep the latest token getter in a ref and load only when the page/account key changes. Persist dirty drafts locally by account/page and server revision; restore valid drafts after reload and clear them after save. | Browser: edited headline recovered after refresh and explicit draft save persisted in the local isolated store. Unit tests cover same-version recovery, other-account/version isolation, clear and corrupt-storage behavior. PASS. |
| B02 | P2 | Arbitrary stored CMS image width/height could constrain the Why Choose brand-story image, leaving a blank panel in the selected area. | Force that image to fill its fixed art-directed frame; show the editor a note explaining automatic frame fill instead of misleading size controls. | Unit test verifies full-width/full-height frame style. Fresh local browser check confirmed the image loaded, occupied its frame, and used `object-fit: cover`. PASS. |
| B03 | P3 | Generic CMS labels such as `field-1` and `To:` did not explain which content or action they changed. | Map known fields to labels such as eyebrow, main heading, highlight, section description, image description, button label and destination; label collection fields by item and purpose. | Browser inspection confirmed clear Why Choose labels and Hero image notice. PASS. |

## Remaining verification blockers

These are not confirmed product defects because the required test environment or browser capability was unavailable:

- **Orders data page:** local backend is unconfigured and shows “Ordering is temporarily unavailable.” Unit/API cases pass, but database-backed page behavior was not exercised.
- **Media file selection:** the browser automation layer denied access to local file URLs, so a real browser file upload was not completed. API/media metadata cases passed.
- **Supabase/RLS:** no isolated Supabase test URL/JWT was supplied. Production was not queried or modified; the conditional integration assertions did not execute.

## Summary

Fixed bugs: 3. Remaining confirmed bugs: 0. Remaining blocked verification items: 3. Unimplemented items (notifications, product variants, verified sales rankings) are documented as SKIP in the checklist and are not reported as passing.
