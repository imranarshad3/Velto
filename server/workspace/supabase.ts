import type { SupabaseClient } from '@supabase/supabase-js'
import { HttpError } from '../http.js'
import type { ContentPage, ContentRevision, Lead, LeadEvent, Media, WorkspaceRole } from '../../src/features/cms/types.js'
import type { WorkspaceStore } from './store.js'
function check(error: {code?: string; message: string} | null) {
  if (!error) return
  if (error.code === 'P0001') throw new HttpError(409, 'conflict', error.message)
  if (error.code === '42P01' || error.code === 'PGRST202' || error.code === 'PGRST205') throw new HttpError(503, 'migration_required', 'The CMS/CRM migration needs administrator approval and installation.')
  throw new Error(error.message)
}
const page = (r: Record<string, unknown>) => ({slug: r.slug, draft: r.draft, published: r.published, version: r.version, updatedAt: r.updated_at}) as ContentPage
export function createSupabaseWorkspace(db: SupabaseClient): WorkspaceStore {
  const bucket = db.storage.from('website-media')
  return {
    async role(userId) {
      const member = await db.from('admin_members').select('clerk_user_id, super_admin').eq('clerk_user_id', userId).maybeSingle(); check(member.error)
      if (!member.data) return null
      if (member.data.super_admin) return 'admin'
      const result = await db.from('workspace_roles').select('role').eq('clerk_user_id', userId).maybeSingle()
      // Existing administrators retain access until the optional migration is approved.
      if (result.error && ['42P01','PGRST205'].includes(result.error.code)) return 'admin'
      check(result.error); return result.data?.role as WorkspaceRole ?? 'admin'
    },
    async setRole(actor, userId, role) { const r = await db.rpc('workspace_set_role', {p_actor: actor, p_user: userId, p_role: role}); check(r.error) },
    async pages() { const r = await db.from('cms_pages').select('*'); check(r.error); return (r.data ?? []).map(page) },
    async page(slug) { const r = await db.from('cms_pages').select('*').eq('slug', slug).maybeSingle(); check(r.error); return r.data ? page(r.data) : null },
    async published() { const r = await db.from('cms_pages').select('slug,published').not('published', 'is', null); check(r.error); return Object.fromEntries((r.data ?? []).map(p => [p.slug, p.published])) },
    async revisions(slug) { const r = await db.from('cms_revisions').select('id,slug,content,action,actor,created_at').eq('slug', slug).order('created_at', {ascending: false}).limit(50); check(r.error); return (r.data ?? []).map(r => ({...r, createdAt: r.created_at})) as ContentRevision[] },
    async mutatePage(actor, slug, version, action, content, revisionId) { const r = await db.rpc('cms_mutate_page', {p_actor: actor, p_slug: slug, p_version: version, p_action: action, p_content: content, p_revision: revisionId}); check(r.error); return page(r.data) },
    async media() { const r = await db.from('cms_media').select('*').eq('deleted', false).order('created_at', {ascending: false}).limit(1000); check(r.error); return (r.data ?? []).map(r => ({...r, createdAt: r.created_at})) as Media[] },
    mediaUrl(path) { return bucket.getPublicUrl(path).data.publicUrl },
    async addMedia(actor, media, bytes) {
      // Short cache: replacements overwrite the same path so every reference updates.
      const uploaded = await bucket.upload(media.path, bytes, {contentType: 'image/webp', upsert: false, cacheControl: '3600'}); check(uploaded.error)
      const result = await db.rpc('cms_save_media', {p_actor: actor, p_media: media});
      if (result.error) { await bucket.remove([media.path]); check(result.error) }
      return {...result.data, createdAt: result.data.created_at} as Media
    },
    async replaceMedia(actor, id, bytes) {
      // The RPC checks role and that the image is live before the stored object is overwritten.
      const r = await db.rpc('cms_replace_media', {p_actor: actor, p_id: id, p_size: bytes.length}); check(r.error)
      const uploaded = await bucket.upload(r.data.path, bytes, {contentType: 'image/webp', upsert: true, cacheControl: '3600'}); check(uploaded.error)
      return {...r.data, createdAt: r.data.created_at} as Media
    },
    async updateMedia(actor, id, metadata) { const r = await db.rpc('cms_update_media', {p_actor: actor, p_id: id, p_metadata: metadata}); check(r.error) },
    async deleteMedia(actor, id) {
      // The RPC locks publishing and records deletion before storage removal. A failed removal can be retried.
      const r = await db.rpc('cms_delete_media', {p_actor: actor, p_id: id}); check(r.error)
      if (r.data) { const removed = await bucket.remove([r.data]); check(removed.error) }
    },
    async leads() { const r = await db.from('crm_leads').select('data').order('updated_at', {ascending: false}).limit(1000); check(r.error); return (r.data ?? []).map(r => r.data) as Lead[] },
    async saveLead(actor, id, input) { const r = await db.rpc('crm_save_lead', {p_actor: actor, p_id: id, p_data: input}); check(r.error); return r.data as Lead },
    async leadEvents(id) { const r = await db.from('crm_events').select('*').eq('lead_id', id).order('created_at', {ascending: false}).limit(100); check(r.error); return (r.data ?? []).map(r => ({...r, leadId: r.lead_id, createdAt: r.created_at})) as LeadEvent[] },
  }
}
