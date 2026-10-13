import type { ContentPage, ContentRevision, Lead, LeadEvent, Media, PageContent, WorkspaceRole } from '../../src/features/cms/types.js'
export interface WorkspaceStore {
  role(userId: string): Promise<WorkspaceRole | null>
  setRole(actor: string, userId: string, role: WorkspaceRole): Promise<void>
  pages(): Promise<ContentPage[]>
  page(slug: string): Promise<ContentPage | null>
  published(): Promise<Record<string, PageContent>>
  revisions(slug: string): Promise<ContentRevision[]>
  mutatePage(actor: string, slug: string, version: number, action: string, content: PageContent | null, revisionId: string | null): Promise<ContentPage>
  media(): Promise<Media[]>
  addMedia(actor: string, media: Omit<Media, 'createdAt'>, bytes: Uint8Array): Promise<Media>
  replaceMedia(actor: string, id: string, bytes: Uint8Array): Promise<Media>
  updateMedia(actor: string, id: string, metadata: Pick<Media, 'name' | 'alt' | 'folder' | 'tags'>): Promise<void>
  deleteMedia(actor: string, id: string): Promise<void>
  mediaUrl(path: string): string
  leads(): Promise<Lead[]>
  saveLead(actor: string, id: string | null, lead: Omit<Lead, 'id' | 'updatedAt'>): Promise<Lead>
  leadEvents(id: string): Promise<LeadEvent[]>
}
