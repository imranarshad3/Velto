/** Resource Center shapes (zod-free, safe for storefront chunks and serverless imports). */
export const resourceKinds = ['data_sheet', 'installation_guide', 'safety_data_sheet', 'certificate', 'brochure'] as const
export type ResourceKind = (typeof resourceKinds)[number]

export const resourceKindLabels: Record<ResourceKind, string> = {
  data_sheet: 'Product details',
  installation_guide: 'Installation guide',
  safety_data_sheet: 'Safety information',
  certificate: 'Certificate',
  brochure: 'Brochure',
}

export const MAX_RESOURCE_BYTES = 20 * 1024 * 1024

export interface TechnicalResource {
  id: string
  title: string
  summary: string | null
  kind: ResourceKind
  productSlugs: string[]
  fileName: string
  fileSize: number
  published: boolean
  createdAt: string
  updatedAt: string
}

/** Public listing: published only; files are fetched through the download endpoint (short-lived signed URL). */
export type PublicResource = Omit<TechnicalResource, 'published'>

export const coverageUnits = ['kg', 'L'] as const
export const packContainers = ['bags', 'buckets', 'units'] as const

/** Manufacturer coverage for one product: `rate` per m² per coat, sold in packs of `packAmount` (same unit). */
export interface ProductCoverage {
  productSlug: string
  rate: number
  rateUnit: (typeof coverageUnits)[number]
  coats: number
  packAmount: number
  packContainer: (typeof packContainers)[number]
  sourceResourceId: string | null
  note: string | null
  updatedAt: string
}

export interface ResourceCatalog {
  resources: PublicResource[]
  /** Only products that are verified and published. */
  coverage: ProductCoverage[]
}

export const resourceDownloadPath = (id: string) => `/api/resources/download?id=${encodeURIComponent(id)}`

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)
