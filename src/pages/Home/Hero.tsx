import { useContent } from '../../features/cms/context.ts'
import type { CSSProperties } from 'react'
import { ArrowRight, ClipboardList, Compass, PackageCheck } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import { buttonArrow } from '../../components/ui/button.ts'
import { heroImage } from '../../data/images.ts'
import { heroStats } from '../../data/siteStats.ts'
import HeroStats from './HeroStats.tsx'
import HeroVisual from './HeroVisual.tsx'

const delay = (seconds: number) => ({ '--delay': `${seconds}s` }) as CSSProperties

/** Service value props only (derived from existing site copy): no figures, ratings or guarantees. */
const trust = [
  { icon: ClipboardList, title: 'Quote-based ordering', text: 'Request pricing for your project' },
  { icon: Compass, title: 'Application guidance', text: 'Match products to the surface' },
  { icon: PackageCheck, title: 'Project & bulk requests', text: 'Quantities for larger jobs' },
]

export default function Hero() {
  const cms = useContent('home', 'Hero')
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-cream">

      <div className="container-page grid pt-[clamp(2rem,5vw,4.5rem)] pb-[clamp(2rem,4vw,4.5rem)] lg:min-h-[clamp(38rem,76vh,48rem)] lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:items-center">
        <div className="relative z-10 min-w-0 lg:pr-6">
          <p
            className="animate-rise glass inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 text-[0.8125rem] font-semibold text-forest shadow-[var(--shadow-soft)]"
            style={delay(0)}
          >
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-forest">
              <span className="size-1.5 rounded-full bg-gold" />
            </span>
            {cms("field-1", "Premium Construction Solutions")}</p>

          <h1
            id="hero-title"
            className="animate-rise mt-6 font-display text-[clamp(2.75rem,1.6rem+4.4vw,5.25rem)] leading-[1] tracking-[-0.02em] text-ink"
            style={delay(0.08)}
          >
            <span className="block">{cms("field-2", "Stronger Spaces.")}</span>
            <span className="block text-forest">
              {cms("field-3", "Brighter ")}<span className="whitespace-nowrap">{cms("field-4", "Tomorrows.")}</span>
            </span>
          </h1>

          <p
            className="animate-rise mt-8 max-w-[32rem] text-[clamp(1rem,0.95rem+0.35vw,1.1875rem)] leading-relaxed text-muted"
            style={delay(0.16)}
          >
            {cms("field-5", "Construction chemical solutions for every build — from homes to large infrastructure projects.")}</p>
          <p className="sr-only">{cms("field-6", "Imagery on this page is illustrative and not official product photography.")}</p>

          <div className="animate-rise mt-8 flex flex-wrap gap-3" style={delay(0.24)}>
            <ButtonLink to={cms("field-7", "/products")} variant="accent" size="lg" className="max-sm:flex-1 max-sm:px-5">
              {cms("field-8", "Shop Products ")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
            </ButtonLink>
            <ButtonLink to={cms("field-9", "/solutions")} variant="secondary" size="lg" className="max-sm:flex-1 max-sm:px-5">
              {cms("field-10", "View Solutions")}</ButtonLink>
          </div>

          <HeroStats stats={heroStats} />
        </div>
      </div>

      <div className="relative mx-[var(--page-gutter)] aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)] shadow-[var(--shadow-float)] ring-1 ring-ink/5 sm:aspect-[16/10] lg:absolute lg:inset-y-0 lg:right-0 lg:m-0 lg:aspect-auto lg:w-[56%] lg:rounded-none lg:shadow-none lg:ring-0">
        <div className="animate-[fade-in_1s_ease-out_both] size-full">
          <HeroVisual image={{ ...heroImage, src: cms('image-src', "/images/hero/hero-architecture-crop.webp"), alt: cms('image-alt', "Illustrative concept: modern concrete house with construction chemical packs on a stone ledge") }} />
        </div>
        {/* Blend the visual into the copy column on wide screens. */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-1/3 bg-linear-to-r from-cream via-cream/50 to-transparent lg:block" />
        <span className="glass-dark absolute top-3 right-3 rounded-full lg:top-6 lg:right-[var(--page-gutter)] px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.12em] text-white uppercase">
          {cms("field-11", "Concept imagery")}</span>
      </div>

      {/* Glass trust strip: true service value props only. */}
      <div className="container-page relative z-10 -mt-[clamp(1.5rem,6vw,3rem)] pb-[clamp(2.5rem,5vw,4rem)] lg:-mt-[clamp(3rem,5vw,4.5rem)] lg:pb-[clamp(2.5rem,4vw,3.5rem)]">
        <ul
          aria-label="How ordering works"
          className="animate-rise glass grid gap-px overflow-hidden rounded-[var(--radius-card)] !bg-white/85 shadow-[var(--shadow-card)] sm:grid-cols-3 lg:!bg-white/75 lg:backdrop-blur-xl"
          style={delay(0.32)}
        >
          {trust.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex min-w-0 items-center gap-3.5 px-5 py-4 sm:border-l sm:border-ink/8 sm:first:border-l-0">
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
