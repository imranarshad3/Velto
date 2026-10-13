import { dataFields } from './data.js'
import { whyChooseFeatures } from '../../data/homeContent.js'
import { inspiration } from '../../data/homeContent.js'
import { resources } from '../../data/homeContent.js'
import { announcements } from '../../data/navigation.js'
import { primaryNav } from '../../data/navigation.js'
import { utilityNav } from '../../data/navigation.js'
import { footerColumns } from '../../data/navigation.js'
import { legalNav } from '../../data/navigation.js'
import { faqGroups } from '../../data/faq.js'
import { applications } from '../../data/homeContent.js'
import { applicationDetails } from '../../data/applications.js'
import { demoCategories } from '../../data/demoCategories.js'
import type { PageDefinition, PageContent } from './types.js'

/** Structured fields bound to the existing storefront layouts. Keys are stable content identifiers. */
export const pageDefinitions: PageDefinition[] = [
  {
    "id": "home",
    "label": "Homepage",
    "path": "/",
    "reorder": true,
    "sections": [
      {
        "id": "Hero",
        "label": "Hero",
        "fields": [
          {
            "key": "Hero.field-1",
            "label": "Premium Construction Solutions",
            "value": "Premium Construction Solutions",
            "kind": "text"
          },
          {
            "key": "Hero.field-2",
            "label": "Stronger Spaces.",
            "value": "Stronger Spaces.",
            "kind": "text"
          },
          {
            "key": "Hero.field-3",
            "label": "Brighter",
            "value": "Brighter ",
            "kind": "text"
          },
          {
            "key": "Hero.field-4",
            "label": "Tomorrows.",
            "value": "Tomorrows.",
            "kind": "text"
          },
          {
            "key": "Hero.field-5",
            "label": "Construction chemical solutions for every build — from homes to l",
            "value": "Construction chemical solutions for every build — from homes to large infrastructure projects.",
            "kind": "text"
          },
          {
            "key": "Hero.field-6",
            "label": "Imagery on this page is illustrative and not official product pho",
            "value": "Imagery on this page is illustrative and not official product photography.",
            "kind": "text"
          },
          {
            "key": "Hero.field-7",
            "label": "to: /products",
            "value": "/products",
            "kind": "link"
          },
          {
            "key": "Hero.field-8",
            "label": "Shop Products",
            "value": "Shop Products ",
            "kind": "text"
          },
          {
            "key": "Hero.field-9",
            "label": "to: /solutions",
            "value": "/solutions",
            "kind": "link"
          },
          {
            "key": "Hero.field-10",
            "label": "View Solutions",
            "value": "View Solutions",
            "kind": "text"
          },
          {
            "key": "Hero.image-src",
            "label": "Image",
            "value": "/images/hero/hero-architecture-crop.webp",
            "kind": "image"
          },
          {
            "key": "Hero.image-alt",
            "label": "Image description (alt text)",
            "value": "Illustrative concept: modern concrete house with construction chemical packs on a stone ledge",
            "kind": "text"
          },
          {
            "key": "Hero.field-11",
            "label": "Concept imagery",
            "value": "Concept imagery",
            "kind": "text"
          }
        ]
      },
      {
        "id": "CategoryPreview",
        "label": "Category Preview",
        "fields": [
          {
            "key": "CategoryPreview.field-1",
            "label": "eyebrow: Product range",
            "value": "Product range",
            "kind": "text"
          },
          {
            "key": "CategoryPreview.field-2",
            "label": "title: Shop by Category",
            "value": "Shop by Category",
            "kind": "text"
          },
          {
            "key": "CategoryPreview.field-3",
            "label": "description: Explore our range of construction chemical so",
            "value": "Explore our range of construction chemical solutions.",
            "kind": "text"
          },
          {
            "key": "CategoryPreview.field-4",
            "label": "to: /products",
            "value": "/products",
            "kind": "link"
          },
          {
            "key": "CategoryPreview.field-5",
            "label": "View All",
            "value": "View All",
            "kind": "text"
          },
          {
            "key": "CategoryPreview.field-6",
            "label": "Categories",
            "value": " Categories",
            "kind": "text"
          }
        ]
      },
      {
        "id": "WhyChoose",
        "label": "Why Choose",
        "fields": [
          {
            "key": "WhyChoose.field-1",
            "label": "The VELTO difference",
            "value": "The VELTO difference",
            "kind": "text"
          },
          {
            "key": "WhyChoose.field-2",
            "label": "Why Choose",
            "value": "Why Choose ",
            "kind": "text"
          },
          {
            "key": "WhyChoose.field-3",
            "label": "VELTO?",
            "value": "VELTO?",
            "kind": "text"
          },
          {
            "key": "WhyChoose.field-4",
            "label": "A storefront built around finding the right product for the job.",
            "value": "A storefront built around finding the right product for the job.",
            "kind": "text"
          },
          {
            "key": "WhyChoose.field-5",
            "label": "to: /about",
            "value": "/about",
            "kind": "link"
          },
          {
            "key": "WhyChoose.field-6",
            "label": "Our Story",
            "value": "Our Story ",
            "kind": "text"
          },
          {
            "key": "WhyChoose.image-src",
            "label": "Image",
            "value": "/images/banners/brand-story-crop.webp",
            "kind": "image"
          },
          {
            "key": "WhyChoose.image-alt",
            "label": "Image description (alt text)",
            "value": "Illustrative concept: contemporary concrete and timber building at dusk",
            "kind": "text"
          },
          {
            "key": "WhyChoose.field-7",
            "label": "Illustrative",
            "value": "Illustrative",
            "kind": "text"
          }
        ]
      },
      {
        "id": "FeaturedProducts",
        "label": "Featured Products",
        "fields": [
          {
            "key": "FeaturedProducts.field-1",
            "label": "eyebrow: Featured",
            "value": "Featured",
            "kind": "text"
          },
          {
            "key": "FeaturedProducts.field-2",
            "label": "title: Featured Products",
            "value": "Featured Products",
            "kind": "text"
          },
          {
            "key": "FeaturedProducts.field-3",
            "label": "description: A preview of the product types in our range.",
            "value": "A preview of the product types in our range.",
            "kind": "text"
          },
          {
            "key": "FeaturedProducts.field-4",
            "label": "to: /products",
            "value": "/products",
            "kind": "link"
          },
          {
            "key": "FeaturedProducts.field-5",
            "label": "View All",
            "value": "View All",
            "kind": "text"
          },
          {
            "key": "FeaturedProducts.field-6",
            "label": "Products",
            "value": " Products",
            "kind": "text"
          },
          {
            "key": "FeaturedProducts.field-7",
            "label": "DEMO preview: product images are illustrative concepts, not offic",
            "value": "DEMO preview: product images are illustrative concepts, not official ULTRA product photographs. Names, pricing and availability will be published once verified.",
            "kind": "text"
          }
        ]
      },
      {
        "id": "ApplicationSolutions",
        "label": "Application Solutions",
        "fields": [
          {
            "key": "ApplicationSolutions.field-1",
            "label": "eyebrow: By application",
            "value": "By application",
            "kind": "text"
          },
          {
            "key": "ApplicationSolutions.field-2",
            "label": "title: Solutions by Application",
            "value": "Solutions by Application",
            "kind": "text"
          },
          {
            "key": "ApplicationSolutions.field-3",
            "label": "description: Start from the area you are building or repai",
            "value": "Start from the area you are building or repairing.",
            "kind": "text"
          },
          {
            "key": "ApplicationSolutions.image-src",
            "label": "Image",
            "value": "/images/banners/waterproofing-crop.webp",
            "kind": "image"
          },
          {
            "key": "ApplicationSolutions.image-alt",
            "label": "Image description (alt text)",
            "value": "Illustrative concept: roller applying a blue waterproofing coat to a rooftop",
            "kind": "text"
          },
          {
            "key": "ApplicationSolutions.field-4",
            "label": "Waterproofing range",
            "value": "Waterproofing range",
            "kind": "text"
          },
          {
            "key": "ApplicationSolutions.field-5",
            "label": "Waterproofing for roofs, basements & terraces",
            "value": "Waterproofing for roofs, basements & terraces",
            "kind": "text"
          },
          {
            "key": "ApplicationSolutions.field-6",
            "label": "Browse waterproofing products by the surface you need to protect.",
            "value": "Browse waterproofing products by the surface you need to protect.",
            "kind": "text"
          },
          {
            "key": "ApplicationSolutions.field-7",
            "label": "to: /products?category=waterproofing",
            "value": "/products?category=waterproofing",
            "kind": "link"
          },
          {
            "key": "ApplicationSolutions.field-8",
            "label": "Explore Waterproofing",
            "value": "Explore Waterproofing ",
            "kind": "text"
          }
        ]
      },
      {
        "id": "ProfessionalsBanner",
        "label": "Professionals Banner",
        "fields": [
          {
            "key": "ProfessionalsBanner.field-1",
            "label": "VELTO Professionals",
            "value": "VELTO Professionals",
            "kind": "text"
          },
          {
            "key": "ProfessionalsBanner.field-2",
            "label": "Built for Professionals",
            "value": "Built for Professionals",
            "kind": "text"
          },
          {
            "key": "ProfessionalsBanner.field-3",
            "label": "For builders, architects and contractors: browse by application, ",
            "value": "For builders, architects and contractors: browse by application, request project quantities and access technical documents as they are published.",
            "kind": "text"
          },
          {
            "key": "ProfessionalsBanner.field-4",
            "label": "to: /solutions",
            "value": "/solutions",
            "kind": "link"
          },
          {
            "key": "ProfessionalsBanner.field-5",
            "label": "Explore Solutions",
            "value": "Explore Solutions ",
            "kind": "text"
          },
          {
            "key": "ProfessionalsBanner.field-6",
            "label": "to: /quote",
            "value": "/quote",
            "kind": "link"
          },
          {
            "key": "ProfessionalsBanner.field-7",
            "label": "Request a Quote",
            "value": "Request a Quote",
            "kind": "text"
          },
          {
            "key": "ProfessionalsBanner.image-src",
            "label": "Image",
            "value": "/images/banners/professional-contractor.webp",
            "kind": "image"
          },
          {
            "key": "ProfessionalsBanner.image-alt",
            "label": "Image description (alt text)",
            "value": "Illustrative concept: contractor in safety gear levelling a floor surface",
            "kind": "text"
          }
        ]
      },
      {
        "id": "Inspiration",
        "label": "Inspiration",
        "fields": [
          {
            "key": "Inspiration.field-1",
            "label": "eyebrow: Illustrative",
            "value": "Illustrative",
            "kind": "text"
          },
          {
            "key": "Inspiration.field-2",
            "label": "title: Inspiration",
            "value": "Inspiration",
            "kind": "text"
          },
          {
            "key": "Inspiration.field-3",
            "label": "description: Ideas for the kinds of spaces construction ch",
            "value": "Ideas for the kinds of spaces construction chemicals help build.",
            "kind": "text"
          },
          {
            "key": "Inspiration.field-4",
            "label": "Illustrative concept imagery, not completed VELTO projects.",
            "value": "Illustrative concept imagery, not completed VELTO projects.",
            "kind": "text"
          }
        ]
      },
      {
        "id": "TechnicalResources",
        "label": "Technical Resources",
        "fields": [
          {
            "key": "TechnicalResources.field-1",
            "label": "eyebrow: Documentation",
            "value": "Documentation",
            "kind": "text"
          },
          {
            "key": "TechnicalResources.field-2",
            "label": "title: Technical Resources",
            "value": "Technical Resources",
            "kind": "text"
          },
          {
            "key": "TechnicalResources.field-3",
            "label": "description: Documentation to help you choose and apply pr",
            "value": "Documentation to help you choose and apply products correctly.",
            "kind": "text"
          },
          {
            "key": "TechnicalResources.field-4",
            "label": "Search verified data sheets and installation guides, or estimate ",
            "value": "Search verified data sheets and installation guides, or estimate quantities with the coverage calculator.",
            "kind": "text"
          },
          {
            "key": "TechnicalResources.field-5",
            "label": "to: /resources",
            "value": "/resources",
            "kind": "link"
          },
          {
            "key": "TechnicalResources.field-6",
            "label": "Visit the resource hub",
            "value": "Visit the resource hub ",
            "kind": "text"
          },
          {
            "key": "TechnicalResources.field-7",
            "label": "Coming soon",
            "value": "Coming soon",
            "kind": "text"
          },
          {
            "key": "TechnicalResources.field-8",
            "label": "Coming soon",
            "value": "Coming soon",
            "kind": "text"
          }
        ]
      },
      {
        "id": "QuoteCTA",
        "label": "Quote CTA",
        "fields": [
          {
            "key": "QuoteCTA.field-1",
            "label": "Project quotes",
            "value": "Project quotes",
            "kind": "text"
          },
          {
            "key": "QuoteCTA.field-2",
            "label": "Planning a project?",
            "value": "Planning a project?",
            "kind": "text"
          },
          {
            "key": "QuoteCTA.field-3",
            "label": "Tell us what you are building and the areas involved, and we will",
            "value": "Tell us what you are building and the areas involved, and we will help with product selection and quantities.",
            "kind": "text"
          },
          {
            "key": "QuoteCTA.field-4",
            "label": "to: /quote",
            "value": "/quote",
            "kind": "link"
          },
          {
            "key": "QuoteCTA.field-5",
            "label": "Request a Quote",
            "value": "Request a Quote ",
            "kind": "text"
          },
          {
            "key": "QuoteCTA.field-6",
            "label": "to: /solutions",
            "value": "/solutions",
            "kind": "link"
          },
          {
            "key": "QuoteCTA.field-7",
            "label": "Browse Solutions",
            "value": "Browse Solutions",
            "kind": "text"
          }
        ]
      }
    ]
  },
  {
    "id": "about",
    "label": "About",
    "path": "/about",
    "reorder": false,
    "sections": [
      {
        "id": "AboutPage",
        "label": "About",
        "fields": [
          {
            "key": "AboutPage.field-1",
            "label": "About — VELTO",
            "value": "About — VELTO",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-2",
            "label": "content: VELTO is a storefront for construction chemi",
            "value": "VELTO is a storefront for construction chemical solutions featuring ULTRA Chemicals products.",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-3",
            "label": "eyebrow: About VELTO",
            "value": "About VELTO",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-4",
            "label": "title: Building better, one project at a time",
            "value": "Building better, one project at a time",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-5",
            "label": "description: VELTO is a storefront for construction chemi",
            "value": "VELTO is a storefront for construction chemical solutions, featuring products from ULTRA Chemicals.",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-6",
            "label": "The store",
            "value": "The store",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-7",
            "label": "VELTO",
            "value": "VELTO",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-8",
            "label": "The manufacturer",
            "value": "The manufacturer",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-9",
            "label": "ULTRA Chemicals",
            "value": "ULTRA Chemicals",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-10",
            "label": "Two separate names, kept clearly apart.",
            "value": "Two separate names, kept clearly apart.",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-11",
            "label": "What we do",
            "value": "What we do",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-12",
            "label": "Tiling, waterproofing, repair and flooring work all depend on the",
            "value": "Tiling, waterproofing, repair and flooring work all depend on the right chemistry being used",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-13",
            "label": "in the right order.",
            "value": "in the right order.",
            "kind": "text"
          },
          {
            "key": "AboutPage.image-src",
            "label": "Image",
            "value": "/images/banners/brand-story-crop.webp",
            "kind": "image"
          },
          {
            "key": "AboutPage.image-alt",
            "label": "Image description (alt text)",
            "value": "Illustrative concept: contemporary concrete and timber building at dusk",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-14",
            "label": "From the right product to a confident quote",
            "value": "From the right product to a confident quote",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-15",
            "label": "VELTO brings construction chemicals together in one place and or",
            "value": "VELTO brings construction chemicals together in one place and organises them around the jobs builders, architects, contractors and homeowners actually do — so you can go from the surface in front of you to the products it needs, and on to a single quote.",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-16",
            "label": "ULTRA Chemicals is the manufacturer of the products we feature; N",
            "value": "ULTRA Chemicals is the manufacturer of the products we feature; VELTO is the store. We keep the two clearly separate, and we publish product details only once they are confirmed.",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-17",
            "label": "to: /products",
            "value": "/products",
            "kind": "link"
          },
          {
            "key": "AboutPage.field-18",
            "label": "Browse products",
            "value": "Browse products ",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-19",
            "label": "to: /contact",
            "value": "/contact",
            "kind": "link"
          },
          {
            "key": "AboutPage.field-20",
            "label": "Contact us",
            "value": "Contact us",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-21",
            "label": "eyebrow: How we work",
            "value": "How we work",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-22",
            "label": "title: What you can expect",
            "value": "What you can expect",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-23",
            "label": "eyebrow: Who we serve",
            "value": "Who we serve",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-24",
            "label": "title: For professionals and homeowners alike",
            "value": "For professionals and homeowners alike",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-25",
            "label": "alt: ",
            "value": "",
            "kind": "text"
          },
          {
            "key": "AboutPage.field-26",
            "label": "Illustrative imagery",
            "value": "Illustrative imagery",
            "kind": "text"
          }
        ]
      }
    ]
  },
  {
    "id": "solutions",
    "label": "Solutions",
    "path": "/solutions",
    "reorder": false,
    "sections": [
      {
        "id": "SolutionsPage",
        "label": "Solutions",
        "fields": [
          {
            "key": "SolutionsPage.field-1",
            "label": "Solutions — VELTO",
            "value": "Solutions — VELTO",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-2",
            "label": "content: Find the right construction chemical solution",
            "value": "Find the right construction chemical solution by application or product category, then request a quote.",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-3",
            "label": "eyebrow: Solutions",
            "value": "Solutions",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-4",
            "label": "title: The right product for every part of the build",
            "value": "The right product for every part of the build",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-5",
            "label": "description: Tiling, waterproofing, repair, flooring and s",
            "value": "Tiling, waterproofing, repair, flooring and surface protection — organised so you can go from problem to product quickly.",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-6",
            "label": "to: /applications",
            "value": "/applications",
            "kind": "link"
          },
          {
            "key": "SolutionsPage.field-7",
            "label": "Start from the job",
            "value": "Start from the job ",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-8",
            "label": "to: /products",
            "value": "/products",
            "kind": "link"
          },
          {
            "key": "SolutionsPage.field-9",
            "label": "Browse products",
            "value": "Browse products",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.image-src",
            "label": "Image",
            "value": "/images/banners/brand-story-crop.webp",
            "kind": "image"
          },
          {
            "key": "SolutionsPage.image-alt",
            "label": "Image description (alt text)",
            "value": "Illustrative concept: contemporary concrete and timber building at dusk",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-10",
            "label": "applications",
            "value": " applications",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-11",
            "label": "product categories",
            "value": " product categories",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-12",
            "label": "eyebrow: Find your way",
            "value": "Find your way",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-13",
            "label": "title: Four ways to find what you need",
            "value": "Four ways to find what you need",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-14",
            "label": "eyebrow: Start from the job",
            "value": "Start from the job",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-15",
            "label": "title: By application",
            "value": "By application",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-16",
            "label": "to: /applications",
            "value": "/applications",
            "kind": "link"
          },
          {
            "key": "SolutionsPage.field-17",
            "label": "All applications",
            "value": "All applications ",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-18",
            "label": "eyebrow: Start from the product",
            "value": "Start from the product",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-19",
            "label": "title: By product category",
            "value": "By product category",
            "kind": "text"
          },
          {
            "key": "SolutionsPage.field-20",
            "label": "to: /products",
            "value": "/products",
            "kind": "link"
          },
          {
            "key": "SolutionsPage.field-21",
            "label": "All products",
            "value": "All products ",
            "kind": "text"
          }
        ]
      }
    ]
  },
  {
    "id": "applications",
    "label": "Applications",
    "path": "/applications",
    "reorder": false,
    "sections": [
      {
        "id": "ApplicationsPage",
        "label": "Applications",
        "fields": [
          {
            "key": "ApplicationsPage.field-1",
            "label": "Applications — VELTO",
            "value": "Applications — VELTO",
            "kind": "text"
          },
          {
            "key": "ApplicationsPage.field-2",
            "label": "content: Construction chemical solutions by applicatio",
            "value": "Construction chemical solutions by application: bathrooms, kitchens, roofs, floors, pools and exterior walls.",
            "kind": "text"
          },
          {
            "key": "ApplicationsPage.field-3",
            "label": "eyebrow: Applications",
            "value": "Applications",
            "kind": "text"
          },
          {
            "key": "ApplicationsPage.field-4",
            "label": "title: Solutions for every area",
            "value": "Solutions for every area",
            "kind": "text"
          },
          {
            "key": "ApplicationsPage.field-5",
            "label": "description: Start from the space you are building or repa",
            "value": "Start from the space you are building or repairing to see the typical sequence of work and the product types involved.",
            "kind": "text"
          },
          {
            "key": "ApplicationsPage.field-6",
            "label": "alt: ",
            "value": "",
            "kind": "text"
          },
          {
            "key": "ApplicationsPage.field-7",
            "label": "All applications",
            "value": "All applications",
            "kind": "text"
          }
        ]
      }
    ]
  },
  {
    "id": "contact",
    "label": "Contact",
    "path": "/contact",
    "reorder": false,
    "sections": [
      {
        "id": "ContactPage",
        "label": "Contact",
        "fields": [
          {
            "key": "ContactPage.field-1",
            "label": "Contact — VELTO",
            "value": "Contact — VELTO",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-2",
            "label": "content: Send VELTO a message about products, quotes ",
            "value": "Send VELTO a message about products, quotes or your account.",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-3",
            "label": "eyebrow: Contact",
            "value": "Contact",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-4",
            "label": "title: How can we help?",
            "value": "How can we help?",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-5",
            "label": "description: Send us a message and our team will reply by ",
            "value": "Send us a message and our team will reply by email.",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-6",
            "label": "Replies by email",
            "value": "Replies by email",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-7",
            "label": "To the address you give in the form.",
            "value": "To the address you give in the form.",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-8",
            "label": "Message sent",
            "value": "Message sent",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-9",
            "label": "Thank you. We’ll reply to the email address you provided.",
            "value": "Thank you. We’ll reply to the email address you provided.",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-10",
            "label": "Send another message",
            "value": "Send another message",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-11",
            "label": "to: /products",
            "value": "/products",
            "kind": "link"
          },
          {
            "key": "ContactPage.field-12",
            "label": "Browse products",
            "value": "Browse products ",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-13",
            "label": "Send a message",
            "value": "Send a message",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-14",
            "label": "Fields marked",
            "value": "Fields marked ",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-15",
            "label": "are required.",
            "value": " are required.",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-16",
            "label": "Your details",
            "value": "Your details",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-17",
            "label": "Choose a topic",
            "value": "Choose a topic",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-18",
            "label": "Your message",
            "value": "Your message",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-19",
            "label": "I agree that VELTO may use these details to reply to my message.",
            "value": "I agree that VELTO may use these details to reply to my message. See our",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-20",
            "label": "to: /privacy",
            "value": "/privacy",
            "kind": "link"
          },
          {
            "key": "ContactPage.field-21",
            "label": "privacy policy",
            "value": "privacy policy",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-22",
            "label": "Website",
            "value": "Website",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-23",
            "label": "We use these details to reply to you.",
            "value": "We use these details to reply to you.",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-24",
            "label": "Before you write",
            "value": "Before you write",
            "kind": "text"
          },
          {
            "key": "ContactPage.field-25",
            "label": "The quickest route depends on what you need.",
            "value": "The quickest route depends on what you need.",
            "kind": "text"
          }
        ]
      }
    ]
  },
  {
    "id": "resources",
    "label": "Resources",
    "path": "/resources",
    "reorder": false,
    "sections": [
      {
        "id": "ResourcesPage",
        "label": "Resources",
        "fields": [
          {
            "key": "ResourcesPage.field-1",
            "label": "Resources — VELTO",
            "value": "Resources — VELTO",
            "kind": "text"
          },
          {
            "key": "ResourcesPage.field-2",
            "label": "content: Technical documents, a coverage calculator, a",
            "value": "Technical documents, a coverage calculator, application guides and FAQs.",
            "kind": "text"
          },
          {
            "key": "ResourcesPage.field-3",
            "label": "eyebrow: Resources",
            "value": "Resources",
            "kind": "text"
          },
          {
            "key": "ResourcesPage.field-4",
            "label": "title: Tools and information for your project",
            "value": "Tools and information for your project",
            "kind": "text"
          },
          {
            "key": "ResourcesPage.field-5",
            "label": "description: Everything that helps you choose, quantify an",
            "value": "Everything that helps you choose, quantify and apply the right products.",
            "kind": "text"
          },
          {
            "key": "ResourcesPage.field-6",
            "label": "Open",
            "value": "Open ",
            "kind": "text"
          }
        ]
      }
    ]
  },
  {
    "id": "faq",
    "label": "FAQ",
    "path": "/faq",
    "reorder": false,
    "sections": [
      {
        "id": "FaqPage",
        "label": "Faq",
        "fields": [
          {
            "key": "FaqPage.field-1",
            "label": "FAQ — VELTO",
            "value": "FAQ — VELTO",
            "kind": "text"
          },
          {
            "key": "FaqPage.field-2",
            "label": "content: Answers about quotes, ordering, products, del",
            "value": "Answers about quotes, ordering, products, delivery and accounts at VELTO.",
            "kind": "text"
          },
          {
            "key": "FaqPage.field-3",
            "label": "eyebrow: Help",
            "value": "Help",
            "kind": "text"
          },
          {
            "key": "FaqPage.field-4",
            "label": "title: Frequently asked questions",
            "value": "Frequently asked questions",
            "kind": "text"
          },
          {
            "key": "FaqPage.field-5",
            "label": "Still have a question?",
            "value": "Still have a question?",
            "kind": "text"
          },
          {
            "key": "FaqPage.field-6",
            "label": "to: /contact",
            "value": "/contact",
            "kind": "link"
          },
          {
            "key": "FaqPage.field-7",
            "label": "Contact us",
            "value": "Contact us",
            "kind": "text"
          }
        ]
      }
    ]
  },
  {
    "id": "site",
    "label": "Navigation & footer",
    "path": "/",
    "reorder": false,
    "sections": [
      {
        "id": "Footer",
        "label": "Footer",
        "fields": [
          {
            "key": "Footer.field-1",
            "label": "Construction chemistry,",
            "value": "Construction chemistry, ",
            "kind": "text"
          },
          {
            "key": "Footer.field-2",
            "label": "chosen with confidence.",
            "value": "chosen with confidence.",
            "kind": "text"
          },
          {
            "key": "Footer.field-3",
            "label": "VELTO is a storefront for construction chemical solutions, featu",
            "value": "VELTO is a storefront for construction chemical solutions, featuring ULTRA Chemicals products.",
            "kind": "text"
          },
          {
            "key": "Footer.field-4",
            "label": "to: /quote",
            "value": "/quote",
            "kind": "link"
          },
          {
            "key": "Footer.field-5",
            "label": "Request a Quote",
            "value": "Request a Quote",
            "kind": "text"
          },
          {
            "key": "Footer.field-6",
            "label": "to: /contact",
            "value": "/contact",
            "kind": "link"
          },
          {
            "key": "Footer.field-7",
            "label": "Contact us",
            "value": "Contact us",
            "kind": "text"
          },
          {
            "key": "Footer.field-8",
            "label": "VELTO. Product imagery is illustrative.",
            "value": " VELTO. Product imagery is illustrative.",
            "kind": "text"
          },
          {
            "key": "Footer.field-9",
            "label": "VELTO",
            "value": "VELTO",
            "kind": "text"
          }
        ]
      }
    ]
  }
]

export function defaultContent(slug: string): PageContent {
 const page = pageDefinitions.find(p => p.id === slug)
 return {fields: Object.fromEntries(page?.sections.flatMap(s => s.fields.map(f => [f.key, f.value])) ?? []), order: page?.sections.map(s => s.id) ?? [], hidden: []}
}

function addCollection(page: string, id: string, fields: import('./types.js').ContentField[]) {
  let definition = pageDefinitions.find(p=>p.id===page)
  if (!definition) { definition={id:page,label:'Categories',path:'/products',reorder:false,sections:[]}; pageDefinitions.push(definition) }
  const section=definition.sections.find(s=>s.id===id)
  if (section) section.fields.push(...fields)
  else definition.sections.push({id,label:id.replace(/([a-z])([A-Z])/g,'$1 $2'),fields})
}
addCollection('home', 'WhyChoose', dataFields(whyChooseFeatures, 'WhyChoose.data'))
addCollection('home', 'Inspiration', dataFields(inspiration, 'Inspiration.data'))
addCollection('home', 'TechnicalResources', dataFields(resources, 'TechnicalResources.data'))
addCollection('site', 'Announcements', dataFields(announcements, 'Announcements.data'))
addCollection('site', 'Navigation', dataFields(primaryNav, 'Navigation.data'))
addCollection('site', 'UtilityNavigation', dataFields(utilityNav, 'UtilityNavigation.data'))
addCollection('site', 'FooterLinks', dataFields(footerColumns, 'FooterLinks.data'))
addCollection('site', 'LegalLinks', dataFields(legalNav, 'LegalLinks.data'))
addCollection('faq', 'Questions', dataFields(faqGroups, 'Questions.data'))
addCollection('applications', 'Applications', dataFields(applications, 'Applications.data'))
addCollection('applications', 'ApplicationDetails', dataFields(applicationDetails, 'ApplicationDetails.data'))
addCollection('categories', 'Categories', dataFields(demoCategories, 'Categories.data'))
