import { z } from 'zod'
import { pageDefinitions } from './registry.js'
import { leadStages } from './types.js'
export const safeLink = (value: string) => value === '' || (/^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value)) || /^#[a-zA-Z][\w-]*$/.test(value) || /^https:\/\/[^\s\\]+$/.test(value) || /^(mailto:[^\s@]+@[^\s@]+|tel:\+?[0-9 ()-]+)$/.test(value)
export const safeImage = (value: string) => value === '' || (/^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value)) || /^https:\/\/[^\s\\]+$/.test(value)
export const pageContentSchema = z.object({ fields: z.record(z.string().max(160), z.string().max(6000)), order: z.array(z.string()).max(40), hidden: z.array(z.string()).max(40) }).strict()
export function validContent(slug: string, input: unknown) {
  const result = pageContentSchema.safeParse(input)
  const page = pageDefinitions.find(p => p.id === slug)
  if (!result.success || !page) return null
  const content = result.data
  const fields = new Map(page.sections.flatMap(s => s.fields.map(f => [f.key, f] as const)))
  const ids = page.sections.map(s => s.id)
  if (content.order.length !== ids.length || new Set(content.order).size !== ids.length || content.order.some(id => !ids.includes(id))) return null
  if (new Set(content.hidden).size !== content.hidden.length || content.hidden.some(id => !ids.includes(id))) return null
  if (!page.reorder && (content.hidden.length || content.order.some((id, i) => id !== ids[i]))) return null
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
