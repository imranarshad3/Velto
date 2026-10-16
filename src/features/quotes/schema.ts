import { z } from 'zod'

/**
 * Shared by the quote form (client UX) and the API (authoritative check).
 * Keep this file free of relative runtime imports so serverless functions can load it directly.
 */

import { quantityUnits } from './units.js'
export { quantityUnits, type QuantityUnit } from './units.js'
export const projectTypes = ['residential', 'commercial', 'industrial', 'infrastructure', 'renovation', 'other'] as const
export const quoteStatuses = ['submitted', 'reviewing', 'quoted', 'closed', 'cancelled'] as const
export type QuoteStatus = (typeof quoteStatuses)[number]

export const projectTypeLabels: Record<(typeof projectTypes)[number], string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  infrastructure: 'Infrastructure',
  renovation: 'Renovation / repair',
  other: 'Other',
}

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  submitted: 'Submitted',
  reviewing: 'Under review',
  quoted: 'Quote sent',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

const blankToUndefined = (value: unknown) =>
  value === '' || value === null || (typeof value === 'number' && Number.isNaN(value)) ? undefined : value

const text = (min: number, max: number, label: string) =>
  z
    .string({ error: `Enter your ${label}` })
    .trim()
    .min(min, min <= 1 ? `Enter your ${label}` : `${label[0].toUpperCase()}${label.slice(1)} must be at least ${min} characters`)
    .max(max, `Keep this under ${max} characters`)

const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max, `Keep this under ${max} characters`).optional())

export const MAX_QUOTE_ITEMS = 20

export const quoteItemSchema = z
  .object({
    productSlug: z.string({ error: 'Choose a product' }).regex(/^[a-z0-9-]{1,80}$/, 'Choose a product from the list'),
    quantity: z.preprocess(
      blankToUndefined,
      z.coerce.number({ error: 'Enter a number' }).positive('Quantity must be more than 0').max(1_000_000, 'Quantity is too large').optional(),
    ),
    quantityUnit: z.preprocess(blankToUndefined, z.enum(quantityUnits).optional()),
  })
  .refine((item) => item.quantity === undefined || item.quantityUnit !== undefined, {
    path: ['quantityUnit'],
    message: 'Choose a unit',
  })

const quoteFields = z.object({
  fullName: text(2, 150, 'full name'),
  email: z.string({ error: 'Enter your email address' }).trim().toLowerCase().max(254, 'Email is too long').pipe(z.email('Enter a valid email address')),
  phone: z
    .string({ error: 'Enter your phone number' })
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number (digits, spaces, + - ( ) only)'),
  company: optionalText(150),
  items: z.array(quoteItemSchema).max(MAX_QUOTE_ITEMS, `Add up to ${MAX_QUOTE_ITEMS} products per request`).default([]),
  projectType: z.preprocess(blankToUndefined, z.enum(projectTypes).optional()),
  city: text(2, 100, 'city or region'),
  deliveryLocation: optionalText(200),
  description: text(10, 5000, 'project details'),
  consent: z.literal(true, { error: 'Please confirm so we can respond to your request' }),
  /** Honeypot: humans never see or fill this. */
  website: z.string().max(0).optional(),
  /** Client clock when the form was opened; a cheap bot-timing signal, not a security boundary. */
  startedAt: z.number().int().nonnegative().optional(),
  turnstileToken: z.string().max(4096).optional(),
})

export const quoteRequestSchema = quoteFields.refine(
  (data) => new Set(data.items.map((i) => i.productSlug)).size === data.items.length,
  {
    path: ['items'],
    message: 'Each product can only be listed once',
    when: (payload) => quoteFields.shape.items.safeParse((payload.value as { items?: unknown })?.items).success,
  },
)

export type QuoteRequestInput = z.input<typeof quoteRequestSchema>
export type QuoteRequest = z.output<typeof quoteRequestSchema>

export const guestStatusSchema = z.object({
  reference: z.string().trim().toUpperCase().regex(/^NQ-[0-9A-F]{12}$/, 'Enter the reference shown after submitting, e.g. NQ-1A2B3C4D5E6F'),
  token: z.string().trim().regex(/^[A-Za-z0-9_-]{43}$/, 'Enter the tracking code exactly as shown'),
})

/** Public quote shape returned by the API: no contact details, internal notes or ownership data. */
export interface QuoteItemSummary {
  productSlug: string
  quantity: number | null
  quantityUnit: string | null
}

export interface QuoteSummary {
  reference: string
  status: QuoteStatus
  items: QuoteItemSummary[]
  projectType: string | null
  city: string
  createdAt: string
  updatedAt: string
}

export interface SubmitQuoteResponse {
  reference: string
  status: QuoteStatus
  createdAt: string
  /** Returned once, to guests only. Never stored in plain text. */
  guestToken?: string
}

export interface ApiError {
  error: string
  message: string
  fieldErrors?: Record<string, string>
}

export interface QuoteEvent {
  status: QuoteStatus
  note: string | null
  actor: 'customer' | 'staff' | 'system'
  createdAt: string
}

/** Full request for its owner (and admins): includes the owner's own contact details. */
export interface QuoteDetail extends QuoteSummary {
  fullName: string
  email: string
  phone: string
  company: string | null
  deliveryLocation: string | null
  description: string
  events: QuoteEvent[]
}

export const quoteReferencePattern = /^NQ-[0-9A-F]{12}$/

export const wishlistSchema = z.object({
  slugs: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(100),
})
