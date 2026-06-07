/**
 * Sidecar root page client wrapper — owns the Client Component boundary.
 *
 * History: this file previously used the `next/dynamic` deferred-ssr
 * import pattern to gate the DashboardShell until after hydration. In
 * Next.js 16 that pattern triggers `BAILOUT_TO_CLIENT_SIDE_RENDERING`
 * errors when SSR encounters a dynamic import inside a Client
 * Component wrapper, even when the wrapper itself is `"use client"`.
 * The browser surfaces the bailout as a fatal UI failure, blocking
 * all subsequent logic in `dashboard-shell.tsx` (including
 * `initPluginClient()` and the `?panel=` router hydration).
 *
 * The dynamic import is redundant: `dashboard-shell.tsx` is already a
 * Client Component (`"use client"` at the top), so it never runs on
 * the server in the first place. A direct import preserves the
 * Client Component boundary without triggering the bailout.
 *
 * Regression guard: `sidecar/tests/dev-server.test.ts`
 * "page-wrapper.tsx exists as the Client Component boundary
 *  (flaw 1 v2: no next/dynamic bailout)".
 *
 * @module sidecar/app/page-wrapper
 */

"use client"

import { DashboardShell } from "@components/dashboard-shell"

/**
 * Client Component boundary for the root page. Server Component
 * `page.tsx` imports this and renders it.
 */
export function PageWrapper(): React.ReactElement {
  return <DashboardShell />
}
