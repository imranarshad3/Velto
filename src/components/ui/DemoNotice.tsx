import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

export default function DemoNotice({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <p
      className={`flex items-start gap-2 text-[0.8125rem] leading-snug ${tone === 'dark' ? 'text-white/70' : 'text-muted'}`}
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
