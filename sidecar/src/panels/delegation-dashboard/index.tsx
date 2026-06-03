/**
 * Delegation Dashboard panel stub — placeholder for SC-05.
 *
 * Renders using the json-render Renderer with a pre-built spec.
 * Full implementation deferred to SC-05 (Delegation Dashboard Panel).
 *
 * @module sidecar/panels/delegation-dashboard
 */

"use client"

import dynamic from "next/dynamic"
import { delegationDashboardSpec } from "./specs"

const Renderer = dynamic(() => import("@json-render/react").then((mod) => mod.Renderer), {
  ssr: false,
  loading: () => <div data-skeleton="true" style={{ height: "100%", borderRadius: "8px", background: "var(--skeleton-bg, #e2e8f0)" }} />,
})

/**
 * Delegation Dashboard panel component.
 *
 * @returns A json-render rendered placeholder panel.
 */
export default function DelegationDashboardPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <Renderer spec={delegationDashboardSpec} />
    </div>
  )
}
