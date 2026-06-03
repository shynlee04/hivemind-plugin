/**
 * MEMS Browser panel stub — placeholder for SC-06.
 *
 * Full implementation deferred to SC-06 (MEMS Browser Panel).
 *
 * @module sidecar/panels/mems-browser
 */

"use client"

/**
 * MEMS Browser panel component (placeholder).
 *
 * @returns A placeholder panel with memory/trajectory browser layout.
 */
export default function MemsBrowserPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>
        🧠 MEMS Browser
      </h3>
      <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
        Explore memory documents and trajectory
      </p>
      <div
        style={{
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          display: "flex",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#f59e0b" }}>3</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Tier 3</div>
        </div>
      </div>
      <div
        style={{
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <strong>P25</strong> <span style={{ color: "#64748b" }}>1h ago</span>
        </div>
        <div style={{ color: "#475569" }}>Trajectory redesign complete</div>
        <div style={{ borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <strong>P26</strong> <span style={{ color: "#64748b" }}>30m ago</span>
        </div>
        <div style={{ color: "#475569" }}>Pressure notification system</div>
      </div>
      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
        Full implementation in SC-06. Graph view and trajectory timeline.
      </p>
    </div>
  )
}
