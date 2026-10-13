import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { defaultContent, pageDefinitions } from '../../src/features/cms/registry.js'
import { leadSchema, mediaSchema, pageMutationSchema, validContent } from '../../src/features/cms/schema.js'
import type { WorkspaceRole } from '../../src/features/cms/types.js'
import { apiError, HttpError, json, readJson } from '../http.js'
import type { DataStore } from '../quotes/store.js'
const uuid = z.uuid()
const base64 = z.string().max(2800000).regex(/^[A-Za-z0-9+/]+={0,2}$/)
const invalidImage = () => apiError(422, 'invalid_image', 'Upload a valid optimized WebP image up to 2 MB.')
/** Decoded bytes only when they form a complete WebP container within the size limit. */
function webp(value: string) {
  const bytes = Buffer.from(value, 'base64')
  return bytes.length > 2 * 1024 * 1024 || bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP' || bytes.readUInt32LE(4) + 8 !== bytes.length ? null : bytes
}
export { canAccess } from '../../src/features/cms/permissions.js'
export async function workspaceHandler(request: Request, store: DataStore, actor: string, role: WorkspaceRole, resource: string, id?: string, key?: string): Promise<Response | null> {
  const ws = store.workspace, method = request.method
  if (resource === 'workspace-access' && method === 'GET') return json({role})
  if (resource === 'assignees' && method === 'GET') {
    const team = await store.listAdminTeam()
    const members = await Promise.all(team.members.map(async m => ({id: m.clerkUserId, name: m.note ?? m.clerkUserId, role: await ws.role(m.clerkUserId)})))
    return json({members: members.filter(m => m.role === 'admin' || m.role === 'sales')})
  }
  if (resource === 'roles') {
    if (role !== 'admin') return apiError(403, 'forbidden', 'Only administrators can manage permissions.')
    if (method === 'GET') { const team = await store.listAdminTeam(); return json({members: await Promise.all(team.members.map(async m => ({...m, role: await ws.role(m.clerkUserId)})))}) }
    if (method === 'PATCH' && id) {
      const parsed = z.object({role: z.enum(['admin','editor','sales'])}).strict().parse(await readJson(request, 256))
      if (!(await store.isAdmin(id))) return apiError(404, 'not_found', 'Team member not found.')
      await ws.setRole(actor, id, parsed.role); return json({ok: true})
    }
  }
  if (resource === 'cms') {
    if (!id && method === 'GET') return json({pages: await ws.pages()})
    if (!pageDefinitions.some(p => p.id === id)) return apiError(404, 'not_found', 'Page not found.')
    if (key === 'revisions' && method === 'GET') return json({revisions: await ws.revisions(id!)})
    if (!key && method === 'GET') return json({page: await ws.page(id!) ?? {slug: id, draft: defaultContent(id!), published: null, version: 0, updatedAt: null}})
    if (!key && method === 'POST') {
      const body = pageMutationSchema.parse(await readJson(request, 256 * 1024))
      let content = null
      if (body.action === 'save') { content = validContent(id!, body.content); if (!content) return apiError(422, 'validation_failed', 'Invalid content, section order, or unsafe URL.') }
      if (body.action === 'restore' && !body.revisionId) return apiError(422, 'validation_failed', 'Choose a revision.')
      return json({page: await ws.mutatePage(actor, id!, body.version, body.action, content, body.revisionId ?? null)})
    }
  }
  if (resource === 'media') {
    if (!id && method === 'GET') return json({media: await ws.media()})
    if (!id && method === 'POST') {
      const body = z.object({metadata: mediaSchema, base64}).strict().parse(await readJson(request, 3 * 1024 * 1024))
      const bytes = webp(body.base64)
      if (!bytes) return invalidImage()
      const mediaId = randomUUID(), path = `${mediaId}.webp`
      const media = await ws.addMedia(actor, {id: mediaId, path, url: ws.mediaUrl(path), ...body.metadata, size: bytes.length}, bytes)
      return json({media}, 201)
    }
    if (id && !uuid.safeParse(id).success) return apiError(404, 'not_found', 'Image not found.')
    if (id && method === 'PUT') {
      const bytes = webp(z.object({base64}).strict().parse(await readJson(request, 3 * 1024 * 1024)).base64)
      if (!bytes) return invalidImage()
      return json({media: await ws.replaceMedia(actor, id, bytes)})
    }
    if (id && method === 'PATCH') { await ws.updateMedia(actor, id, mediaSchema.parse(await readJson(request, 4096))); return json({ok: true}) }
    if (id && method === 'DELETE') { await ws.deleteMedia(actor, id); return json({ok: true}) }
  }
  if (resource === 'leads') {
    if (!id && method === 'GET') return json({leads: await ws.leads()})
    if (id && !uuid.safeParse(id).success) return apiError(404, 'not_found', 'Lead not found.')
    if (id && key === 'events' && method === 'GET') return json({events: await ws.leadEvents(id)})
    if ((!id && method === 'POST') || (id && !key && method === 'PATCH')) {
      const data = leadSchema.parse(await readJson(request, 24000))
      if (data.assignedTo) { const assignee = await ws.role(data.assignedTo); if (assignee !== 'admin' && assignee !== 'sales') throw new HttpError(422, 'invalid_assignee', 'Assign a current sales team member or administrator.') }
      if (data.quoteReference && !(await store.adminGetQuote(data.quoteReference))) throw new HttpError(422, 'invalid_quote', 'Quote reference not found.')
      return json({lead: await ws.saveLead(actor, id ?? null, data)}, id ? 200 : 201)
    }
  }
  return null
}
