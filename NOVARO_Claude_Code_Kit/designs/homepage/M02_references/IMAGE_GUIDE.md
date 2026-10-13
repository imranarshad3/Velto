# NOVARO visual assets — usage and limitations

These are **real files** for your React project, but are cropped and upscaled from the NOVARO generated homepage *design concept*, not independently generated high-resolution photographs. Some crops can contain composite artifacts, text or fictitious packaging. **Do not represent them as genuine ULTRA product photos.** They are suitable for visual prototyping only, not final commercial product listings.

- Copy `public/images/` into the existing project `public/images/`, preserving subfolders.
- Prefer `categories/*.webp` for category placeholders and `hero/hero-architecture.webp` for the hero until a proper high-res original is available.
- `products/concept-product-*.webp` are illustrative only: do not attach them to purchasable products or assign product names/prices.
- `design-references/` images are for design comparison only; never render entire screenshot inside the product listing.
- Replace each concept crop with correctly licensed source photography; use real ULTRA brand imagery only with permission. Preserve filenames to avoid component changes.
- Prefer responsive `<picture>` and `object-fit:cover`, lazy-load only below-the-fold imagery and never lazy-load LCP hero image. Include meaningful alt text.

Product specifications, prices, stock, certifications, statistics, reviews, and company claims must be supplied by the store operator. Never invent them.
