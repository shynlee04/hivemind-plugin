/**
 * Session Explorer panel stub — placeholder for SC-04.
 *
 * Renders using the json-render Renderer with a pre-built spec.
 * Full implementation deferred to SC-04 (Session Explorer Panel).
 *
 * @module sidecar/panels/session-explorer
 */

"use client"

import dynamic from "next/dynamic"
import { sessionExplorerSpec } from "./specs"

const Renderer = dynamic(() => import("@json-render/react").then((mod) => mod.Renderer), {
  ssr: false,
  loading: () => <div data-skeleton="true" style={{ height: "100%", borderRadius: "8px", background: "var(--skeleton-bg, #e2e8f0)" }} />,
})

/**
 * Session Explorer panel component.
 *
 * @returns A json-render rendered placeholder panel.
 */
export default function SessionExplorerPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <Renderer spec={sessionExplorerSpec} />
    </div>
  )
}
