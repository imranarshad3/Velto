import { useContent, useContentReady } from '../../features/cms/context.ts'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, CircleAlert, CircleCheck, ClipboardList, LifeBuoy, LoaderCircle, Mail, Search, Send, ShieldCheck } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow, buttonClass } from '../../components/ui/button.ts'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import PageHeader, { PageHeaderSkeleton } from '../../components/ui/PageHeader.tsx'
import { contactSchema, contactTopicLabels, contactTopics, type ContactInput, type ContactMessage } from '../../features/contact/schema.ts'
import { QuoteApiError, sendContactMessage } from '../../features/quotes/api.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const shortcuts = [
  { icon: ClipboardList, title: 'Need a price or product details?', text: 'Ask for a price and we’ll check for you.', to: '/quote', cta: 'Ask for a price' },
  { icon: Search, title: 'Checking on a request?', text: 'Check its status with your reference.', to: '/track', cta: 'Track a request' },
  { icon: LifeBuoy, title: 'Have a question?', text: 'Many answers are already in our FAQ.', to: '/faq', cta: 'Read the FAQ' },
]

const order = ['fullName', 'email', 'phone', 'topic', 'message', 'consent'] as const

export default function ContactPage() {
  const ready = useContentReady('contact')
  const cms = useContent('contact', 'ContactPage')
  const auth = useAppAuth()
  const [params] = useSearchParams()
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const startedAt = useRef(0)
  const sentRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])
  useEffect(() => {
    if (sent) sentRef.current?.focus()
  }, [sent])

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput, unknown, ContactMessage>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    shouldFocusError: false,
    defaultValues: {
      fullName: auth.user?.name ?? '',
      email: auth.user?.email ?? '',
      // Deep links (e.g. "Request a document" in the Resource Center) may preselect a topic and start the message.
      ...(contactTopics.includes(params.get('topic') as (typeof contactTopics)[number]) ? { topic: params.get('topic') as (typeof contactTopics)[number] } : {}),
      ...(params.get('message') ? { message: params.get('message')!.slice(0, 1000) } : {}),
      consent: false as unknown as true,
      website: '',
    },
  })

  const onSubmit = async (values: ContactMessage) => {
    setFormError(null)
    try {
      await sendContactMessage({ ...values, startedAt: startedAt.current }, auth.signedIn ? await auth.getToken() : null)
      reset()
      setSent(true)
    } catch (error) {
      const e = error instanceof QuoteApiError ? error : new QuoteApiError(0, 'unknown', 'Something went wrong. Please try again.')
      const fields = Object.entries(e.fieldErrors ?? {})
      fields.forEach(([field, message]) => setError(field as keyof ContactInput, { type: 'server', message }))
      if (fields[0]) setFocus(fields[0][0] as keyof ContactInput)
      setFormError(`${e.message} Your message is still in the form.`)
    }
  }
  const err = (f: keyof ContactInput) => errors[f]?.message as string | undefined

  if (!ready) {
    return (
      <>
        <title>Contact — VELTO</title>
        <PageHeaderSkeleton aside />
      </>
    )
  }

  return (
    <>
      <title>{cms("field-1", "Contact — VELTO")}</title>
      <meta name="description" content={cms("field-2", "Send VELTO a message about products, quotes or your account.")} />
      <PageHeader
        eyebrow={cms("field-3", "Contact")}
        title={cms("field-4", "How can we help?")}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
        description={cms("field-5", "Send us a message and our team will reply by email.")}
        aside={
          <div className="glass flex w-[clamp(18rem,24vw,22rem)] items-center gap-4 rounded-[var(--radius-panel)] p-5 shadow-[var(--shadow-card)]">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(180deg,var(--color-forest-mid),var(--color-forest))] text-white shadow-[var(--shadow-button)]">
              <Mail aria-hidden="true" className="size-5" />
            </span>
            <p className="min-w-0 text-[0.875rem] leading-snug text-muted">
              <span className="block font-bold text-ink">{cms("field-6", "Replies by email")}</span>
              {cms("field-7", "To the address you give in the form.")}</p>
          </div>
        }
      />

      <div className="relative bg-canvas">
        <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-[var(--content-pad)] pb-[var(--section-gap)] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start xl:gap-10">
          {sent ? (
            <section aria-labelledby="sent-title" className="animate-rise relative isolate overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface p-[clamp(1.5rem,5vw,3.5rem)] shadow-[var(--shadow-card)]">
              <span className="grid size-16 place-items-center rounded-full bg-success-soft text-success ring-8 ring-success-soft/50">
                <CircleCheck aria-hidden="true" className="size-8" />
              </span>
              <h2 id="sent-title" ref={sentRef} tabIndex={-1} className="mt-6 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-tight focus:outline-none">
                {cms("field-8", "Message sent")}</h2>
              <p className="mt-2 max-w-[32rem] text-muted">{cms("field-9", "Thank you. We’ll reply to the email address you provided.")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => setSent(false)} className={buttonClass('secondary', 'md')}>
                  {cms("field-10", "Send another message")}</button>
                <ButtonLink to={`${cms("field-11", "/products").split('#')[0]}#product-results`} variant="ghost">
                  {cms("field-12", "Browse products ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
                </ButtonLink>
              </div>
            </section>
          ) : (
            <form
              noValidate
              aria-labelledby="contact-form-title"
              onSubmit={(event) =>
                handleSubmit(onSubmit, (invalid) => {
                  const first = order.find((f) => invalid[f])
                  if (first) setFocus(first)
                })(event)
              }
              className="relative overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-card)]"
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-forest),var(--color-copper))]" />
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border px-[clamp(1.25rem,4vw,2.5rem)] pt-[clamp(1.5rem,4vw,2.5rem)] pb-5">
                <h2 id="contact-form-title" className="font-display text-[clamp(1.625rem,1.35rem+1vw,2.25rem)] leading-tight">
                  {cms("field-13", "Send a message")}</h2>
                <p className="text-[0.875rem] text-muted">
                  {cms("field-14", "Fields marked ")}<span className="text-copper">*</span> {cms("field-15", " are required.")}</p>
              </div>
              <div className="px-[clamp(1.25rem,4vw,2.5rem)] py-[clamp(1.5rem,3vw,2rem)]">
                {formError && (
                  <div role="alert" className="mb-6 flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-danger">
                    <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                    <p>{formError}</p>
                  </div>
                )}
                <p aria-hidden="true" className="flex items-center gap-3 text-[0.6875rem] font-bold tracking-[0.2em] text-copper uppercase">
                  <span className="font-display text-[1rem] tracking-normal text-copper/80">01</span>
                  {cms("field-16", "Your details")}<span className="h-px flex-1 bg-border" />
                </p>
                <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-2">
                  <Field id="fullName" label="Full name" required error={err('fullName')}>
                    {(a) => <input {...a} {...register('fullName')} autoComplete="name" className={inputClass} />}
                  </Field>
                  <Field id="email" label="Email" required error={err('email')}>
                    {(a) => <input {...a} {...register('email')} type="email" autoComplete="email" className={inputClass} />}
                  </Field>
                  <Field id="phone" label="Phone" error={err('phone')}>
                    {(a) => <input {...a} {...register('phone')} type="tel" autoComplete="tel" className={inputClass} />}
                  </Field>
                  <Field id="topic" label="Topic" required error={err('topic')}>
                    {(a) => (
                      <select {...a} {...register('topic')} className={inputClass} defaultValue="">
                        <option value="" disabled>
                          {cms("field-17", "Choose a topic")}</option>
                        {contactTopics.map((t) => (
                          <option key={t} value={t}>
                            {contactTopicLabels[t]}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>
                <p aria-hidden="true" className="mt-9 flex items-center gap-3 text-[0.6875rem] font-bold tracking-[0.2em] text-copper uppercase">
                  <span className="font-display text-[1rem] tracking-normal text-copper/80">02</span>
                  {cms("field-18", "Your message")}<span className="h-px flex-1 bg-border" />
                </p>
                <div className="relative mt-5 grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)]">
                  <Field id="message" label="Message" required error={err('message')}>
                    {(a) => <textarea {...a} {...register('message')} rows={6} maxLength={5000} className={`${inputClass} min-h-[10rem] resize-y py-3 leading-relaxed`} />}
                  </Field>
                  <div className="rounded-xl bg-canvas p-4 ring-1 ring-border">
                    <label htmlFor="consent" className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed">
                      <input id="consent" type="checkbox" {...register('consent')} aria-invalid={Boolean(err('consent'))} aria-describedby={err('consent') ? 'consent-error' : undefined} className="mt-1 size-[1.125rem] shrink-0 accent-forest" />
                      <span>
                        {cms("field-19", "I agree that VELTO may use these details to reply to my message. See our")}{' '}
                        <Link to={cms("field-20", "/privacy")} className="font-semibold text-forest underline underline-offset-2">
                          {cms("field-21", "privacy policy")}</Link>
                        . <span aria-hidden="true" className="text-copper">*</span>
                      </span>
                    </label>
                    {err('consent') && (
                      <p id="consent-error" className="mt-1 text-[0.8125rem] font-semibold text-danger">
                        {err('consent')}
                      </p>
                    )}
                  </div>
                  <div aria-hidden="true" className="absolute -left-[100vw] size-px overflow-hidden">
                    <label htmlFor="website">{cms("field-22", "Website")}</label>
                    <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col-reverse items-stretch gap-4 border-t border-border bg-canvas/60 px-[clamp(1.25rem,4vw,2.5rem)] py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-[0.8125rem] text-muted">
                  <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-forest" />
                  {cms("field-23", "We use these details to reply to you.")}</p>
                <button type="submit" disabled={isSubmitting} className={buttonClass('primary', 'lg')}>
                  {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
                  {isSubmitting ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>
          )}

          <aside aria-label="Other ways to get help" className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
            <div className="relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep p-6 text-white shadow-[var(--shadow-float)]">
              <p className="flex items-center gap-3 text-[0.6875rem] font-bold tracking-[0.2em] text-gold uppercase">
                <span aria-hidden="true" className="h-px w-6 bg-gold/70" />
                {cms("field-24", "Before you write")}</p>
              <p className="mt-3 font-display text-[1.5rem] leading-tight">{cms("field-25", "The quickest route depends on what you need.")}</p>
            </div>
            <ul className="flex flex-col gap-3">
              {shortcuts.map(({ icon: Icon, title, text, to, cta }) => (
                <li key={title}>
                  <section aria-label={title} className="group surface-card flex gap-4 p-5 transition-[box-shadow,border-color] duration-300 hover:border-forest/25 hover:shadow-[var(--shadow-lift)]">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-copper-soft text-copper">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-bold leading-snug">{title}</h2>
                      <p className="mt-0.5 text-[0.875rem] text-muted">{text}</p>
                      <Link to={to} className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold text-forest hover:underline">
                        {cta} <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </section>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </>
  )
}
