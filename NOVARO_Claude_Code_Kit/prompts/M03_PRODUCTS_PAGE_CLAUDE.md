# M03 — Premium Products Page for NOVARO

Read the main NOVARO_Claude_Code_Kit/CLAUDE.md, design system, current progress and these two M03 reference images. First finish and verify M02 if still incomplete; do not silently skip its cleanup.

Build ONLY the /products catalog page and shared UI needed for it. Reuse current header/footer, tokens, router, card patterns. NOVARO is the shop; ULTRA Chemicals is the manufacturer. Do not rename manufacturer packaging to NOVARO.

Visual references: designs/products-page/PRODUCTS_DESKTOP_MOBILE_APPROVED.png and PRODUCTS_COMPONENTS_MOBILE_REFERENCE.png. These are concept designs, not datasets; all prices, counts, reviews, claims and packaging text visible in the mockup are NON-FACTUAL. Do not copy fabricated commercial data.

Design: rich cream background, forest green actions, generous whitespace, editorial shop hero, breadcrumb, clear category navigation, desktop filter sidebar, mobile accessible filter drawer, search, sort, grid/list switch, product grid with consistent cards, paging, excellent empty/loading states, compact advice/quote CTA, responsive footer. Use CSS rem values for fonts/spacing, fluid clamp typography, accessible hit targets, reduced-motion support. Aim 320px–1920px with no overflow.

Images are already located under public/images/products/... when extracted correctly into PROJECT ROOT (not into public/). Audit assets with dimensions, never upscale tiny crops, avoid baked-in text/prices/buttons as content. Category images use cover; packshot concepts use contain and are visibly DEMO. Use true official ULTRA images only if independently provided/verified. Create neutral placeholders for remaining products rather than copying or inventing branded packages. Do not use these illustrated crops as final commerce product photos.

Behavior: typed demo catalogue, working filters/search/sort/pagination in browser; don't invent functional checkout, inventory, prices or reviews. Missing confirmed price => Request Quote. Wishlist/cart can remain disabled with honest messaging if not yet wired. Search and filters must be keyboard usable, URL query state preferred if existing router supports it.

Check no broken images, npm run build, lint, typecheck, basic mobile/desktop viewport tests. Update docs/PROGRESS.md with the actual work done. Never overwrite M02 assets. Be token efficient: inspect only relevant files, focused edits, concise report. Stop after M03.
