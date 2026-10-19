import { validImageDimension } from './imageSizing.js'
import { z } from 'zod'
import { pageDefinitions } from './registry.js'
import { editableSections, supportsSections } from './sections.js'
import { leadStages } from './types.js'
import { safeImage, safeLink } from './safeUrl.js'
export { safeImage, safeLink }
const retiredFields = new Set(['home:FeaturedProducts.field-7'])
export const pageContentSchema = z.object({ imageSizes: z.record(z.string().max(160).regex(/^[A-Za-z0-9][A-Za-z0-9.-]*$/), z.object({ width: z.string().max(12).refine(v => validImageDimension(v, 'width')), height: z.string().max(12).refine(v => validImageDimension(v, 'height')) }).strict()).optional(), sections: z.array(z.object({ id: z.string().regex(/^custom-[a-f0-9-]{36}$/), type: z.enum(['text', 'image-text', 'cta']) }).strict()).max(20).optional(), fields: z.record(z.string().max(160), z.string().max(6000)), order: z.array(z.string()).max(40), hidden: z.array(z.string()).max(40) }).strict()
export function validContent(slug: string, input: unknown) {
  const result = pageContentSchema.safeParse(input)
  const page = pageDefinitions.find(p => p.id === slug)
  if (!result.success || !page) return null
  // Fields removed from the registry are dropped (not rejected) so content saved before the removal stays editable.
  const content = { ...result.data, fields: Object.fromEntries(Object.entries(result.data.fields).filter(([key]) => !retiredFields.has(`${slug}:${key}`))) }
  const added = content.sections ?? []
  if ((!supportsSections(slug) && added.length) || new Set(added.map(s => s.id)).size !== added.length) return null
  const sections = editableSections(page, content)
  const fields = new Map(sections.flatMap(s => s.fields.map(f => [f.key, f] as const)))
  if (Object.keys(content.imageSizes ?? {}).some(key => fields.get(key)?.kind !== 'image')) return null
  const ids = sections.map(s => s.id)
  if (content.order.length !== ids.length || new Set(content.order).size !== ids.length || content.order.some(id => !ids.includes(id))) return null
  if (new Set(content.hidden).size !== content.hidden.length || content.hidden.some(id => !ids.includes(id))) return null
  if (!page.reorder && (content.hidden.some(id => page.sections.some(s => s.id === id)) || page.sections.some((s, i) => content.order[i] !== s.id))) return null
  if (Object.entries(content.fields).some(([key, value]) => { const field = fields.get(key); return !field || (field.kind === 'link' && !safeLink(value)) || (field.kind === 'image' && !safeImage(value)) })) return null
  return content
}
export const pageMutationSchema = z.object({ action: z.enum(['save', 'publish', 'unpublish', 'restore']), version: z.number().int().min(0), content: pageContentSchema.optional(), revisionId: z.uuid().optional() }).strict()
export const leadSchema = z.object({
  name: z.string().trim().min(1).max(120), email: z.email().max(254), phone: z.string().trim().max(40), company: z.string().trim().max(150),
  stage: z.enum(leadStages), notes: z.string().max(10000), tags: z.array(z.string().trim().min(1).max(40)).max(20),
  assignedTo: z.string().regex(/^[A-Za-z0-9_]{1,64}$/).nullable(), followUp: z.iso.datetime().nullable(),
  quoteReference: z.string().regex(/^NQ-[A-F0-9]{12}$/).nullable(), version: z.number().int().min(0),
}).strict()
export const mediaSchema = z.object({ name: z.string().trim().min(1).max(120), alt: z.string().trim().max(300), folder: z.string().trim().max(60), tags: z.array(z.string().trim().min(1).max(40)).max(12) }).strict()
