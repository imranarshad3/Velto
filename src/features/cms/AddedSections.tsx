import { useLocation } from 'react-router'
import { usePageContent } from './context.ts'
import { pageDefinitions } from './registry.ts'
import { supportsSections } from './sections.ts'
import { AddedSectionView } from './AddedSectionView.tsx'

function PageSections({ slug }: { slug: string }) {
  const content = usePageContent(slug)
  if (!content) return null
  return content.order.filter(id => !content.hidden.includes(id)).map(id => {
    const section = content.sections?.find(s => s.id === id)
    return section ? <AddedSectionView key={id} section={section} content={content} /> : null
  })
}

export default function AddedSections() {
  const { pathname } = useLocation()
  const page = pageDefinitions.find(p => p.id !== 'home' && supportsSections(p.id) && p.path === pathname.replace(/\/$/, ''))
  return page ? <PageSections slug={page.id} /> : null
}
