/**
 * SessionRow component — displays a single session in the Session Tree.
 *
 * Per 04-PLAN.md Task 3 (Wave 2 of SC-04 EXECUTION):
 * - Renders session id, description, status (with color per UR-SC04-04)
 * - Renders message count + child count metadata (UR-SC04-06, OF-SC04-01, OF-SC04-02)
 * - Indents based on depth (24px per level, per UR-SC04-02)
 * - Has expand/collapse chevron when session has children (UR-SC04-07)
 * - Click row → onClick(sessionId); click chevron → onToggleExpand(sessionId)
 * - Minimal visual style (text + status colors, no icons per GA-9)
 *
 * Per 04-PATTERNS.md (Class Sketches 4.2):
 *   - Status colors: active/running/pending/completed/failed/error
 *   - Layout: status dot + description + id + agent + badges + chevron
 *
 * Per 04-CONTEXT.md D-SC04-01: consumes SessionSummary, emits click + expand events.
 *
 * Public seam (per universal-rules.md §6.3):
 *   - Props: session, depth, expanded, onToggleExpand, onClick
 *   - DOM hooks: data-session-row, data-status, data-expand-chevron,
 *     data-testid="session-row-{id}", data-testid="expand-chevron-{id}"
 *   - Events: onClick(sessionId), onToggleExpand(sessionId)
 *   - Chevron click stops propagation so row click does not fire
 *
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PATTERNS.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PLAN.md
 *
 * @module sidecar/components/session-row
 */

"use client"

import React from "react"
import type { SessionSummary } from "@lib/types"

/**
 * Status color mapping per 04-SPEC.md UR-SC04-04.
 * Active=running=blue, pending=amber, completed=gray, failed/error=red.
 * The dot is a small visual indicator; matches the dashboard-shell aesthetic.
 */
const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",     // green
  running: "#3b82f6",    // blue
  pending: "#f59e0b",    // amber
  completed: "#94a3b8",  // gray
  failed: "#ef4444",     // red
  error: "#ef4444",      // red (alias for failed)
}

const FALLBACK_STATUS_COLOR = "#94a3b8"
const INDENT_PX_PER_LEVEL = 24
const BASE_PADDING_PX = 12

export interface SessionRowProps {
  /** The session to display. */
  session: SessionSummary
  /** Depth in the tree (0 = root). Controls indentation. */
  depth: number
  /** Whether children are currently shown. */
  expanded: boolean
  /** Callback when user clicks the expand/collapse chevron. */
  onToggleExpand: (sessionId: string) => void
  /** Callback when user clicks the row body (not the chevron). */
  onClick: (sessionId: string) => void
}

/**
 * Renders a single session as a row in the session tree.
 *
 * Layout (left to right):
 *   [chevron] [status dot] [description (bold) + id (mono)] [metadata badges]
 *
 * Click behavior:
 *   - Click row body → onClick(sessionId) (for selection / drill-in)
 *   - Click chevron → onToggleExpand(sessionId) (stops propagation so
 *     row click does not also fire)
 */
export function SessionRow({
  session,
  depth,
  expanded,
  onToggleExpand,
  onClick,
}: SessionRowProps): React.ReactElement {
  const hasChildren = session.children.length > 0
  const indentPx = depth * INDENT_PX_PER_LEVEL
  const statusColor = STATUS_COLORS[session.status] ?? FALLBACK_STATUS_COLOR
  const childCount = session.children.length

  return (
    <div
      data-session-row={session.id}
      data-testid={`session-row-${session.id}`}
      onClick={() => onClick(session.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        paddingLeft: `${indentPx + BASE_PADDING_PX}px`,
        fontSize: "13px",
        cursor: "pointer",
        borderBottom: "1px solid #f1f5f9",
        background: "transparent",
        transition: "background 0.1s",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f8fafc"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      {/* Expand/collapse chevron (only if session has children) */}
      {hasChildren ? (
        <span
          data-expand-chevron={session.id}
          data-testid={`expand-chevron-${session.id}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand(session.id)
          }}
          role="button"
          aria-label={expanded ? "Collapse children" : "Expand children"}
          style={{
            display: "inline-block",
            width: "12px",
            fontSize: "10px",
            color: "#64748b",
            userSelect: "none",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          {expanded ? "▼" : "▶"}
        </span>
      ) : (
        <span
          aria-hidden="true"
          style={{ display: "inline-block", width: "12px", flexShrink: 0 }}
        />
      )}

      {/* Status dot — colored circle indicator (8px) */}
      <span
        data-status={session.status}
        title={session.status}
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: statusColor,
          flexShrink: 0,
        }}
      />

      {/* Session label (description preferred, falls back to id) + id below */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: "#334155",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {session.description || session.id}
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: "11px",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {session.id}
        </div>
      </div>

      {/* Metadata: status text (with color) + child count + message count */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          color: "#64748b",
          fontSize: "11px",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          data-status-text={session.status}
          style={{
            color: statusColor,
            fontWeight: 500,
            textTransform: "lowercase",
          }}
        >
          {session.status}
        </span>
        {childCount > 0 && <span>{childCount} children</span>}
        {session.messageCount !== undefined && session.messageCount > 0 && (
          <span>{session.messageCount} messages</span>
        )}
        {session.toolCallCount !== undefined && session.toolCallCount > 0 && (
          <span>{session.toolCallCount} tools</span>
        )}
      </div>
    </div>
  )
}
