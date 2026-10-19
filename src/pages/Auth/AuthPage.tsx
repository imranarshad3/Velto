import { SignIn, SignUp } from '@clerk/react'
import { Navigate, useSearchParams } from 'react-router'
import { ArrowRight, ClipboardList, Heart, KeyRound, Repeat, ShieldCheck } from 'lucide-react'
import Img from '../../components/ui/Img.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { professionalImage } from '../../data/images.ts'
import { authAppearance } from '../../lib/auth/clerkAppearance.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const benefits = [
  { icon: ClipboardList, text: 'Follow your orders from checkout to delivery' },
  { icon: Heart, text: 'Keep your wishlist across devices' },
  { icon: Repeat, text: 'Keep orders and project consultations together' },
]

export default function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const auth = useAppAuth()
  const [params] = useSearchParams()
  const requested = params.get('redirect_url') ?? ''
  const returnTo = /^\/(checkout|cart|account)(?:[/?]|$)/.test(requested) && !requested.includes('\\') ? requested : '/account'
  const redirectQuery = `?redirect_url=${encodeURIComponent(returnTo)}`
  const signIn = mode === 'sign-in'
  const title = signIn ? 'Sign in to VELTO' : 'Create your VELTO account'

  if (auth.signedIn) return <Navigate to={returnTo} replace />

  return (
    <div className="relative isolate overflow-hidden bg-cream">
      <title>{`${signIn ? 'Sign In' : 'Create Account'} — VELTO`}</title>

      <div className="mx-auto max-w-[72rem] px-3 py-4 sm:px-6 sm:py-8 lg:py-12">
        <div className="animate-rise mx-auto grid max-w-[32rem] lg:max-w-[68rem] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-float)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Brand panel */}
          <section aria-labelledby="auth-brand-title" className="relative isolate hidden overflow-hidden bg-forest-deep text-white lg:block">
            <Img image={professionalImage} priority alt="" className="absolute inset-0 -z-20 size-full object-cover object-[center_30%] opacity-35" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-forest-deep via-forest-deep/85 to-forest-deep/40" />

            <div className="flex h-full flex-col gap-6 p-[clamp(1.5rem,4vw,3rem)] lg:justify-end lg:gap-8 lg:pt-[clamp(10rem,22vw,18rem)]">
              <div>
                <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
                  <span aria-hidden="true" className="h-px w-8 bg-gold/70" />
                  VELTO account
                </p>
                <h2 id="auth-brand-title" className="mt-3 font-display text-[clamp(1.625rem,1.2rem+1.6vw,2.5rem)] leading-[1.08]">
                  Your next project, <span className="text-gold">starts here.</span>
                </h2>
              </div>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-[minmax(0,1fr)]">
                {benefits.map(({ icon: Icon, text }) => (
                  <li key={text} className="glass-dark flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] leading-snug text-white/90 sm:flex-col sm:items-start lg:flex-row lg:items-center">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-gold">
                      <Icon aria-hidden="true" className="size-[1.125rem]" />
                    </span>
                    <span className="min-w-0">{text}</span>
                  </li>
                ))}
              </ul>
              <p className="hidden items-center gap-2 text-[0.8125rem] text-white/70 lg:flex">
                <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-gold" />
                Your orders, saved products and project consultations, together.
              </p>
            </div>
          </section>

          {/* Form panel */}
          <div className="flex min-w-0 flex-col justify-center px-4 py-6 sm:p-8 lg:p-10">
            <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-copper uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-copper/60" />
              {signIn ? 'Welcome back' : 'New account'}
            </p>
            {auth.mode !== 'clerk' && <><h1 id="auth-title" className="mt-2 font-display text-[clamp(1.75rem,1.35rem+1.5vw,2.5rem)] leading-[1.05] tracking-[-0.01em] text-ink">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-muted">{signIn ? 'Sign in to checkout, track orders and save your favourites.' : 'Shop with ease and keep your orders in one place.'}</p></>}
            <div className="mt-6 min-w-0">
              {auth.mode === 'clerk' ? (
                signIn ? (
                  <SignIn routing="path" path="/sign-in" signUpUrl={`/sign-up${redirectQuery}`} forceRedirectUrl={returnTo} appearance={authAppearance} />
                ) : (
                  <SignUp routing="path" path="/sign-up" signInUrl={`/sign-in${redirectQuery}`} forceRedirectUrl={returnTo} appearance={authAppearance} />
                )
              ) : (
                <div className="rounded-[var(--radius-card)] border border-border bg-canvas p-[clamp(1.25rem,3vw,1.75rem)]">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-copper-soft text-copper">
                      <KeyRound aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{import.meta.env.DEV && auth.mode === 'dev' ? 'Local dev mode: use the DEV AUTH bar to sign in.' : 'Customer accounts are not available yet.'}</p>
                      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">You can still request quotes as a guest and track them with your reference and tracking code.</p>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-cols-2">
                    <ButtonLink to="/quote">
                      Ask for a price <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
                    </ButtonLink>
                    <ButtonLink to="/track" variant="secondary">
                      Track a request
                    </ButtonLink>
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      </div>
    </div>
  )
}
