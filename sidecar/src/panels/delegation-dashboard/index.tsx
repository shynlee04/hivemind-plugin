/**
 * Delegation Dashboard panel stub — placeholder for SC-05.
 *
 * Full implementation deferred to SC-05 (Delegation Dashboard Panel).
 *
 * @module sidecar/panels/delegation-dashboard
 */

"use client"

/**
 * Delegation Dashboard panel component (placeholder).
 *
 * @returns A placeholder panel with delegation list layout.
 */
export default function DelegationDashboardPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>
        🔀 Delegation Dashboard
      </h3>
      <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
        Monitor delegation status and timing
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
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#3b82f6" }}>3</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Active</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#22c55e" }}>12</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Completed</div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          fontSize: "12px",
        }}
      >
        <div><strong>hm-researcher</strong> <span style={{ color: "#3b82f6" }}>● running</span></div>
        <div><strong>hm-planner</strong> <span style={{ color: "#22c55e" }}>● completed</span> (2.3s)</div>
        <div><strong>hm-executor</strong> <span style={{ color: "#f59e0b" }}>● pending</span></div>
      </div>
      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
        Full implementation in SC-05. WebSocket streaming in future.
      </p>
    </div>
  )
}
