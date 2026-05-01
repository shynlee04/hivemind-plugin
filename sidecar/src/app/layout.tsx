/**
 * Sidecar root layout — Phase 42 foundation stub.
 *
 * Real layout (theme, navigation, dashboard chrome) is deferred to
 * SIDECAR-01. This stub exists so the Next.js directory layout is
 * complete and the foundation PR doesn't ship a half-typed file tree.
 */

import type { ReactNode } from "react"

export const metadata = {
  title: "OpenCode Harness Sidecar",
  description: "Read-only artifact dashboard for the OpenCode harness.",
}

/**
 * Minimal Next.js App Router root layout. Phase 42 foundation only.
 *
 * @param props - React children injected by the Next.js router.
 * @returns The root document tree.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
