import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, LoaderCircle, Lock, Plus, Send, Trash } from 'lucide-react'
import { Link } from 'react-router'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import type { CatalogProduct } from '../../data/catalog.ts'
import { demoCategories } from '../../data/demoCategories.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { QuoteApiError, submitQuote } from '../../features/quotes/api.ts'
import {
  MAX_QUOTE_ITEMS,
  projectTypeLabels,
  projectTypes,
  quantityUnits,
  quoteRequestSchema,
  type QuoteRequest,
  type QuantityUnit,
  type QuoteRequestInput,
  type SubmitQuoteResponse,
} from '../../features/quotes/schema.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import Turnstile from './Turnstile.tsx'

export interface InitialItem {
  productSlug: string
  quantity?: number
  quantityUnit?: QuantityUnit
}

interface QuoteFormProps {
  initialItems: InitialItem[]
  unknownProduct: boolean
  onSuccess: (result: SubmitQuoteResponse, submittedSlugs: string[]) => void
  /** Rendered beside the form (summary sidebar), receives the currently selected product slugs. */
  aside: (slugs: string[]) => ReactNode
}

/** Visual order, so keyboard and screen-reader users land on the first problem. */
const fieldOrder = ['fullName', 'email', 'phone', 'company', 'items', 'projectType', 'description', 'city', 'deliveryLocation', 'consent'] as const

type ErrorPath = Parameters<ReturnType<typeof useForm<QuoteRequestInput, unknown, QuoteRequest>>['setError']>[0]

const turnstileEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

const groupProducts = (products: CatalogProduct[]) =>
  demoCategories
    .map((category) => ({ category, products: products.filter((p) => p.categorySlug === category.slug) }))
    .filter((group) => group.products.length > 0)

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 border-t border-border pt-6 first:border-0 first:pt-0">
      <legend className="flex items-center gap-3 font-display text-[1.375rem] text-ink">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-forest-soft font-sans text-[0.875rem] font-bold text-forest">
          {step}
        </span>
        {title}
      </legend>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export default function QuoteForm({ initialItems, unknownProduct, onSuccess, aside }: QuoteFormProps) {
  const auth = useAppAuth()
  const { products } = useCatalog()
  const productGroups = groupProducts(products)
  const [formError, setFormError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>()
  const startedAt = useRef(0)
  const errorRef = useRef<HTMLDivElement>(null)
  const onToken = useCallback((token: string | undefined) => setTurnstileToken(token), [])

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuoteRequestInput, unknown, QuoteRequest>({
    resolver: zodResolver(quoteRequestSchema),
    mode: 'onTouched',
    shouldFocusError: false,
    // `consent` must end up `true`; it starts unchecked.
    defaultValues: { items: initialItems, consent: false as unknown as true, website: '' },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = useWatch({ control, name: 'items' }) ?? []
  const selectedSlugs = watchedItems.map((item) => item?.productSlug).filter((slug): slug is string => Boolean(slug))

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  const description = useWatch({ control, name: 'description' }) ?? ''

  const onSubmit = async (values: QuoteRequest) => {
    setFormError(null)
    if (turnstileEnabled && !turnstileToken) {
      setFormError('Please complete the verification check below.')
      return
    }
    try {
      const token = auth.signedIn ? await auth.getToken() : null
      const result = await submitQuote({ ...values, startedAt: startedAt.current, turnstileToken }, token)
      onSuccess(result, values.items.map((item) => item.productSlug))
    } catch (error) {
      const apiError = error instanceof QuoteApiError ? error : new QuoteApiError(0, 'unknown', 'Something went wrong. Please try again.')
      const fieldErrors = Object.entries(apiError.fieldErrors ?? {})
      fieldErrors.forEach(([field, message]) => setError(field as ErrorPath, { type: 'server', message }))
      const firstServerField = fieldErrors[0]?.[0]
      if (firstServerField) setFocus(firstServerField as Parameters<typeof setFocus>[0])
      setFormError(`${apiError.message} Your details are still in the form.`)
      requestAnimationFrame(() => fieldErrors.length === 0 && errorRef.current?.focus())
    }
  }

  const err = (field: Exclude<keyof QuoteRequestInput, 'items'>) => errors[field]?.message as string | undefined
  const itemsError = (errors.items?.root?.message ?? errors.items?.message) as string | undefined
  const itemErr = (index: number, key: 'productSlug' | 'quantity' | 'quantityUnit') =>
    errors.items?.[index]?.[key]?.message as string | undefined

  return (
    <>
      <form
        noValidate
        onSubmit={(event) =>
          handleSubmit(onSubmit, (invalid) => {
            const first = fieldOrder.find((field) => invalid[field])
            if (first === 'items') {
              // Per-row errors arrive as a sparse array; list-level errors (e.g. duplicates) as an object.
              const rows = Array.isArray(invalid.items) ? (invalid.items as (Record<string, unknown> | undefined)[]) : []
              const index = rows.findIndex(Boolean)
              const row = rows[index]
              const key = row?.productSlug ? 'productSlug' : row?.quantity ? 'quantity' : 'quantityUnit'
              setFocus((index >= 0 ? `items.${index}.${key}` : 'items.0.productSlug') as Parameters<typeof setFocus>[0])
            } else if (first) setFocus(first)
          })(event)
        } aria-labelledby="quote-form-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(1.25rem,4vw,2.5rem)]">
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="quote-form-title" className="font-display text-[clamp(1.5rem,1.3rem+0.8vw,2rem)]">
              Quote request
            </h2>
            <p className="text-[0.875rem] text-muted">
              Fields marked <span className="text-copper">*</span> are required.
            </p>
          </div>
          {auth.enabled && auth.loaded && (
            <p className="flex items-center gap-2 rounded-xl bg-sand/70 px-3.5 py-2 text-[0.8125rem] text-ink">
              <Lock aria-hidden="true" className="size-4 shrink-0 text-forest" />
              {auth.signedIn ? (
                'Signed in: this request will appear in My quotes.'
              ) : (
                <span>
                  Submitting as a guest.{' '}
                  <Link to="/sign-in?redirect_url=%2Fquote" className="inline-flex min-h-11 items-center font-semibold text-forest underline underline-offset-2">
                  Sign in
                </Link>{' '}
                  to track it in your account (optional).
                </span>
              )}
            </p>
          )}
        </div>

        {formError && (
          <div ref={errorRef} tabIndex={-1} role="alert" className="mb-6 flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-[0.9375rem] text-danger focus:outline-none">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p>{formError}</p>
          </div>
        )}

        <div className="flex flex-col gap-8">
          <Section step={1} title="Contact details">
            <Field id="fullName" label="Full name" required error={err('fullName')}>
              {(a) => <input {...a} {...register('fullName')} autoComplete="name" className={inputClass} />}
            </Field>
            <Field id="email" label="Email" required error={err('email')}>
              {(a) => <input {...a} {...register('email')} type="email" autoComplete="email" inputMode="email" className={inputClass} />}
            </Field>
            <Field id="phone" label="Phone" required hint="Include the country code for international numbers." error={err('phone')}>
              {(a) => <input {...a} {...register('phone')} type="tel" autoComplete="tel" inputMode="tel" className={inputClass} />}
            </Field>
            <Field id="company" label="Company" error={err('company')}>
              {(a) => <input {...a} {...register('company')} autoComplete="organization" className={inputClass} />}
            </Field>
          </Section>

          <Section step={2} title="Products">
            <div className="flex flex-col gap-4 sm:col-span-2">
              {unknownProduct && (
                <p className="rounded-xl bg-sand/70 p-3 text-[0.875rem] text-ink">
                  The product in your link isn’t in our catalogue. Choose one below, or send a general enquiry.
                </p>
              )}
              {fields.length === 0 && <p className="text-[0.9375rem] text-muted">No products added: this will be sent as a general enquiry.</p>}
              {itemsError && (
                <p id="items-error" role="alert" className="text-[0.8125rem] font-semibold text-danger">
                  {itemsError}
                </p>
              )}
              <ul className="flex flex-col gap-4">
                {fields.map((field, index) => (
                  <li key={field.id} className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-canvas/60 p-3.5 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_auto] sm:items-start">
                    <Field id={`items.${index}.productSlug`} label={`Product ${index + 1}`} required className="col-span-2 sm:col-span-1" error={itemErr(index, 'productSlug')}>
                      {(a) => (
                        <select {...a} {...register(`items.${index}.productSlug`)} className={inputClass}>
                          <option value="">Choose a product</option>
                          {productGroups.map(({ category, products: groupItems }) => (
                            <optgroup key={category.slug} label={category.name}>
                              {groupItems.map((p) => (
                                <option key={p.slug} value={p.slug}>
                                  {p.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </Field>
                    <Field id={`items.${index}.quantity`} label="Quantity" error={itemErr(index, 'quantity')}>
                      {(a) => <input {...a} {...register(`items.${index}.quantity`)} type="number" inputMode="decimal" min="0" step="any" className={inputClass} />}
                    </Field>
                    <Field id={`items.${index}.quantityUnit`} label="Unit" error={itemErr(index, 'quantityUnit')}>
                      {(a) => (
                        <select {...a} {...register(`items.${index}.quantityUnit`)} className={inputClass}>
                          <option value="">Unit</option>
                          {quantityUnits.map((u) => (
                            <option key={u} value={u}>
                              {u[0].toUpperCase() + u.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-[0.875rem] font-semibold text-muted hover:bg-sand hover:text-danger sm:col-span-1 sm:mt-[1.8rem]"
                      aria-label={`Remove product ${index + 1}`}
                    >
                      <Trash aria-hidden="true" className="size-4" /> <span className="sm:sr-only">Remove</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => append({ productSlug: '' })}
                disabled={fields.length >= MAX_QUOTE_ITEMS}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-dashed border-forest/50 px-4 text-[0.875rem] font-semibold text-forest hover:border-forest hover:bg-forest-soft disabled:opacity-50"
              >
                <Plus aria-hidden="true" className="size-4" /> {fields.length ? 'Add another product' : 'Add a product'}
              </button>
            </div>
          </Section>

          <Section step={3} title="Project">
            <Field id="projectType" label="Project type" error={err('projectType')}>
              {(a) => (
                <select {...a} {...register('projectType')} className={inputClass}>
                  <option value="">Select type</option>
                  {projectTypes.map((t) => (
                    <option key={t} value={t}>
                      {projectTypeLabels[t]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <div className="hidden sm:block" />
            <Field
              id="description"
              label="Project details"
              required
              className="sm:col-span-2"
              hint={`Surfaces, areas, timeline and anything else that helps. ${description.length}/5000`}
              error={err('description')}
            >
              {(a) => <textarea {...a} {...register('description')} rows={6} maxLength={5000} className={`${inputClass} min-h-[9rem] py-3`} />}
            </Field>
          </Section>

          <Section step={4} title="Delivery">
            <Field id="city" label="City / region" required error={err('city')}>
              {(a) => <input {...a} {...register('city')} autoComplete="address-level2" className={inputClass} />}
            </Field>
            <Field id="deliveryLocation" label="Site / area" hint="An area or site name is enough; no full address needed." error={err('deliveryLocation')}>
              {(a) => <input {...a} {...register('deliveryLocation')} className={inputClass} />}
            </Field>
          </Section>

          <Section step={5} title="Confirm">
            <div className="sm:col-span-2">
              <label htmlFor="consent" className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem]">
                <input
                  id="consent"
                  type="checkbox"
                  {...register('consent')}
                  aria-invalid={Boolean(err('consent'))}
                  aria-describedby={err('consent') ? 'consent-error' : undefined}
                  className="mt-1 size-[1.125rem] shrink-0 accent-forest"
                />
                <span>
                  I agree that NOVARO may use these details to respond to this quote request. See our{' '}
                  <Link to="/privacy" className="font-semibold text-forest underline underline-offset-2">
                    privacy policy
                  </Link>
                  . <span className="text-copper" aria-hidden="true">*</span>
                </span>
              </label>
              {err('consent') && (
                <p id="consent-error" className="mt-1 text-[0.8125rem] font-semibold text-danger">
                  {err('consent')}
                </p>
              )}
            </div>

            {/* Honeypot: hidden from people and assistive tech; bots that fill it are rejected server-side. */}
            <div aria-hidden="true" className="absolute -left-[100vw] size-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>

            <div className="sm:col-span-2">
              <Turnstile onToken={onToken} />
            </div>
          </Section>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8125rem] text-muted">We only use your details to respond to this request.</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-forest px-7 font-semibold text-white transition-colors hover:bg-forest-dark disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Sending…
              </>
            ) : (
              <>
                Send quote request <Send aria-hidden="true" className="size-4" />
              </>
            )}
          </button>
        </div>
      </form>
      {aside(selectedSlugs)}
    </>
  )
}
