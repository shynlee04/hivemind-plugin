/**
 * MEMS Browser panel stub — placeholder for SC-06.
 *
 * Renders using the json-render Renderer with a pre-built spec.
 * Full implementation deferred to SC-06 (MEMS Browser Panel).
 *
 * @module sidecar/panels/mems-browser
 */

"use client"

import dynamic from "next/dynamic"
import { memsBrowserSpec } from "./specs"

const Renderer = dynamic(() => import("@json-render/react").then((mod) => mod.Renderer), {
  ssr: false,
  loading: () => <div data-skeleton="true" style={{ height: "100%", borderRadius: "8px", background: "var(--skeleton-bg, #e2e8f0)" }} />,
})

/**
 * MEMS Browser panel component.
 *
 * @returns A json-render rendered placeholder panel.
 */
export default function MemsBrowserPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <Renderer spec={memsBrowserSpec} />
    </div>
  )
}
