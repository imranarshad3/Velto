# Storefront image and validation follow-up — 2026-10-20

Scope: the five reported homepage, Solutions, About and checkout observations,
plus shared product images and assistance banners. This is a focused follow-up,
not a new exhaustive admin/database audit. Production data was not modified.

## Confirmed defects

| Defect | Cause | Fix |
|---|---|---|
| Blank right-hand band in Why Choose | At tablet widths, a 4:3 wrapper with `height:100%` and `max-height:26rem` shrank to approximately 555px within an 888px media column | Explicit full-width wrapper, natural image height, no conflicting ratio/height cap |
| Cropped application photos | Portrait CMS uploads were forced into a landscape frame with `object-fit:cover` | Natural image proportions, captions below the image, removed hover zoom cropping |
| Blurry About/inspiration images | Source category thumbnails were 351–582px wide; several were enlarged and cropped into portrait cards | Seven new 1536×1024 illustrations; landscape About cards; versioned local URLs to invalidate cached thumbnails |
| Cropped catalog/product imagery | Cover-fit and hover enlargement clipped artwork and packaging | Contain-fit product/category cards and gallery; complete product image in lightbox |
| Difficult checkout messages | Messages described character counts and punctuation rules instead of delivery needs | Clear required-field messages, phone example, and address-completion guidance |
| Oversized contractor download | The `.webp` file contained 2,145,736 bytes of PNG data | Actual WebP encoding, same 1672×941 scene, 211,316 bytes |

## Executed browser checks

Local app: `http://localhost:5173`, with the existing CMS/catalog content loaded.
Only reads and invalid checkout submissions were performed; no order was placed.

| Case | Expected | Actual | Status |
|---|---|---|---|
| I01 — Home responsive framing | No horizontal overflow; complete Why Choose image; no unused right band | At widths 360/390/768/1024/1440/1920, image and wrapper dimensions matched: 303×202 / 333×222 / 674×449 / 430×286 / 608×405 / 637×425. All used contain-fit and no document overflow | PASS |
| I02 — Homepage category artwork | Uploaded VELTO artwork remains intact and legible in larger cards | Uploaded sources remained unchanged; cards use contain-fit; hover does not enlarge/crop the image | PASS |
| I03 — Solutions application cards | Entire portrait and landscape images visible at all six widths | Five CMS portrait images (912×1140) and one new landscape image (1536×1024) retained their aspect ratios. No document overflow at all six widths | PASS |
| I04 — About audience images | Sharp replacement images, complete subjects, labels outside photos | Four 1536×1024 WebPs loaded. At 390px viewport each displayed at approximately 160×106; at 1006px viewport each displayed at 264×176. No document overflow across all six widths | PASS |
| I05 — Contractor banner | Real WebP loads and complete image remains visible | Browser loaded 1672×941 asset with contain-fit | PASS |
| I06 — Product gallery/lightbox | Full product image, working viewer, no mobile overflow | Loaded 1254×1254 product image; contain-fit in gallery/dialog. Open/close worked; dialog fit viewport. At 390px no horizontal overflow | PASS |
| I07 — Empty checkout | Clear required-field errors; remain on checkout | Full name, email, reachable phone, delivery address and city messages displayed; checkout URL retained | PASS |
| I08 — Invalid checkout | Practical corrective guidance | `0300-call-me` produced a phone example; `House 12` requested house/building, street and area details | PASS |

## Automated checks

- Node 24.22.0 TypeScript and production Vite build: PASS.
- Targeted tests: **14 passed, 0 failed, 0 skipped**. Image asset URL/dimension
  migration; checkout messages; CMS sizing and draft recovery. Results recorded
  in this task's command output.
- Lint: 0 errors; 11 existing warnings in unrelated admin/auth/CMS files.
- `git diff --check`: PASS.

## Limits

CMS uploads were preserved. Low-resolution details already baked into an uploaded
image cannot be recovered by CSS. Full-image placements use natural proportions
instead of saved frame heights/ratios, which otherwise reintroduce blank bands.
Other CMS image layouts retain their size/fit controls.
Illustrations are labelled as illustrative and are not verified project photos.
No production deployment, database write, email delivery, or complete accessibility
audit was performed as part of this follow-up.
