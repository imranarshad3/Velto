import { z } from 'zod'
import { applicationSlugs, areaSlugs } from './productSchema.js'

export const aiProductRequest = z.object({
  images: z.array(z.string().min(20).max(2_800_000).regex(/^[A-Za-z0-9+/]+={0,2}$/)).min(1).max(2),
  context: z.string().trim().max(1500).default(''),
  category: z.string().max(80).optional(),
}).strict()

// No operational, publication, verification, price, stock, ownership or URL fields.
export const aiProductDraftSchema = z.object({
  name: z.string().max(120),
  slug: z.string().max(80).regex(/^[a-z0-9-]*$/),
  categorySlug: z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable(),
  categoryName: z.string().max(80).optional(),
  usage: z.string().max(200),
  description: z.string().max(4000),
  applications: z.array(z.enum(applicationSlugs)).max(6),
  areas: z.array(z.enum(areaSlugs)).max(2),
  benefits: z.array(z.string().min(1).max(160)).max(12),
  specifications: z.array(z.object({ label: z.string().min(1).max(60), value: z.string().min(1).max(200) }).strict()).max(30),
  packSizes: z.array(z.string().min(1).max(40)).max(12),
  coverage: z.string().max(500),
  faq: z.array(z.object({ question: z.string().min(1).max(200), answer: z.string().min(1).max(1000) }).strict()).max(6),
  imageAlt: z.string().max(200),
  confidence: z.enum(['low', 'medium', 'high']),
  observations: z.array(z.string().max(200)).max(12),
  reviewNotes: z.array(z.string().max(200)).max(12),
  missingInformation: z.array(z.string().max(120)).max(12),
}).strict()
export type AiProductDraft = z.infer<typeof aiProductDraftSchema>
export type AiProductRequest = z.infer<typeof aiProductRequest>

export function draftFormFields(d: AiProductDraft) {
  return {
    name: d.name, slug: d.slug, categorySlug: d.categorySlug ?? '', categoryName: d.categoryName ?? '', usage: d.usage,
    description: d.description, applications: d.applications, areas: d.areas,
    benefits: d.benefits.join('\n'), specifications: d.specifications.map(s => `${s.label}: ${s.value}`).join('\n'),
    packSizes: d.packSizes.join('\n'), coverage: d.coverage,
    faq: d.faq.map(f => `${f.question} | ${f.answer}`).join('\n'), imageAlt: d.imageAlt,
  }
}

/** Only permitted draft fields; preserve current values, including edits made during the request. */
type DraftFields = Omit<ReturnType<typeof draftFormFields>, 'applications' | 'areas'> & { applications: string[]; areas: string[] }
export function mergeDraft<T extends DraftFields>(current: T, draft: AiProductDraft, replace: boolean, creating: boolean, baseline?: T): T {
  const next = { ...current }
  const fields = draftFormFields(draft)
  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    if (key === 'slug' && !creating) continue
    if (baseline && JSON.stringify(current[key]) !== JSON.stringify(baseline[key])) continue
    const value = fields[key]
    if (value.length && (replace || !current[key].length)) Object.assign(next, { [key]: value })
  }
  return next
}
