import type { CSSProperties } from 'react'
import { ArrowRight, Diamond } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { heroImage } from '../../data/images.ts'
import { heroStats } from '../../data/siteStats.ts'
import HeroStats from './HeroStats.tsx'
import HeroVisual from './HeroVisual.tsx'

const delay = (seconds: number) => ({ '--delay': `${seconds}s` }) as CSSProperties

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-[#f6f1e9]"
    >
      <div className="container-page grid pt-[clamp(2rem,5vw,4rem)] pb-[clamp(2.5rem,5vw,4.5rem)] lg:min-h-[clamp(34rem,68vh,44rem)] lg:grid-cols-[42fr_58fr] lg:items-center">
        <div className="relative z-10 lg:pr-4">
          <p
            className="animate-rise inline-flex items-center gap-2 rounded-full bg-sand-deep/70 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-forest"
            style={delay(0)}
          >
            <Diamond aria-hidden="true" className="size-3 fill-current" />
            Premium Construction Solutions
          </p>

          <h1
            id="hero-title"
            className="animate-rise mt-5 font-display text-[length:var(--h1)] leading-[1.02] tracking-[-0.01em] text-ink"
            style={delay(0.08)}
          >
            <span className="lg:block">Stronger</span> <span className="lg:block">Spaces.</span>{' '}
            <span className="text-forest lg:block">Brighter</span> <span className="lg:block">Tomorrows.</span>
          </h1>

          <p
            className="animate-rise mt-5 max-w-[30rem] text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] leading-relaxed text-muted"
            style={delay(0.16)}
          >
            Construction chemical solutions for every build — from homes to large infrastructure projects.
          </p>
          <p className="sr-only">Imagery on this page is illustrative and not official product photography.</p>

          <div className="animate-rise mt-8 flex flex-wrap gap-3" style={delay(0.24)}>
            <ButtonLink to="/products" className="px-6">
              Shop Products <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink to="/solutions" variant="secondary" className="px-6">
              View Solutions
            </ButtonLink>
          </div>

          <HeroStats stats={heroStats} />
        </div>
      </div>

      <div className="relative mx-[var(--page-gutter)] mb-[clamp(2.5rem,5vw,4rem)] aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)] sm:aspect-[16/10] lg:absolute lg:inset-y-0 lg:right-0 lg:m-0 lg:aspect-auto lg:w-[60%] lg:rounded-none lg:shadow-none">
        <div className="animate-[fade-in_1s_ease-out_both] size-full">
          <HeroVisual image={heroImage} />
        </div>
        {/* Blend the visual into the copy column on wide screens. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-2/5 bg-linear-to-r from-[#f6f1e9] via-[#f6f1e9]/70 to-transparent lg:block"
        />

      </div>
    </section>
  )
}
