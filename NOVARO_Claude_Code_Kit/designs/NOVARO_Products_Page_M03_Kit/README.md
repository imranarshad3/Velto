# NOVARO — M03 Products Page Design & Image Pack

## IMPORTANT — install correctly
Extract this ZIP into the **Vite project root**, the folder containing `package.json`. It includes `public/images/products`, NOT `public/public/images`. If extracting elsewhere, copy the internal `public/images/products/` folder to `<project-root>/public/images/products/`.

Designs live in `designs/products-page/`. For long-lived reference storage copy the designs into `NOVARO_Claude_Code_Kit/designs/products-page/` and the M03 prompt into `NOVARO_Claude_Code_Kit/prompts/`.

## Content and image provenance
All pictures here are **concept-derived crops from earlier AI-generated NOVARO website mockups**, not separately sourced professional product photography. Some packshot crops can contain indistinct/misleading typography or imperfect logos; they are included only for design prototypes, not customer-facing final SKU images. Never infer product specs, certification, price, rating, stock or availability from the visuals.

`public/images/products/categories/`: 8 cropped category images (waterproofing, tile adhesives, grout, repair, etc.).
`public/images/products/catalog-concepts/`: 4 demo packshots, **not official product photos**; some low-resolution.
`public/images/products/hero/`: architecture and concept hero crops; prefer a clean architectural crop for readable hero text.
`public/images/products/banners/`: design concept banners. Inspect text baked into images before using; don't show banners with false stats or CTAs embedded.

The two main design references are illustrative, and include fictitious example figures/prices. Use confirmed live commercial details only. Products page should support an inquiry/quote experience without invented prices.

## Claude Code workflow
1. Ensure M02 is approved and complete.
2. Read `prompts/M03_PRODUCTS_PAGE_CLAUDE.md`.
3. Build the products route with reusable, responsive and accessible components.
4. Run checks; stop and request design approval before product details milestone.
