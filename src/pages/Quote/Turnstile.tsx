import { useEffect, useRef } from 'react'

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<void> | undefined
const loadScript = () =>
  (scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('turnstile'))
    document.head.append(script)
  }))

/** Cloudflare Turnstile bot check; renders only when VITE_TURNSTILE_SITE_KEY is configured. */
export default function Turnstile({ onToken }: { onToken: (token: string | undefined) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!siteKey || !ref.current) return
    let widgetId: string | undefined
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        widgetId = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(undefined),
          'error-callback': () => onToken(undefined),
        })
      })
      .catch(() => onToken(undefined))
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [onToken])

  return siteKey ? <div ref={ref} className="min-h-[4.5rem]" /> : null
}
