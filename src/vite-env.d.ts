/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Clerk key (pk_...). Server secrets must never use the VITE_ prefix. */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
  /** Local testing only; ignored in production builds. */
  readonly VITE_DEV_FAKE_AUTH?: string
}
