/**
 * Control Panel panel stub — placeholder for SC-07.
 *
 * Renders using the json-render Renderer with a pre-built spec.
 * Full implementation deferred to SC-07 (Control Panel).
 *
 * @module sidecar/panels/control-panel
 */

"use client"

import dynamic from "next/dynamic"
import { controlPanelSpec } from "./specs"

const Renderer = dynamic(() => import("@json-render/react").then((mod) => mod.Renderer), {
  ssr: false,
  loading: () => <div data-skeleton="true" style={{ height: "100%", borderRadius: "8px", background: "var(--skeleton-bg, #e2e8f0)" }} />,
})

/**
 * Control Panel panel component.
 *
 * @returns A json-render rendered placeholder panel.
 */
export default function ControlPanelPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <Renderer spec={controlPanelSpec} />
    </div>
  )
}
