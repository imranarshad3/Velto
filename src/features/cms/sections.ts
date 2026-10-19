import type { AddedSection, AddedSectionType, ContentField, PageContent, PageDefinition } from './types.js'

export const sectionTemplates: { type: AddedSectionType; label: string }[] = [
  { type: 'text', label: 'Text section' },
  { type: 'image-text', label: 'Image and text' },
  { type: 'cta', label: 'Call to action' },
]
export const supportsSections = (slug: string) => !['site', 'categories'].includes(slug)
export function addedSectionDefinition(section: AddedSection) {
  const fields: ContentField[] = [
    { key: 'title', label: 'Heading', kind: 'text', value: 'New section' },
    { key: 'body', label: 'Description', kind: 'text', value: '' },
    ...(section.type === 'image-text' ? [
      { key: 'image-src', label: 'Image', kind: 'image' as const, value: '' },
      { key: 'image-alt', label: 'Image description (alt text)', kind: 'text' as const, value: '' },
    ] : []),
    { key: 'link', label: 'Button destination (optional)', kind: 'link', value: '' },
    { key: 'button', label: 'Button label', kind: 'text', value: '' },
  ]
  return { id: section.id, label: sectionTemplates.find(t => t.type === section.type)!.label, fields: fields.map(f => ({ ...f, key: `${section.id}.${f.key}` })) }
}
export const editableSections = (page: PageDefinition, content?: PageContent | null) => [
  ...page.sections, ...(content?.sections ?? []).map(addedSectionDefinition),
]
export function addSection(content: PageContent, section: AddedSection): PageContent {
  return { ...content, sections: [...(content.sections ?? []), section], order: [...content.order, section.id],
    fields: { ...content.fields, ...Object.fromEntries(addedSectionDefinition(section).fields.map(f => [f.key, f.value])) } }
}
export function removeSection(content: PageContent, id: string): PageContent {
  return { ...content, sections: content.sections?.filter(s => s.id !== id), order: content.order.filter(s => s !== id),
    ...(content.imageSizes ? { imageSizes: Object.fromEntries(Object.entries(content.imageSizes).filter(([key]) => !key.startsWith(`${id}.`))) } : {}),
    hidden: content.hidden.filter(s => s !== id), fields: Object.fromEntries(Object.entries(content.fields).filter(([key]) => !key.startsWith(`${id}.`))) }
}
