import { z } from 'zod'

/**
 * Admin product input, shared by the admin form and the API. No relative runtime imports (serverless).
 * Lists mirror the database CHECK constraints in 20261017000100_catalog_admin.sql.
 */
export const categorySlugs = ['tile-adhesives', 'waterproofing', 'grouts-sealants', 'concrete-repair', 'flooring-solutions', 'admixtures', 'surface-treatments', 'tools-accessories'] as const
export const applicationSlugs = ['bathrooms', 'kitchens', 'roofs', 'floors', 'pools', 'exterior-walls'] as const
export const areaSlugs = ['interior', 'exterior'] as const

const blank = (v: unknown) => (v === '' || v === null ? undefined : v)
const line = (max: number) => z.string().trim().min(1).max(max)

export const productInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{1,80}$/, 'Use lowercase letters, numbers and hyphens'),
  name: z.string().trim().min(2, 'Enter a name').max(120),
  categorySlug: z.enum(categorySlugs, { error: 'Choose a category' }),
  usage: z.string().trim().min(5, 'Enter a short usage line').max(200),
  description: z.preprocess(blank, z.string().trim().max(4000).optional()),
  applications: z.array(z.enum(applicationSlugs)).max(applicationSlugs.length).default([]),
  areas: z.array(z.enum(areaSlugs)).max(2).default([]),
  benefits: z.array(line(160)).max(12).default([]),
  specifications: z.array(z.object({ label: line(60), value: line(200) })).max(30).default([]),
  packSizes: z.array(line(40)).max(12).default([]),
  coverage: z.preprocess(blank, z.string().trim().max(500).optional()),
  documents: z
    .array(
      z.object({
        title: line(120),
        // Supplier documents: HTTPS links or files hosted under /docs on this site.
        url: z.string().trim().max(500).regex(/^(https:\/\/[^\s"'<>]+|\/docs\/[A-Za-z0-9/_.-]+)$/, 'Use an https:// link or a /docs/ path'),
        fileType: z.string().trim().regex(/^[A-Za-z0-9]{1,10}$/),
      }),
    )
    .max(12)
    .default([]),
  faq: z.array(z.object({ question: line(200), answer: line(1000) })).max(12).default([]),
  image: z.preprocess(
    blank,
    z
      .object({
        src: z.string().regex(/^\/images\/[a-z0-9/_-]+\.(webp|jpe?g|png)$/, 'Use an image path under /images/'),
        alt: line(200),
        width: z.number().int().min(1).max(6000),
        height: z.number().int().min(1).max(6000),
      })
      .optional(),
  ),
  price: z.preprocess(
    blank,
    z.object({ amount: z.number().positive().max(1_000_000_000), currency: z.string().regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code') }).optional(),
  ),
  verified: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(-10000).max(10000).default(0),
})

export type ProductInput = z.input<typeof productInputSchema>
export type ProductData = z.output<typeof productInputSchema>

export const quoteStatusUpdateSchema = z.object({
  status: z.enum(['submitted', 'reviewing', 'quoted', 'closed']),
  /** Shown to the customer in their quote history. */
  note: z.preprocess(blank, z.string().trim().max(1000).optional()),
  /** Staff-only. */
  internalNotes: z.preprocess(blank, z.string().trim().max(5000).optional()),
})

export const messageStatusSchema = z.object({ status: z.enum(['new', 'read', 'closed']) })
