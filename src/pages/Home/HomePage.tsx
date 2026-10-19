import { AddedSectionView } from '../../features/cms/AddedSectionView.tsx'
import { useContentReady, usePageContent } from '../../features/cms/context.ts'
import ApplicationSolutions from './ApplicationSolutions.tsx'
import CategoryPreview from './CategoryPreview.tsx'
import FeaturedProducts from './FeaturedProducts.tsx'
import Hero, { HeroSkeleton } from './Hero.tsx'
import Inspiration from './Inspiration.tsx'
import ProfessionalsBanner from './ProfessionalsBanner.tsx'
import QuoteCTA from './QuoteCTA.tsx'
import TechnicalResources from './TechnicalResources.tsx'
import WhyChoose from './WhyChoose.tsx'

const sections = { Hero, CategoryPreview, WhyChoose, FeaturedProducts, ApplicationSolutions, ProfessionalsBanner, Inspiration, TechnicalResources, QuoteCTA }
export default function HomePage() {
  const ready = useContentReady('home')
  const content = usePageContent('home')

  if (!ready) {
    return (
      <>
        <title>VELTO — Construction Chemical Solutions</title>
        <HeroSkeleton />
      </>
    )
  }

  const order = content?.order ?? Object.keys(sections)
  return <>
    <title>VELTO — Construction Chemical Solutions</title>
    {order.filter(id => !content?.hidden.includes(id)).map(id => {
      const Section = sections[id as keyof typeof sections]
      const added = content?.sections?.find(s => s.id === id)
      return Section ? <Section key={id} /> : added && content ? <AddedSectionView key={id} section={added} content={content} /> : null
    })}
  </>
}
