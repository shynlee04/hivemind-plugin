/**
 * Session Explorer panel stub — placeholder for SC-04.
 *
 * Full implementation deferred to SC-04 (Session Explorer Panel).
 *
 * @module sidecar/panels/session-explorer
 */

"use client"

/**
 * Session Explorer panel component (placeholder).
 *
 * @returns A placeholder panel with session explorer layout.
 */
export default function SessionExplorerPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>
        🔍 Session Explorer
      </h3>
      <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
        Browse and inspect active sessions
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: "13px", padding: "8px", borderRadius: "4px", background: "#f8fafc" }}>
          <strong>ses_1</strong> — Main session <span style={{ color: "#22c55e" }}>● active</span>
        </div>
        <div style={{ fontSize: "13px", padding: "8px", borderRadius: "4px", background: "#f8fafc" }}>
          <strong>ses_2</strong> — Subtask: research <span style={{ color: "#3b82f6" }}>● running</span>
        </div>
        <div style={{ fontSize: "13px", padding: "8px", borderRadius: "4px", background: "#f8fafc" }}>
          <strong>ses_3</strong> — Subtask: planning <span style={{ color: "#f59e0b" }}>● pending</span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
        Full implementation in SC-04. Live updates via SSE.
      </p>
    </div>
  )
}
