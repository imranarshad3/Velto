/** Loading placeholder with a soft shimmer (static under reduced motion). Size it with className. */
export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-xl bg-[linear-gradient(90deg,var(--color-sand)_0%,#f7f3ee_50%,var(--color-sand)_100%)] bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite] ${className}`}
    />
  )
}
