/** Placeholder tile with the same footprint as a product card while the catalogue loads (no layout shift).
 *  The reserved heights mirror ProductCard's category line, two-line title, two-line description and action row. */
export default function CardSkeleton({ aspect = 'aspect-square' }: { aspect?: string }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface motion-safe:animate-pulse">
      <div className={`${aspect} w-full border-b border-border/60 bg-sand`} />
      <div className="flex flex-col p-4 sm:px-5 sm:pt-5 sm:pb-5 lg:px-6 lg:pt-6 lg:pb-7">
        <div className="h-[0.75em] w-1/3 rounded bg-sand text-[0.75rem]" />
        <div className="mt-1 flex flex-col gap-2 text-[1.625rem]">
          <div className="h-[0.9em] w-5/6 rounded bg-sand" />
          <div className="h-[0.9em] w-2/5 rounded bg-sand" />
        </div>
        <div className="mt-3 flex flex-col gap-2 text-[0.9375rem]">
          <div className="h-[1.1em] w-full rounded bg-sand" />
          <div className="h-[1.1em] w-3/4 rounded bg-sand" />
        </div>
        <div className="mt-5 flex gap-2">
          <div className="h-12 flex-1 rounded-full bg-sand" />
          <div className="h-12 w-12 rounded-full bg-sand" />
        </div>
      </div>
    </div>
  )
}
