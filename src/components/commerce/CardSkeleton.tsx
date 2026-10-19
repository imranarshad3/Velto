/** Placeholder tile with the same footprint as a product/category card while the catalogue loads (no layout shift). */
export default function CardSkeleton({ aspect = 'aspect-square' }: { aspect?: string }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface motion-safe:animate-pulse">
      <div className={`${aspect} w-full bg-sand`} />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 rounded bg-sand" />
        <div className="h-5 w-3/4 rounded bg-sand" />
        <div className="h-4 w-1/2 rounded bg-sand" />
      </div>
    </div>
  )
}
