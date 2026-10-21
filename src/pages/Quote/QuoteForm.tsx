import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, LoaderCircle, Lock, Package, Plus, Send, ShieldCheck, Trash } from 'lucide-react'
import { Link } from 'react-router'
import { buttonClass } from '../../components/ui/button.ts'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import type { CatalogProduct } from '../../data/catalog.ts'
import type { Category } from '../../data/demoCategories.ts'
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

const groupProducts = (products: CatalogProduct[], categories: Pick<Category, 'slug' | 'name'>[]) =>
  [
    ...categories,
    // Products in hidden categories are still quotable.
    ...new Map(products.filter((p) => !categories.some((c) => c.slug === p.categorySlug)).map((p) => [p.categorySlug, { slug: p.categorySlug, name: p.categoryName || p.categorySlug.replaceAll('-', ' ') }])).values(),
  ]
    .map((category) => ({ category, products: products.filter((p) => p.categorySlug === category.slug) }))
    .filter((group) => group.products.length > 0)

function Section({ step, title, description, children }: { step: number; title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="relative min-w-0 rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(1.25rem,3.5vw,2rem)] shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-300 ease-[var(--ease-premium)] focus-within:border-forest/30 focus-within:shadow-[var(--shadow-card)]">
      <legend className="float-left flex w-full items-center gap-3.5 font-display text-[clamp(1.25rem,1.15rem+0.4vw,1.5rem)] leading-tight text-ink">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(180deg,var(--color-forest-mid),var(--color-forest))] font-sans text-[0.9375rem] font-bold text-white shadow-[var(--shadow-button)] tabular-nums">
          {String(step).padStart(2, '0')}
        </span>
        <span className="min-w-0">{title}</span>
      </legend>
      {description && <p className="clear-left pt-2 pl-[3.375rem] text-[0.875rem] text-muted">{description}</p>}
      <div className="clear-left grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] pt-6 md:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export default function QuoteForm({ initialItems, unknownProduct, onSuccess, aside }: QuoteFormProps) {
  const auth = useAppAuth()
  const { products, categories } = useCatalog()
  const productGroups = groupProducts(products, categories)
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
        } aria-labelledby="quote-form-title" aria-busy={isSubmitting} className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.75rem] font-bold tracking-[0.18em] text-forest uppercase">Five easy steps</p>
            <h2 id="quote-form-title" className="mt-1 font-display text-[clamp(1.625rem,1.35rem+0.9vw,2.125rem)] leading-tight">
              Project price
            </h2>
            <p className="mt-1 text-[0.875rem] text-muted">
              Fields marked <span className="text-forest">*</span> are required.
            </p>
          </div>
          {auth.enabled && auth.loaded && (
            <p className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-1.5 text-[0.8125rem] text-ink shadow-[var(--shadow-soft)] sm:max-w-[24rem]">
              <Lock aria-hidden="true" className="size-4 shrink-0 text-forest" />
              {auth.signedIn ? (
                'Signed in: you can follow this request in your account.'
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
          <div ref={errorRef} tabIndex={-1} role="alert" className="flex gap-3 rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft p-4 text-[0.9375rem] text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p>{formError}</p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          <Section step={1} title="Contact details" description="So we know where to send your price.">
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

          <Section step={2} title="Products" description="Choose products and add how much you need, if you know.">
            <div className="flex flex-col gap-4 md:col-span-2">
              {unknownProduct && (
                <p className="rounded-xl border border-copper/25 bg-copper-soft/60 p-3.5 text-[0.875rem] text-ink">
                  The product in your link is not listed. Choose another product or send us a message.
                </p>
              )}
              {fields.length === 0 && (
                <p className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-canvas p-4 text-[0.9375rem] text-muted">
                  <Package aria-hidden="true" className="size-5 shrink-0 text-forest/70" />
                  No products added: this will be sent as a general enquiry.
                </p>
              )}
              {itemsError && (
                <p id="items-error" role="alert" className="text-[0.8125rem] font-semibold text-danger">
                  {itemsError}
                </p>
              )}
              <ul className="flex flex-col gap-3">
                {fields.map((field, index) => (
                  <li key={field.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-[var(--grid-gap)] rounded-xl border border-border bg-canvas/70 p-4 transition-colors hover:border-forest/25 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_auto] sm:items-start">
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
                      className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-[0.875rem] font-semibold text-muted transition-colors hover:border-danger/30 hover:bg-danger-soft hover:text-danger sm:col-span-1 sm:mt-[1.8rem] sm:min-h-12 sm:border-transparent sm:bg-transparent"
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
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-forest/40 bg-forest-soft/30 px-4 text-[0.9375rem] font-semibold text-forest transition-colors duration-200 hover:border-forest hover:bg-forest-soft disabled:opacity-50 sm:w-fit"
              >
                <Plus aria-hidden="true" className="size-4" /> {fields.length ? 'Add another product' : 'Add a product'}
              </button>
            </div>
          </Section>

          <Section step={3} title="Project" description="A few details help us suggest the right products.">
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
            <div className="hidden md:block" />
            <Field
              id="description"
              label="Project details"
              required
              className="md:col-span-2"
              hint={`Surfaces, areas, timeline and anything else that helps. ${description.length}/5000`}
              error={err('description')}
            >
              {(a) => <textarea {...a} {...register('description')} rows={6} maxLength={5000} className={`${inputClass} min-h-[9rem] py-3`} />}
            </Field>
          </Section>

          <Section step={4} title="Delivery" description="Where you need the products.">
            <Field id="city" label="City / region" required error={err('city')}>
              {(a) => <input {...a} {...register('city')} autoComplete="address-level2" className={inputClass} />}
            </Field>
            <Field id="deliveryLocation" label="Site / area" hint="An area or site name is enough; no full address needed." error={err('deliveryLocation')}>
              {(a) => <input {...a} {...register('deliveryLocation')} className={inputClass} />}
            </Field>
          </Section>

          <Section step={5} title="Confirm">
            <div className="md:col-span-2">
              <label htmlFor="consent" className="flex min-h-11 cursor-pointer items-start gap-3.5 rounded-xl border border-border bg-canvas/70 p-4 text-[0.9375rem] leading-relaxed transition-colors hover:border-forest/30 has-[:checked]:border-forest/40 has-[:checked]:bg-forest-soft/50 has-[:focus-visible]:outline-[0.1875rem] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest has-[[aria-invalid=true]]:border-danger/40 has-[[aria-invalid=true]]:bg-danger-soft/40">
                <input
                  id="consent"
                  type="checkbox"
                  {...register('consent')}
                  aria-invalid={Boolean(err('consent'))}
                  aria-describedby={err('consent') ? 'consent-error' : undefined}
                  className="mt-1 size-5 shrink-0 cursor-pointer accent-forest"
                />
                <span>
                  I agree that VELTO may use these details to send me a project price. See our{' '}
                  <Link to="/privacy" className="font-semibold text-forest underline underline-offset-2">
                    privacy policy
                  </Link>
                  . <span className="text-forest" aria-hidden="true">*</span>
                </span>
              </label>
              {err('consent') && (
                <p id="consent-error" className="mt-2 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-danger before:size-1.5 before:shrink-0 before:rounded-full before:bg-danger">
                  {err('consent')}
                </p>
              )}
            </div>

            {/* Honeypot: hidden from people and assistive tech; bots that fill it are rejected server-side. */}
            <div aria-hidden="true" className="absolute -left-[100vw] size-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>

            <div className="empty:hidden md:col-span-2">
              <Turnstile onToken={onToken} />
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-forest/15 bg-forest-soft/50 p-[clamp(1.25rem,3vw,1.5rem)] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-start gap-2.5 text-[0.875rem] text-ink">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0 text-forest" />
            We only use your details to respond to this request.
          </p>
          <button type="submit" disabled={isSubmitting} className={buttonClass('primary', 'lg', 'w-full disabled:pointer-events-auto disabled:cursor-wait disabled:opacity-80 sm:w-auto')}>
            {isSubmitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Sending…
              </>
            ) : (
              <>
                Send price request <Send aria-hidden="true" className="size-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </>
            )}
          </button>
        </div>
      </form>
      {aside(selectedSlugs)}
    </>
  )
}
