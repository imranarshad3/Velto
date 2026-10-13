# M05 design specification

## Visual direction
NOVARO forest green `#173B2D`, warm ivory `#F8F6F2`, pale sand `#E9E1D5`, charcoal `#222925`, accent copper `#A8683F`. Reuse existing project tokens rather than overriding established values. Display headings: existing serif; labels/body: existing sans. All font sizes and spacing use `rem`, with `clamp()` for fluid type.

## Page sections
1. Shared announcement bar, sticky header and footer.
2. Breadcrumb Home / Request Quote, introductory editorial hero: **Let's build something stronger.** Short subheading and small project-focused photo (use existing licensed construction photo when available).
3. Two-column desktop (`minmax(0,1fr)` + supporting summary), stacked mobile. Main card: Contact, Product, Project, Delivery and Consent sections; concise field grouping, visible required labels and validation hints.
4. Preselect selected catalog product from `/quote?product=slug`; allow clear selection and multiple-line project description. Show packaging/price only when verified.
5. Fields: full name, email, phone, company optional, product slug optional, requested quantity + unit where applicable, project type optional, city/region, delivery location optional (minimize sensitive information), description, consent checkbox. Do not demand full postal address unnecessarily.
6. Optional Clerk Sign In / Sign Up. Guest submission always allowed; never block quote with Clerk modal.
7. Supporting sidebar: selected product thumbnail, response expectations **without made-up hours**, contact/help card, process steps.
8. Submission feedback: loading, field errors, global error, success with non-enumerable tracking reference, safe follow-up instructions.
9. Signed-in quotes list at `/account/quotes` only after auth is correctly integrated; states for loading/empty/error; quote statuses submitted / reviewing / quoted / closed.

## Behavior/accessibility
Native form, keyboard focus, 2.75rem touch targets, explicit focus styles, mobile no overflow at 320/375/768/1024/1440/1920; 200% zoom/reduced-motion tests. No fake customer count, prices, delivery promises or verified certifications.

## Images
The supplied PNGs are **reference mockups only** (some text is baked in). Do not insert the mockup as a page background. Reuse appropriately licensed construction photography already in `public/images/`, otherwise use subtle CSS/pattern shapes. Real product images must be supplied separately.
