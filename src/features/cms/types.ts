export interface ContentField { key: string; label: string; value: string; kind: 'text' | 'link' | 'image' }
export interface ContentSection { id: string; label: string; fields: ContentField[] }
export interface PageDefinition { id: string; label: string; path: string; reorder: boolean; sections: ContentSection[] }
export interface PageContent { fields: Record<string, string>; order: string[]; hidden: string[] }
export interface ContentPage { slug: string; draft: PageContent; published: PageContent | null; version: number; updatedAt: string | null }
export interface ContentRevision { id: string; slug: string; content: PageContent; action: string; actor: string; createdAt: string }
export const leadStages = ['New', 'Contacted', 'Qualified', 'Negotiating', 'Won', 'Lost'] as const
export interface Lead {
  id: string; name: string; email: string; phone: string; company: string;
  stage: typeof leadStages[number]; notes: string; tags: string[]; assignedTo: string | null;
  followUp: string | null; quoteReference: string | null; version: number; updatedAt: string;
}
export interface LeadEvent { id: string; leadId: string; actor: string; action: string; createdAt: string }
export interface Media { id: string; path: string; url: string; name: string; alt: string; folder: string; tags: string[]; size: number; createdAt: string }
export type WorkspaceRole = 'admin' | 'editor' | 'sales'
