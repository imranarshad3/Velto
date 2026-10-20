import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router'

const RELOAD_KEY = 'velto:chunk-reload'

// A lazy page chunk fails to load after a redeploy (old hashed file is gone)
// or when the dev server restarted under an open tab.
function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message)
}

function readFlag() {
  try {
    return sessionStorage.getItem(RELOAD_KEY)
  } catch {
    return null
  }
}

function writeFlag(value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(RELOAD_KEY)
    else sessionStorage.setItem(RELOAD_KEY, value)
  } catch {
    // Storage unavailable; the manual retry button still works.
  }
}

export default function RouteErrorPage() {
  const error = useRouteError()
  const chunkError = isChunkLoadError(error)
  const isCmsEditor = window.location.pathname === '/admin/website' || window.location.pathname.startsWith('/admin/website/')
  // Keep the CMS editor's recovery flow in control; a silent retry can unmount unsaved work.
  const willReload = chunkError && !isCmsEditor && readFlag() !== window.location.href

  useEffect(() => {
    if (willReload) {
      writeFlag(window.location.href)
      window.location.reload()
    } else {
      writeFlag(null)
    }
  }, [willReload])

  if (willReload) return <div aria-busy="true" aria-label="Loading" className="min-h-dvh bg-canvas" />

  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-[var(--page-gutter)] py-[var(--section-gap)] text-center">
      <title>Something went wrong — VELTO</title>
      <meta name="robots" content="noindex" />
      <div className="max-w-[36rem]">
        <h1 className="font-display text-[clamp(1.75rem,1.4rem+1.5vw,2.5rem)]">
          {notFound ? 'This page doesn’t exist' : chunkError ? 'This page couldn’t load' : 'Something went wrong'}
        </h1>
        <p className="mt-3 text-muted">
          {chunkError
            ? isCmsEditor
              ? 'The editor could not load a page module. Your changes are backed up in this browser; reload when you’re ready to restore them.'
              : 'The site may have just been updated or your connection dropped. Reloading usually fixes it.'
            : 'Please try again. If the problem continues, return to the homepage.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-11 items-center rounded-xl bg-forest px-5 font-semibold text-white shadow-[var(--shadow-button)] transition-colors hover:bg-forest-dark"
          >
            Reload page
          </button>
          <a href="/" className="inline-flex min-h-11 items-center rounded-xl border border-border bg-surface px-5 font-semibold text-ink transition-colors hover:border-forest/40">
            Back to home
          </a>
        </div>
      </div>
    </main>
  )
}
