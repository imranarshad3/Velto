import { SignIn, SignUp } from '@clerk/react'
import { Link, Navigate } from 'react-router'
import { ArrowRight, ClipboardList, Heart, KeyRound, Repeat, ShieldCheck } from 'lucide-react'
import Img from '../../components/ui/Img.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { professionalImage } from '../../data/images.ts'
import { clerkAppearance } from '../../lib/auth/clerkAppearance.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const benefits = [
  { icon: ClipboardList, text: 'Track every quote request in one place' },
  { icon: Heart, text: 'Keep your wishlist across devices' },
  { icon: Repeat, text: 'Faster repeat requests with saved details' },
]

/** Clerk widget tuned to sit flush inside VELTO's form card (shared base stays in lib/auth). */
const authAppearance = {
  ...clerkAppearance,
  variables: {
    ...clerkAppearance.variables,
    colorTextSecondary: '#5c625e',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorDanger: '#b42318',
    colorSuccess: '#1f6b45',
  },
  elements: {
    ...clerkAppearance.elements,
    rootBox: 'w-full',
    cardBox: 'w-full max-w-none shadow-none border-0 rounded-none',
    card: 'w-full max-w-none shadow-none border-0 bg-transparent px-0 py-0',
    headerTitle: 'font-display text-[1.5rem] font-normal text-ink',
    formButtonPrimary: 'min-h-11 rounded-xl text-[0.9375rem] font-semibold normal-case shadow-[var(--shadow-button)]',
    formFieldInput: 'min-h-11 rounded-xl',
    socialButtonsBlockButton: 'min-h-11 rounded-xl',
    footer: 'bg-transparent',
    footerActionLink: 'font-semibold text-forest',
  },
}

export default function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const auth = useAppAuth()
  const signIn = mode === 'sign-in'
  const title = signIn ? 'Sign in to VELTO' : 'Create your VELTO account'

  if (auth.signedIn) return <Navigate to="/account" replace />

  return (
    <div className="relative isolate overflow-hidden bg-cream">
      <title>{`${signIn ? 'Sign In' : 'Create Account'} — VELTO`}</title>

      <div className="container-page py-[clamp(1.5rem,5vw,4.5rem)]">
        <div className="animate-rise mx-auto grid max-w-[68rem] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-float)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Brand panel */}
          <section aria-labelledby="auth-brand-title" className="relative isolate overflow-hidden bg-forest-deep text-white">
            <Img image={professionalImage} priority alt="" className="absolute inset-0 -z-20 size-full object-cover object-[center_30%] opacity-35" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-forest-deep via-forest-deep/85 to-forest-deep/40" />

            <div className="flex h-full flex-col gap-6 p-[clamp(1.5rem,4vw,3rem)] lg:justify-end lg:gap-8 lg:pt-[clamp(10rem,22vw,18rem)]">
              <div>
                <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
                  <span aria-hidden="true" className="h-px w-8 bg-gold/70" />
                  VELTO account
                </p>
                <h2 id="auth-brand-title" className="mt-3 font-display text-[clamp(1.625rem,1.2rem+1.6vw,2.5rem)] leading-[1.08]">
                  Your project requests, <span className="text-gold">kept in one place.</span>
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
                Guest quote requests stay available without an account.
              </p>
            </div>
          </section>

          {/* Form panel */}
          <div className="flex flex-col justify-center p-[clamp(1.5rem,4.5vw,3.5rem)]">
            <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-copper uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-copper/60" />
              {signIn ? 'Welcome back' : 'New account'}
            </p>
            <h1 id="auth-title" className="mt-2 font-display text-[clamp(2rem,1.55rem+1.8vw,2.75rem)] leading-[1.05] tracking-[-0.01em] text-ink">
              {title}
            </h1>

            <div className="mt-6">
              {auth.mode === 'clerk' ? (
                signIn ? (
                  <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/account" appearance={authAppearance} />
                ) : (
                  <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/account" appearance={authAppearance} />
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
                      Request a quote <ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
                    </ButtonLink>
                    <ButtonLink to="/track" variant="secondary">
                      Track a request
                    </ButtonLink>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-6 border-t border-border pt-4 text-[0.9375rem] text-muted">
              {signIn ? 'New to VELTO? ' : 'Already have an account? '}
              <Link to={signIn ? '/sign-up' : '/sign-in'} className="inline-flex min-h-11 items-center font-semibold text-forest underline decoration-copper/50 underline-offset-4 hover:decoration-copper">
                {signIn ? 'Create an account' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
