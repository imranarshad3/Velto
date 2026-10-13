# NOVARO homepage implementation specification

**Current authoritative references:** `designs/homepage/NOVARO_Desktop_Homepage.png`, `NOVARO_Mobile_References.png`, `NOVARO_Complete_Concept.png`. These define theme, hierarchy and overall imagery. Text/labels and pictured product packaging are concepts, not factual claims.

## Required desktop sections, top to bottom
1. Dark forest announcement ribbon (no fake telephone/order figures).
2. White sticky header: NOVARO text/logo, Home, Products, Solutions, Applications, Resources, About; search, wishlist, cart, **Sign In** (Clerk) / account when signed in. Mobile menu accessible.
3. Large editorial hero: headline **Stronger Spaces. Brighter Tomorrows.**, supporting sentence describing construction solutions; actions **Shop Products** and **View Solutions**. Architectural photo / abstract construction material visual; product cluster if real product assets exist. Hide invented popularity scores and metrics.
4. Shop by category image tiles: Tile Adhesives, Waterproofing, Grouts & Sealants, Concrete Repair, Flooring Solutions, Admixtures, Surface Treatments; category counts only from database or omit.
5. Why Choose NOVARO dark forest feature band: reliable solutions, application guidance, and product discovery; avoid unsupported certifications/superlatives.
6. Featured Products grid with vetted photo, name, brief usage, verified price and add-to-cart or Request Quote. Hide unverified badge/price/rating.
7. Solutions by Application: Bathrooms, Kitchens, Roofs, Floors, Pools, Exterior Walls.
8. Projects/inspiration: only verified work; otherwise general inspiration tiles labeled as such.
9. Technical Resources: data sheets, installation guides, coverage calculator and quote help, with real destinations or clearly disabled.
10. Project advice/Request Quote CTA, newsletter only if a real opt-in flow exists, footer with navigation, policy and verified contact info.

## Functional rules
The primary storefront is NOVARO, with ULTRA chemicals featured as products. Do not swap product manufacturer identity for the store name on real packaging. Use reusable AnnouncementBar, Header, Footer, CategoryCard, ProductCard, SolutionTile, SectionHeading and QuoteCTA. Use mock data tagged DEMO until secure RLS catalog services are connected.

## Mobile
Hero copy above imagery; hide decoration at smaller widths; no overflow; menu and cart drawers keyboard usable; category swipe scrolling with visible label; two card columns if readable otherwise one; images lazy below fold.

## Acceptance
Follows current NOVARO references; layout semantic React (not a flattened image); brand and user interactions consistent; full accessibility, typecheck and build pass.
