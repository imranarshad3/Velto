import { useContent, useContentReady } from '../../features/cms/context.ts'
import type { CSSProperties } from 'react'
import { ClipboardList, Compass, PackageCheck } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import Skeleton from '../../components/ui/Skeleton.tsx'
import { heroImage } from '../../data/images.ts'
import { heroStats } from '../../data/siteStats.ts'
import HeroStats from './HeroStats.tsx'
import HeroVisual from './HeroVisual.tsx'

const delay = (seconds: number) => ({ '--delay': `${seconds}s` }) as CSSProperties

/** Service value props only (derived from existing site copy): no figures, ratings or guarantees. */
const trust = [
  { icon: ClipboardList, title: 'Get a project price', text: 'Tell us what you need' },
  { icon: Compass, title: 'Find products by area', text: 'Choose the area you are working on' },
  { icon: PackageCheck, title: 'Large project orders', text: 'Ask about the amount you need' },
]

export function HeroSkeleton() {
  return (
    <section aria-labelledby="hero-title" aria-busy="true" className="relative isolate overflow-hidden bg-cream">
      <div className="container-page grid gap-[clamp(1.75rem,5vw,3rem)] py-[clamp(2rem,5vw,5rem)] sm:gap-8 lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:items-center lg:gap-10">
        <div className="relative z-10 min-w-0">
          <div className="inline-flex items-center gap-2.5">
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-forest">
              <span className="size-1.5 rounded-full bg-gold" />
            </span>
            <Skeleton className="h-4 w-44 rounded-full" />
          </div>

          <div className="mt-5 space-y-2.5 sm:mt-6">
            <Skeleton className="h-[clamp(2.5rem,1.5rem+3.6vw,4.75rem)] w-4/5 rounded-2xl" />
            <Skeleton className="h-[clamp(2.5rem,1.5rem+3.6vw,4.75rem)] w-3/5 rounded-2xl" />
          </div>

          <div className="mt-5 max-w-[29rem] space-y-2 sm:mt-6">
            <Skeleton className="h-5 w-full rounded-lg" />
            <Skeleton className="h-5 w-4/5 rounded-lg" />
          </div>

          <div className="mt-6 flex flex-col gap-3 min-[30rem]:flex-row min-[30rem]:flex-wrap sm:mt-8">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-36 rounded-xl" />
          </div>
        </div>

        <div className="relative min-w-0 aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)] bg-sand shadow-[var(--shadow-card)] ring-1 ring-ink/5 lg:aspect-[1/1.05]">
          <Skeleton className="size-full rounded-none" />
          <span className="glass-dark absolute bottom-4 left-4 rounded-full px-3 py-1">
            <Skeleton className="h-3 w-24 bg-white/20" />
          </span>
        </div>
      </div>

      <div className="container-page pb-[clamp(2rem,4vw,3rem)]">
        <ul
          aria-label="How ordering works"
          className="grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {trust.map(({ icon: Icon, title }) => (
            <li key={title} className="flex min-w-0 items-center gap-3.5 py-5 sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3.5 w-48 rounded" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function Hero() {
  const ready = useContentReady('home')
  const cms = useContent('home', 'Hero')

  if (!ready) {
    return <HeroSkeleton />
  }

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-cream">

      <div className="container-page grid gap-[clamp(1.75rem,5vw,3rem)] py-[clamp(2rem,5vw,5rem)] sm:gap-8 lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:items-center lg:gap-10">
        <div className="relative z-10 min-w-0">
          <p className="animate-rise text-[0.9375rem] font-medium text-muted" style={delay(0)}>
            {cms("field-1", "Products for building and repair")}</p>

          <h1
            id="hero-title"
            className="animate-rise mt-4 font-display text-[clamp(2.375rem,1.5rem+3.4vw,4.25rem)] text-ink sm:mt-5"
            style={delay(0.08)}
          >
            <span className="block">{cms("field-2", "Stronger Spaces.")}</span>
            <span className="block">
              {cms("field-3", "Brighter")}<span>{cms("field-4", "Tomorrows.")}</span>
            </span>
          </h1>

          <p
            className="animate-rise mt-5 max-w-[29rem] text-[clamp(1rem,0.95rem+0.35vw,1.1875rem)] leading-relaxed text-muted sm:mt-6"
            style={delay(0.16)}
          >
            {cms("field-5", "Products for building, repairs and waterproofing.")}</p>
          <p className="sr-only">{cms("field-6", "These are example images, not product photos.")}</p>

          <div className="animate-rise mt-6 flex flex-col gap-3 min-[30rem]:flex-row min-[30rem]:flex-wrap sm:mt-8" style={delay(0.24)}>
            <ButtonLink to={`${cms("field-7", "/products").split('#')[0]}#product-results`} variant="primary" size="lg" className="max-sm:w-full">
              {cms("field-8", "Shop Products")}
            </ButtonLink>
            <ButtonLink to={cms("field-9", "/solutions")} variant="secondary" size="lg" className="max-sm:w-full">
              {cms("field-10", "View Solutions")}</ButtonLink>
          </div>

          <HeroStats stats={heroStats} />
        </div>
        <div className="relative min-w-0 aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)] bg-sand shadow-[var(--shadow-card)] ring-1 ring-ink/5 lg:aspect-[1/1.05]">
          <div className="animate-[fade-in_1s_ease-out_both] size-full">
            <HeroVisual image={{ ...heroImage, src: cms('image-src', "/images/hero/hero-architecture-crop.webp"), alt: cms('image-alt', heroImage.alt) }} />
          </div>
          <span className="glass-dark absolute bottom-4 left-4 rounded-full px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.12em] text-white uppercase">
            {cms("field-11", "Concept imagery")}</span>
        </div>
      </div>

      {/* Service details stay in the page flow at every viewport size. */}
      <div className="container-page pb-[clamp(2rem,4vw,3rem)]">
        <ul
          aria-label="How ordering works"
          className="animate-rise grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          style={delay(0.32)}
        >
          {trust.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex min-w-0 items-center gap-3.5 py-5 sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-bold text-ink">{title}</span>
                <span className="block text-[0.8125rem] text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
