/**
 * SessionTree component — recursive tree view of sessions for SC-04.
 *
 * Per 04-PLAN.md Task 4 (Wave 2c) and 04-SPEC.md:
 *   - UR-SC04-02: Show parent-child hierarchy with indentation
 *   - UR-SC04-07: Lazy-load children on expand (not on mount)
 *   - SR-SC04-03: Show error if children fetch fails (per-row error)
 *   - D-SC04-01: Component decomposition — SessionTree uses SessionRow
 *
 * Per 04-PATTERNS.md (Section 2.1 — Recursive tree component pattern):
 *   - Component is recursive: each node renders its own SessionRow + children
 *   - State lives internally in a per-node record (expanded/loading/error)
 *   - On chevron click: if not loaded, call childLoader; if loaded, toggle
 *
 * Per 04-CONTEXT.md GA-4: lazy-load on expand (not eager).
 *
 * Public seam (per universal-rules.md §6.3):
 *   - Props: sessions, childLoader
 *   - DOM hooks: data-testid="session-tree-loading-{id}",
 *     data-testid="session-tree-error-{id}"
 *   - State: internal per-node state
 *
 * The component is testable in isolation via the `childLoader` prop —
 * no pluginClient coupling inside the component itself. The parent
 * (Wave 3 panel composition) wires `childLoader` to
 * `pluginClient.getSessionChildren(id)` and adapts the
 * `ChildSession[]` shape to `SessionSummary[]`.
 *
 * Known limitation: No cycle detection. If childLoader returns the
 * parent as its own child (creating a cycle), this will infinite-loop.
 * Cycle detection is out of scope for v1.
 *
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PATTERNS.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PLAN.md (Task 4)
 *
 * @module sidecar/components/session-tree
 */

"use client"

import React, { useState, useCallback } from "react"
import { SessionRow } from "./session-row"
import type { SessionSummary } from "@lib/types"

/**
 * Internal state for a single tree node's children.
 */
interface ChildNodeState {
  /** Whether the node is currently expanded. */
  expanded: boolean
  /** Loaded children (empty until childLoader resolves). */
  children: SessionSummary[]
  /** True while childLoader is in flight. */
  loading: boolean
  /** Error from last childLoader call. */
  error: Error | null
}

export interface SessionTreeProps {
  /** Array of root-level sessions. */
  sessions: SessionSummary[]
  /**
   * Async function to load children of a given session.
   *
   * Typically wraps `pluginClient.getSessionChildren(id)` and adapts
   * the `ChildSession[]` response to `SessionSummary[]`. The parent
   * (panel) is responsible for that adaptation; this component is
   * decoupled from pluginClient to remain testable in isolation.
   */
  childLoader: (sessionId: string) => Promise<SessionSummary[]>
}

/**
 * Renders a recursive tree of sessions.
 *
 * Each tree node renders a SessionRow and, when expanded, its children
 * recursively. Children are lazy-loaded on first expand via `childLoader`.
 *
 * The component owns per-node state internally (no external store) so
 * the parent panel can simply pass `sessions` and `childLoader`.
 */
export function SessionTree({
  sessions,
  childLoader,
}: SessionTreeProps): React.ReactElement {
  return (
    <div data-session-tree="true">
      {sessions.map((session) => (
        <SessionTreeNode
          key={session.id}
          session={session}
          depth={0}
          childLoader={childLoader}
        />
      ))}
    </div>
  )
}

interface SessionTreeNodeProps {
  session: SessionSummary
  depth: number
  childLoader: (sessionId: string) => Promise<SessionSummary[]>
}

/**
 * Internal recursive node component.
 *
 * Manages its own expand/loading/error state. Renders a SessionRow
 * plus (when expanded) the child nodes recursively.
 */
function SessionTreeNode({
  session,
  depth,
  childLoader,
}: SessionTreeNodeProps): React.ReactElement {
  const [state, setState] = useState<ChildNodeState>({
    expanded: false,
    children: [],
    loading: false,
    error: null,
  })

  const hasChildren = session.children.length > 0

  const handleToggleExpand = useCallback((): void => {
    if (state.expanded) {
      // Collapse: just toggle the flag, keep loaded children cached
      setState((prev) => ({ ...prev, expanded: false }))
      return
    }

    // Expand path
    if (hasChildren && state.children.length === 0 && !state.loading) {
      // Lazy-load children (UR-SC04-07)
      setState((prev) => ({ ...prev, loading: true, error: null }))
      childLoader(session.id)
        .then((children) => {
          setState({
            expanded: true,
            children,
            loading: false,
            error: null,
          })
        })
        .catch((err: unknown) => {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          }))
        })
    } else {
      // No children to load — just expand (renders no children)
      setState((prev) => ({ ...prev, expanded: true }))
    }
  }, [state, hasChildren, childLoader, session.id])

  // Click on row body (drill-in is a no-op in v1 per 04-CONTEXT.md GA-8)
  const handleRowClick = useCallback((): void => {
    // v1: no-op. SC-04.1 (Session Detail Drill-in) is the future
    // owner of this interaction.
  }, [])

  return (
    <>
      <SessionRow
        session={session}
        depth={depth}
        expanded={state.expanded}
        onToggleExpand={handleToggleExpand}
        onClick={handleRowClick}
      />

      {/* Loading indicator while children are being fetched */}
      {state.loading && (
        <div
          data-testid={`session-tree-loading-${session.id}`}
          style={{
            padding: "4px 12px 4px 36px",
            fontSize: "11px",
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          Loading children...
        </div>
      )}

      {/* Error message if childLoader failed (per SR-SC04-03) */}
      {state.error && (
        <div
          data-testid={`session-tree-error-${session.id}`}
          style={{
            padding: "4px 12px 4px 36px",
            fontSize: "11px",
            color: "#dc2626",
          }}
        >
          Failed to load children. {state.error.message}
        </div>
      )}

      {/* Render children recursively if expanded */}
      {state.expanded &&
        state.children.map((child) => (
          <SessionTreeNode
            key={child.id}
            session={child}
            depth={depth + 1}
            childLoader={childLoader}
          />
        ))}
    </>
  )
}
