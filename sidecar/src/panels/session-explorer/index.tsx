/**
 * Session Explorer Panel — main panel for SC-04.
 *
 * Per 04-SPEC.md + 04-PLAN.md (Wave 3, Task 6):
 *   - Replaces the hardcoded SC-03 stub (50 lines of fake ses_1/2/3)
 *   - Composes useSessions() + SessionFilter + SessionTree
 *   - Real data from plugin server (fixes SC-03 stub bug, per UR-SC04-11)
 *   - Debounced filter (150ms per GA-3, debounced in the PANEL, not in
 *     SessionFilter — which is a pure controlled input per its spec)
 *   - URL persistence: ?session_filter= (per GA-10, mirrors ?panel= in
 *     dashboard-shell.tsx)
 *   - Last Updated timestamp (per OF-SC04-02)
 *   - Graceful states: loading, error (with Retry), empty, no-match
 *   - SSE subscription is handled inside useSessions() (per D-SC04-03 +
 *     the actual implementation at use-sessions.ts:84-97) — this panel
 *     does NOT call useSse directly to avoid double-subscribing
 *
 * Per 04-PATTERNS.md (Section 1, Reuse Patterns):
 *   - Reuse useSse (via useSessions) + pluginClient + ErrorBoundary
 *   - Wrap inner component in Suspense for useSearchParams compat
 *     (same pattern as dashboard-shell.tsx:252-263)
 *
 * Per 04-CONTEXT.md D-SC04-01: Component decomposition — this panel
 * owns composition only; data fetching lives in useSessions, rendering
 * lives in SessionTree/SessionFilter/SessionRow.
 *
 * Public seam (per universal-rules.md §6.3):
 *   - Default export: SessionExplorerPanel (used by dashboard-shell's
 *     dynamic import at dashboard-shell.tsx:73 via `mod.default`)
 *   - Named export: SessionExplorerPanel (used by tests)
 *   - data-testid seams: "session-explorer-error", "session-explorer-empty",
 *     "session-explorer-no-match", "session-filter-input", "last-updated"
 *
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-CONTEXT.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PATTERNS.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PLAN.md (Wave 3, Task 6)
 *
 * @module sidecar/panels/session-explorer
 */

"use client"

import React, { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useSessions } from "@lib/use-sessions"
import { getPluginClient } from "@lib/plugin-client"
import { SessionFilter } from "@components/session-filter"
import { SessionTree } from "@components/session-tree"
import { ErrorBoundary } from "@components/error-boundary"
import type { ChildSession, SessionSummary } from "@lib/types"

// ── Helpers ──

/**
 * Case-insensitive substring filter on description / id / status.
 *
 * Per 04-SPEC.md UR-SC04-05: filter response SHALL be < 200ms for up to
 * 1000 sessions (substring match on id/description/status/agent).
 * Implemented here (not in SessionFilter) because filtering is a panel-
 * level concern that the parent owns — the child SessionFilter is a
 * pure controlled input.
 */
function filterSessions(
  sessions: SessionSummary[],
  query: string
): SessionSummary[] {
  if (!query) return sessions
  const lower = query.toLowerCase()
  return sessions.filter(
    (s) =>
      s.description.toLowerCase().includes(lower) ||
      s.id.toLowerCase().includes(lower) ||
      s.status.toLowerCase().includes(lower)
  )
}

/**
 * Format a Date as HH:MM:SS for the "Last updated" timestamp display.
 *
 * Per OF-SC04-02: a small "Last updated" label updates whenever the
 * session list changes. Locale-independent 24-hour format keeps the
 * UI stable across user locales.
 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number): string => String(n).padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Adapt a `ChildSession[]` (returned by `pluginClient.getSessionChildren`)
 * to `SessionSummary[]` (consumed by SessionTree).
 *
 * Per the actual types at src/lib/types.ts:93-100, `ChildSession` has
 * fewer fields than `SessionSummary`. The SC-02 endpoint
 * `GET /api/state/sessions/:id/children` is currently a stub returning
 * `{ children: [] }` — for v1 we return whatever the server provides;
 * fields missing on the server side fall back to safe defaults.
 */
function adaptChildSessions(children: ChildSession[]): SessionSummary[] {
  return children.map((c) => ({
    id: c.id,
    status: c.status,
    description: c.id, // ChildSession has no description field; use id
    children: [],
    createdAt: c.createdAt,
    updatedAt: c.createdAt,
    depth: c.depth,
  }))
}

// ── Main component (inner, uses useSearchParams → must be in Suspense) ──

/**
 * Inner panel — uses `useSearchParams`, so it MUST be wrapped in
 * `<Suspense>` (per Next.js 16 requirement; same pattern as
 * dashboard-shell.tsx:252-263).
 */
function SessionExplorerPanelInner(): React.ReactElement {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // URL-persisted filter (per 04-CONTEXT.md GA-10)
  const urlFilter = searchParams.get("session_filter") ?? ""

  // Two-tier filter state: immediate (controlled by input) + debounced
  // (drives the actual filter and URL write). Per 04-CONTEXT.md GA-3
  // the debounce is 150ms and lives in the panel, NOT in SessionFilter.
  const [immediateFilter, setImmediateFilter] = useState<string>(urlFilter)
  const [debouncedFilter, setDebouncedFilter] = useState<string>(urlFilter)

  // Debounce 150ms (per GA-3)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(immediateFilter)
    }, 150)
    return () => clearTimeout(timer)
  }, [immediateFilter])

  // Sync the debounced filter back to the URL (per GA-10)
  useEffect(() => {
    // Skip the very first render (initial value already in URL or empty)
    // to avoid an extra replace on mount. Comparison is intentional.
    const current = searchParams.get("session_filter") ?? ""
    if (debouncedFilter === current) return
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedFilter) {
      params.set("session_filter", debouncedFilter)
    } else {
      params.delete("session_filter")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilter])

  // Data fetching + SSE subscription — all delegated to useSessions.
  // NOTE: do NOT also call useSse here; useSessions already subscribes
  // and a second EventSource would double-subscribe.
  const { sessions, loading, error, refresh } = useSessions()

  // Apply filter (memoized — per UR-SC04-05 < 200ms for 1000 sessions)
  const filtered = useMemo(
    () => filterSessions(sessions, debouncedFilter),
    [sessions, debouncedFilter]
  )

  // Last Updated timestamp (per OF-SC04-02). Updates whenever the
  // sessions array reference changes (i.e., after each successful
  // fetch), but not on every render.
  const [lastUpdated, setLastUpdated] = useState<number>(() => Date.now())
  useEffect(() => {
    if (!loading) {
      setLastUpdated(Date.now())
    }
  }, [sessions, loading])

  // ── States (mutually exclusive) ──

  // Error state (per SR-SC04-01)
  if (error) {
    return (
      <div
        data-testid="session-explorer-error"
        style={{
          padding: "20px",
          color: "var(--status-failed, #dc2626)",
          fontSize: "13px",
        }}
      >
        <strong>⚠️ Plugin server not available</strong>
        <div style={{ marginTop: "4px", fontSize: "11px" }}>
          {error.message}
        </div>
        <button
          type="button"
          onClick={() => {
            void refresh()
          }}
          style={{
            marginTop: "8px",
            padding: "4px 12px",
            fontSize: "12px",
            background: "var(--status-running, #3b82f6)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state (per UR-SC04-08 + GA-6) — only when NOT loading and zero
  // sessions at the top level.
  if (!loading && sessions.length === 0) {
    return (
      <div
        data-testid="session-explorer-empty"
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--status-completed, #94a3b8)",
          fontSize: "13px",
        }}
      >
        <strong>No active sessions</strong>
        <div style={{ marginTop: "4px", fontSize: "11px" }}>
          Start a delegation to see sessions here.
        </div>
      </div>
    )
  }

  return (
    <div
      data-session-explorer="true"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Last Updated timestamp (per OF-SC04-02) */}
      <div
        data-testid="last-updated"
        style={{
          padding: "4px 12px",
          fontSize: "10px",
          color: "var(--status-completed, #94a3b8)",
          borderBottom: "1px solid var(--panel-border, #f1f5f9)",
          background: "var(--panel-header-bg, #f8fafc)",
        }}
      >
        Last updated: {formatTime(lastUpdated)}
      </div>

      {/* Search filter (per UR-SC04-05) */}
      <SessionFilter value={immediateFilter} onChange={setImmediateFilter} />

      {/* Main content: tree, no-match, or initial loading */}
      {loading && sessions.length === 0 ? (
        <div
          data-panel-loading="true"
          style={{
            padding: "20px",
            textAlign: "center",
            color: "var(--status-completed, #94a3b8)",
            fontSize: "13px",
          }}
        >
          Loading sessions...
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-testid="session-explorer-no-match"
          style={{
            padding: "20px",
            textAlign: "center",
            color: "var(--status-completed, #94a3b8)",
            fontSize: "13px",
          }}
        >
          No sessions match &quot;{debouncedFilter}&quot;.
        </div>
      ) : (
        <SessionTree
          sessions={filtered}
          childLoader={async (sessionId: string): Promise<SessionSummary[]> => {
            const client = getPluginClient()
            const result = await client.getSessionChildren(sessionId)
            return adaptChildSessions(result.children ?? [])
          }}
        />
      )}
    </div>
  )
}

// ── Public component (default + named export, wrapped in ErrorBoundary + Suspense) ──

/**
 * Public Session Explorer Panel — exported BOTH as default (for
 * dashboard-shell's dynamic `import('@panels/${id}')` which reads
 * `mod.default`) and as a named export (for tests and direct usage).
 *
 * The inner component is wrapped in:
 *   - `<ErrorBoundary>` — crash isolation (per UR-SC04-10)
 *   - `<Suspense>` — required for `useSearchParams` (Next.js 16)
 */
function SessionExplorerPanel(): React.ReactElement {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "var(--status-completed, #94a3b8)",
              fontSize: "13px",
            }}
          >
            Loading Session Explorer...
          </div>
        }
      >
        <SessionExplorerPanelInner />
      </Suspense>
    </ErrorBoundary>
  )
}

export default SessionExplorerPanel
export { SessionExplorerPanel }
