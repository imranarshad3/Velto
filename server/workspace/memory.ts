import { randomUUID } from 'node:crypto'
import { defaultContent } from '../../src/features/cms/registry.js'
import type { ContentPage, ContentRevision, Lead, LeadEvent, Media, WorkspaceRole } from '../../src/features/cms/types.js'
import { HttpError } from '../http.js'
import type { WorkspaceStore } from './store.js'
export function createMemoryWorkspace(isAdmin: (id: string) => boolean): WorkspaceStore {
  const pages = new Map<string, ContentPage>(), roles = new Map<string, WorkspaceRole>()
  const revisions: ContentRevision[] = [], media: Media[] = [], leads: Lead[] = [], events: LeadEvent[] = []
  const clone = <T>(v: T): T => structuredClone(v)
  return {
    async role(id) { return isAdmin(id) ? roles.get(id) ?? 'admin' : null },
    async setRole(actor, id, role) { if (id === actor) throw new HttpError(409, 'self_role', 'Another administrator must change your role.'); roles.set(id, role) },
    async pages() { return clone([...pages.values()]) },
    async page(slug) { return clone(pages.get(slug) ?? null) },
    async published() { return clone(Object.fromEntries([...pages.values()].filter(p => p.published).map(p => [p.slug, p.published!]))) },
    async revisions(slug) { return clone(revisions.filter(r => r.slug === slug).slice(0, 50)) },
    async mutatePage(actor, slug, version, action, content, revisionId) {
      const page = pages.get(slug) ?? {slug, draft: defaultContent(slug), published: null, version: 0, updatedAt: null}
      if (page.version !== version) throw new HttpError(409, 'conflict', 'This page changed. Reload before saving.')
      if (action === 'restore') { const revision = revisions.find(r => r.id === revisionId && r.slug === slug); if (!revision) throw new HttpError(404, 'not_found', 'Revision not found.'); page.draft = clone(revision.content) }
      if (action === 'save' && content) page.draft = clone(content)
      if (action === 'publish') page.published = clone(page.draft)
      if (action === 'unpublish') page.published = null
      page.version++; page.updatedAt = new Date().toISOString(); pages.set(slug, page)
      revisions.unshift({id: randomUUID(), slug, content: clone(page.draft), action, actor, createdAt: page.updatedAt})
      return clone(page)
    },
    async media() { return clone(media) },
    mediaUrl(path) { return `/api/admin/media-file/${path}` },
    async addMedia(_actor, row) { const result = {...row, createdAt: new Date().toISOString()}; media.unshift(result); return clone(result) },
    async replaceMedia(_actor, id, bytes) { const row = media.find(m => m.id === id); if (!row) throw new HttpError(404, 'not_found', 'Image not found.'); row.size = bytes.length; return clone(row) },
    async updateMedia(_actor, id, metadata) { const row = media.find(m => m.id === id); if (row) Object.assign(row, metadata) },
    async deleteMedia(_actor, id) {
      const item = media.find(m => m.id === id); if (!item) throw new HttpError(404, 'not_found', 'Image not found.')
      if ([...pages.values()].some(p => JSON.stringify([p.draft, p.published]).includes(item.url)) || revisions.some(r => JSON.stringify(r.content).includes(item.url))) throw new HttpError(409, 'media_in_use', 'This image is referenced by content or revision history.')
      media.splice(media.indexOf(item), 1)
    },
    async leads() { return clone(leads) },
    async saveLead(actor, id, input) {
      const previous = leads.find(l => l.id === id)
      if (id && !previous) throw new HttpError(404, 'not_found', 'Lead not found.')
      if ((previous?.version ?? 0) !== input.version) throw new HttpError(409, 'conflict', 'This lead changed. Reload before saving.')
      const lead = {...input, id: id ?? randomUUID(), version: input.version + 1, updatedAt: new Date().toISOString()}
      if (previous) leads.splice(leads.indexOf(previous), 1, lead); else leads.unshift(lead)
      events.unshift({id: randomUUID(), leadId: lead.id, actor, action: previous ? `Updated lead · ${previous.stage} → ${lead.stage}` : 'Created lead', createdAt: lead.updatedAt})
      return clone(lead)
    },
    async leadEvents(id) { return clone(events.filter(e => e.leadId === id)) },
  }
}
