/**
 * Sidecar root page client wrapper — owns the `ssr: false` dynamic import.
 *
 * In Next.js 16, `next/dynamic({ ssr: false })` is forbidden in Server
 * Components. We therefore place the dynamic import inside this Client
 * Component (`"use client"`), and the Server Component
 * `src/app/page.tsx` simply renders `<PageWrapper />`.
 *
 * The DashboardShell itself is still client-only (json-render's Renderer
 * and the SSE hook depend on browser APIs that are unavailable during
 * server-side rendering), so the `ssr: false` directive is preserved.
 *
 * @module sidecar/app/page-wrapper
 */

"use client"

import dynamic from "next/dynamic"

/**
 * Dashboard shell loaded as a client-only dynamic import. The 4-cell
 * loading skeleton is shown until the chunk is ready.
 */
const DashboardShell = dynamic(
  () =>
    import("@components/dashboard-shell").then((mod) => ({
      default: mod.DashboardShell,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          height: "100vh",
          gap: "1px",
          background: "#e2e8f0",
          padding: "16px",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            data-skeleton="true"
            style={{
              background: "#ffffff",
              borderRadius: "8px",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    ),
  },
)

/**
 * Client Component boundary for the root page. Server Component
 * `page.tsx` imports this and renders it.
 */
export function PageWrapper(): React.ReactElement {
  return <DashboardShell />
}
