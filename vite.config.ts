import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Maps /api/... to a file the way Vercel does: exact file, folder index, or a [param].ts sibling. */
function resolveApiFile(pathname: string): string | null {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/')
  if (parts[0] !== 'api' || parts.some((p) => !/^[A-Za-z0-9_.-]+$/.test(p) || p.startsWith('.'))) return null
  // Mirrors the vercel.json rewrite: every /api/admin/* path is served by api/admin.ts.
  if (parts[1] === 'orders') return '/api/admin.ts'
  if (parts[1] === 'admin') return '/api/admin.ts'
  const rel = parts.join('/')
  for (const candidate of [`${rel}.ts`, `${rel}/index.ts`]) if (existsSync(resolve(candidate))) return `/${candidate}`
  const dir = parts.slice(0, -1).join('/')
  if (!existsSync(resolve(dir))) return null
  const dynamic = readdirSync(resolve(dir)).find((f) => /^\[[a-z]+\]\.ts$/i.test(f))
  return dynamic ? `/${dir}/${dynamic}` : null
}

/**
 * Dev-only: serves the Vercel functions in /api through Vite so the quote flow works with `npm run dev`.
 * Production uses Vercel Functions directly; this plugin is never part of the build.
 */
function devApi(mode: string): Plugin {
  return {
    name: 'novaro-dev-api',
    apply: 'serve',
    configureServer(server) {
      // Server-only variables (no VITE_ prefix) for the handlers; never exposed to the client bundle.
      // Vite restarts in-process when .env changes, so values loaded from .env must be re-applied (not `??=`),
      // otherwise the API keeps stale keys until a full restart. Variables set in the shell still win.
      const g = globalThis as { __novaroShellEnv?: Set<string>; __novaroInjected?: string[] }
      const shellKeys = (g.__novaroShellEnv ??= new Set(Object.keys(process.env)))
      // loadEnv lets process.env override the files, so drop what we injected last time before re-reading.
      for (const key of g.__novaroInjected ?? []) delete process.env[key]
      g.__novaroInjected = []
      for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
        if (shellKeys.has(key)) continue
        process.env[key] = value
        g.__novaroInjected.push(key)
      }

      server.middlewares.use(async (req, res, next) => {
        // Keep the real host:port (e.g. localhost:5173) so the API sees the same origin as the browser.
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
        const route = resolveApiFile(url.pathname)
        if (!route) return next()
        try {
          const mod = (await server.ssrLoadModule(route)) as Record<string, (request: Request) => Promise<Response>>
          const handler = mod[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value)
          headers.set('x-forwarded-for', req.socket.remoteAddress ?? 'unknown')
          const response = await handler(
            new Request(url, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined }),
          )
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          // The browser cancelled the request (navigation, AbortController): nothing to report.
          if (req.destroyed || (error as Error).message === 'aborted') return
          next(error)
        }
      })
    },
  }
}

/** Everything VITE_-prefixed ships to the browser, so refuse names that look like server secrets. */
function assertNoBrowserSecrets(mode: string) {
  const leaked = Object.keys(loadEnv(mode, process.cwd(), 'VITE_')).filter((key) => /SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|DB_URL|JWT_KEY/i.test(key))
  if (leaked.length) throw new Error(`Server-only secrets must not use the VITE_ prefix: ${leaked.join(', ')}`)
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  assertNoBrowserSecrets(mode)
  return {
    plugins: [react(), tailwindcss(), devApi(mode)],
    build: {
      rolldownOptions: {
        output: {
          // Stable vendor chunks: app releases no longer invalidate the cached framework/auth code.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/, priority: 2 },
              { name: 'clerk', test: /node_modules[\\/](@clerk|@tanstack|swr|dequal|js-cookie)[\\/]/, priority: 1 },
            ],
          },
        },
      },
    },
  }
})
