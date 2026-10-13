import { z } from 'zod'

/** Shared by the contact form and the API. No relative runtime imports (loaded by serverless functions). */
export const contactTopics = ['products', 'quote', 'account', 'partnership', 'other'] as const

export const contactTopicLabels: Record<(typeof contactTopics)[number], string> = {
  products: 'Product information',
  quote: 'An existing quote request',
  account: 'My account',
  partnership: 'Trade or partnership',
  other: 'Something else',
}

const blank = (v: unknown) => (v === '' || v === null ? undefined : v)

export const contactSchema = z.object({
  fullName: z.string({ error: 'Enter your full name' }).trim().min(2, 'Enter your full name').max(150, 'Keep this under 150 characters'),
  email: z.string({ error: 'Enter your email address' }).trim().toLowerCase().max(254, 'Email is too long').pipe(z.email('Enter a valid email address')),
  phone: z.preprocess(blank, z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number').optional()),
  topic: z.enum(contactTopics, { error: 'Choose a topic' }),
  message: z.string({ error: 'Enter your message' }).trim().min(10, 'Message must be at least 10 characters').max(5000, 'Keep this under 5000 characters'),
  consent: z.literal(true, { error: 'Please confirm so we can reply to you' }),
  website: z.string().max(0).optional(),
  startedAt: z.number().int().nonnegative().optional(),
  turnstileToken: z.string().max(4096).optional(),
})

export type ContactInput = z.input<typeof contactSchema>
export type ContactMessage = z.output<typeof contactSchema>
