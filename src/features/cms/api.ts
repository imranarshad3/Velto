import { call } from '../quotes/api.ts'
import type { ContentPage, ContentRevision, Lead, LeadEvent, Media, PageContent, WorkspaceRole } from './types.ts'
const request = <T>(token: string, path: string, method = 'GET', body?: unknown) => call<T>(`/api/admin/${path}`, {method, ...(body === undefined ? {} : {body: JSON.stringify(body)})}, token)
export const workspaceApi = {
  access: (t: string) => request<{role: WorkspaceRole}>(t, 'workspace-access'),
  page: (t: string, slug: string) => request<{page: ContentPage}>(t, `cms/${slug}`),
  pages: (t: string) => request<{pages: ContentPage[]}>(t, 'cms'),
  revisions: (t: string, slug: string) => request<{revisions: ContentRevision[]}>(t, `cms/${slug}/revisions`),
  mutate: (t: string, slug: string, version: number, action: string, content?: PageContent, revisionId?: string) => request<{page: ContentPage}>(t, `cms/${slug}`, 'POST', {version, action, content, revisionId}),
  media: (t: string) => request<{media: Media[]}>(t, 'media'),
  upload: (t: string, metadata: Pick<Media,'name'|'alt'|'folder'|'tags'>, base64: string) => request<{media: Media}>(t, 'media', 'POST', {metadata, base64}),
  replaceMedia: (t: string, id: string, base64: string) => request<{media: Media}>(t, `media/${id}`, 'PUT', {base64}),
  updateMedia: (t: string, id: string, metadata: Pick<Media,'name'|'alt'|'folder'|'tags'>) => request<{ok: boolean}>(t, `media/${id}`, 'PATCH', metadata),
  deleteMedia: (t: string, id: string) => request<{ok: boolean}>(t, `media/${id}`, 'DELETE'),
  leads: (t: string) => request<{leads: Lead[]}>(t, 'leads'),
  saveLead: (t: string, id: string | null, body: Omit<Lead,'id'|'updatedAt'>) => request<{lead: Lead}>(t, `leads${id ? `/${id}` : ''}`, id ? 'PATCH' : 'POST', body),
  events: (t: string, id: string) => request<{events: LeadEvent[]}>(t, `leads/${id}/events`),
  assignees: (t: string) => request<{members: {id: string; name: string}[]}>(t, 'assignees'),
  roles: (t: string) => request<{members: {clerkUserId: string; note: string | null; role: WorkspaceRole}[]}>(t, 'roles'),
  setRole: (t: string, id: string, role: WorkspaceRole) => request<{ok: boolean}>(t, `roles/${id}`, 'PATCH', {role}),
}
