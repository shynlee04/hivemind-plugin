/**
 * Sidecar root page — dynamically imports the dashboard shell.
 *
 * The dashboard shell is loaded via `next/dynamic({ ssr: false })` to
 * prevent hydration mismatches, since json-render's Renderer depends
 * on browser APIs for streaming UI rendering.
 *
 * @module sidecar/app/page
 */

import dynamic from "next/dynamic"

/**
 * Dynamically import the DashboardShell with SSR disabled.
 * This is required because json-render's Renderer and SSE hooks
 * depend on browser APIs (EventSource, etc.) that are not available
 * during server-side rendering.
 */
const DashboardShell = dynamic(
  () => import("@components/dashboard-shell").then((mod) => ({ default: mod.DashboardShell })),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", height: "100vh", gap: "1px", background: "#e2e8f0", padding: "16px" }}>
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
 * Main page component rendered at the root route.
 *
 * @returns The dynamic dashboard shell.
 */
export default function HomePage() {
  return <DashboardShell />
}
