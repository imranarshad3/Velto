import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { CircleAlert, CircleCheck, ClipboardList, LifeBuoy, LoaderCircle, Search, Send } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Field, { inputClass } from '../../components/ui/form/Field.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { contactSchema, contactTopicLabels, contactTopics, type ContactInput, type ContactMessage } from '../../features/contact/schema.ts'
import { QuoteApiError, sendContactMessage } from '../../features/quotes/api.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const shortcuts = [
  { icon: ClipboardList, title: 'Need prices or availability?', text: 'A quote request is the fastest route.', to: '/quote', cta: 'Request a quote' },
  { icon: Search, title: 'Following up a request?', text: 'Check its status with your reference.', to: '/track', cta: 'Track a request' },
  { icon: LifeBuoy, title: 'Quick question?', text: 'Many answers are already in our FAQ.', to: '/faq', cta: 'Read the FAQ' },
]

const order = ['fullName', 'email', 'phone', 'topic', 'message', 'consent'] as const

export default function ContactPage() {
  const auth = useAppAuth()
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
    defaultValues: { fullName: auth.user?.name ?? '', email: auth.user?.email ?? '', consent: false as unknown as true, website: '' },
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

  return (
    <>
      <title>Contact — NOVARO</title>
      <meta name="description" content="Send NOVARO a message about products, quotes or your account." />
      <PageHeader eyebrow="Contact" title="How can we help?" crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} description="Send us a message and our team will reply by email." />

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-[clamp(2rem,4vw,3.5rem)] pb-[var(--section-gap)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:gap-10">
        {sent ? (
          <section aria-labelledby="sent-title" className="animate-rise rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(1.25rem,4vw,2.5rem)]">
            <CircleCheck aria-hidden="true" className="size-12 text-forest" />
            <h2 id="sent-title" ref={sentRef} tabIndex={-1} className="mt-4 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] focus:outline-none">
              Message sent
            </h2>
            <p className="mt-2 text-muted">Thank you. We’ll reply to the email address you provided.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setSent(false)} className="inline-flex min-h-11 items-center rounded-lg border border-ink/15 bg-surface px-5 font-semibold hover:border-forest">
                Send another message
              </button>
              <ButtonLink to="/products" variant="ghost">
                Browse products
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
            className="rounded-[var(--radius-card)] border border-border bg-surface p-[clamp(1.25rem,4vw,2.5rem)]"
          >
            <h2 id="contact-form-title" className="font-display text-[clamp(1.5rem,1.3rem+0.8vw,2rem)]">
              Send a message
            </h2>
            <p className="text-[0.875rem] text-muted">
              Fields marked <span className="text-copper">*</span> are required.
            </p>
            {formError && (
              <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <p>{formError}</p>
              </div>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
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
                      Choose a topic
                    </option>
                    {contactTopics.map((t) => (
                      <option key={t} value={t}>
                        {contactTopicLabels[t]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field id="message" label="Message" required className="sm:col-span-2" error={err('message')}>
                {(a) => <textarea {...a} {...register('message')} rows={6} maxLength={5000} className={`${inputClass} min-h-[9rem] py-3`} />}
              </Field>
              <div className="sm:col-span-2">
                <label htmlFor="consent" className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem]">
                  <input id="consent" type="checkbox" {...register('consent')} aria-invalid={Boolean(err('consent'))} aria-describedby={err('consent') ? 'consent-error' : undefined} className="mt-1 size-[1.125rem] shrink-0 accent-forest" />
                  <span>
                    I agree that NOVARO may use these details to reply to my message. See our{' '}
                    <Link to="/privacy" className="font-semibold text-forest underline">
                      privacy policy
                    </Link>
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
                <label htmlFor="website">Website</label>
                <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
              </div>
            </div>
            <div className="mt-8 flex justify-end border-t border-border pt-6">
              <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-forest px-7 font-semibold text-white hover:bg-forest-dark disabled:opacity-70">
                {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
                {isSubmitting ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>
        )}

        <aside aria-label="Other ways to get help" className="flex flex-col gap-3">
          {shortcuts.map(({ icon: Icon, title, text, to, cta }) => (
            <section key={title} className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <Icon aria-hidden="true" className="size-6 text-copper" />
              <h2 className="mt-2 font-bold">{title}</h2>
              <p className="text-[0.875rem] text-muted">{text}</p>
              <Link to={to} className="mt-1 inline-flex min-h-11 items-center font-semibold text-forest hover:underline">
                {cta}
              </Link>
            </section>
          ))}
        </aside>
      </div>
    </>
  )
}
