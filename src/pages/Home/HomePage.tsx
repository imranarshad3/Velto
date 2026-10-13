import ApplicationSolutions from './ApplicationSolutions.tsx'
import CategoryPreview from './CategoryPreview.tsx'
import FeaturedProducts from './FeaturedProducts.tsx'
import Hero from './Hero.tsx'
import Inspiration from './Inspiration.tsx'
import ProfessionalsBanner from './ProfessionalsBanner.tsx'
import QuoteCTA from './QuoteCTA.tsx'
import TechnicalResources from './TechnicalResources.tsx'
import WhyChoose from './WhyChoose.tsx'

export default function HomePage() {
  return (
    <>
      <title>NOVARO — Construction Chemical Solutions</title>
      <Hero />
      <CategoryPreview />
      <WhyChoose />
      <FeaturedProducts />
      <ApplicationSolutions />
      <ProfessionalsBanner />
      <Inspiration />
      <TechnicalResources />
      <QuoteCTA />
    </>
  )
}
