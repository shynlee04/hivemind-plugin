/**
 * Control Panel panel stub — placeholder for SC-07.
 *
 * Full implementation deferred to SC-07 (Control Panel).
 *
 * @module sidecar/panels/control-panel
 */

"use client"

/**
 * Control Panel panel component (placeholder).
 *
 * @returns A placeholder panel with command console layout.
 */
export default function ControlPanelPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>
        ⚙️ Control Panel
      </h3>
      <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
        Execute commands and configure runtime
      </p>
      <div
        style={{
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: "12px", color: "#475569" }}>Plugin Server — Connected</span>
      </div>
      <div
        style={{
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        Tool invocation buttons and command input (SC-07)
      </div>
      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
        Full implementation in SC-07. Tool proxy and command input.
      </p>
    </div>
  )
}
