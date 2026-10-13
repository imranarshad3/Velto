import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  as?: ElementType
  /** Seconds; use small steps (0.06–0.12) to stagger siblings. */
  delay?: number
  className?: string
  id?: string
  'aria-labelledby'?: string
}

/**
 * Fades content up once it enters the viewport. CSS hides it only when the user allows motion
 * (global.css `[data-reveal]`), so reduced-motion users, print and no-observer browsers see it immediately.
 */
export default function Reveal({ children, as: Tag = 'div', delay = 0, className, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return setShown(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} data-reveal={shown ? 'shown' : ''} style={delay ? ({ '--delay': `${delay}s` } as CSSProperties) : undefined} className={className} {...rest}>
      {children}
    </Tag>
  )
}
