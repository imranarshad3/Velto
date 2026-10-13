import { z } from 'zod'
import { coverageUnits, MAX_RESOURCE_BYTES, packContainers, resourceKinds } from './types.ts'

const slug = z.string().regex(/^[a-z0-9-]{1,80}$/)
const blank = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

export const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(200).regex(/\.pdf$/i, 'Upload a PDF file'),
  size: z.number().int().positive().max(MAX_RESOURCE_BYTES, 'PDFs can be up to 20 MB'),
  contentType: z.literal('application/pdf', 'Upload a PDF file'),
})

export const resourceInputSchema = z.object({
  title: z.string().trim().min(3, 'Enter a title of at least 3 characters').max(160),
  summary: z.preprocess(blank, z.string().trim().max(600).optional()),
  kind: z.enum(resourceKinds),
  productSlugs: z.array(slug).max(50).default([]),
  published: z.boolean().default(false),
  /** Path returned by the upload step. Required when creating; optional when editing (replaces the file). */
  storagePath: z.string().regex(/^[a-z0-9-]+\/[a-z0-9._-]+\.pdf$/).optional(),
  fileName: z.string().trim().min(1).max(200).optional(),
})
export type ResourceInput = z.input<typeof resourceInputSchema>
export type ResourceData = z.output<typeof resourceInputSchema>

export const coverageInputSchema = z.object({
  rate: z.number().positive('Enter the manufacturer’s coverage rate').max(1000),
  rateUnit: z.enum(coverageUnits),
  coats: z.number().int().min(1).max(10).default(1),
  packAmount: z.number().positive('Enter the pack size').max(10000),
  packContainer: z.enum(packContainers),
  sourceResourceId: z.uuid().nullable().default(null),
  note: z.preprocess(blank, z.string().trim().max(300).optional()),
})
export type CoverageInput = z.input<typeof coverageInputSchema>
export type CoverageData = z.output<typeof coverageInputSchema>
