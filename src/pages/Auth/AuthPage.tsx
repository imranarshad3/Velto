import { SignIn, SignUp } from '@clerk/react'
import { Link, Navigate } from 'react-router'
import { Check } from 'lucide-react'
import Img from '../../components/ui/Img.tsx'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { professionalImage } from '../../data/images.ts'
import { clerkAppearance } from '../../lib/auth/clerkAppearance.ts'
import { useAppAuth } from '../../lib/auth/context.ts'

const benefits = ['Track every quote request in one place', 'Keep your wishlist across devices', 'Faster repeat requests with saved details']


export default function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const auth = useAppAuth()
  const title = mode === 'sign-in' ? 'Sign in to NOVARO' : 'Create your NOVARO account'

  if (auth.signedIn) return <Navigate to="/account" replace />

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-[clamp(2rem,5vw,4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
      <title>{`${mode === 'sign-in' ? 'Sign In' : 'Create Account'} — NOVARO`}</title>
      <section aria-labelledby="auth-title" className="relative hidden overflow-hidden rounded-[var(--radius-card)] bg-forest text-white lg:block">
        <div className="relative aspect-[4/3]">
          <Img image={professionalImage} priority className="absolute inset-0 size-full object-cover object-[center_30%] opacity-60" />
          <div className="absolute inset-0 bg-linear-to-t from-forest-dark via-forest-dark/60 to-transparent" />
        </div>
        <div className="relative -mt-24 p-8">
          <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-[#e3c58f] uppercase">NOVARO account</p>
          <ul className="mt-4 flex flex-col gap-2">
            {benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-[#e3c58f]" /> {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex flex-col items-center">
        <h1 id="auth-title" className="mb-6 text-center font-display text-[clamp(2rem,1.5rem+2vw,2.75rem)] leading-tight">
          {title}
        </h1>
        {auth.mode === 'clerk' ? (
          mode === 'sign-in' ? (
            <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/account" appearance={clerkAppearance} />
          ) : (
            <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/account" appearance={clerkAppearance} />
          )
        ) : (
          <div className="w-full max-w-[28rem] rounded-[var(--radius-card)] border border-border bg-surface p-6 text-center">
            <p className="font-semibold">{import.meta.env.DEV && auth.mode === 'dev' ? 'Local dev mode: use the DEV AUTH bar to sign in.' : 'Customer accounts are not available yet.'}</p>
            <p className="mt-2 text-[0.9375rem] text-muted">You can still request quotes as a guest and track them with your reference and tracking code.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/quote">Request a quote</ButtonLink>
              <ButtonLink to="/track" variant="secondary">
                Track a request
              </ButtonLink>
            </div>
          </div>
        )}
        <p className="mt-6 text-center text-[0.875rem] text-muted">
          {mode === 'sign-in' ? 'New to NOVARO? ' : 'Already have an account? '}
          <Link to={mode === 'sign-in' ? '/sign-up' : '/sign-in'} className="inline-flex min-h-11 items-center font-semibold text-forest underline">
            {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}
