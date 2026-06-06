/**
 * useSessions() — React hook for the Session Explorer Panel (SC-04).
 *
 * Fetches the live list of active sessions from the plugin server via
 * the `pluginClient.getSessions()` HTTP endpoint, subscribes to SSE
 * events for real-time updates, and exposes loading/error/refresh state.
 *
 * Per 04-SPEC.md:
 *   - UR-SC04-01: Display all active sessions within 2s of dashboard load
 *   - UR-SC04-03: Subscribe to SSE `session.*` events; update within 500ms
 *   - SR-SC04-01: Show "Plugin server not available" if unreachable
 *   - ER-SC04-01: Add new sessions within 500ms of `session.created` event
 *   - ER-SC04-02: Remove sessions within 500ms of `session.deleted` event
 *
 * Per 04-PATTERNS.md (Section "Reuse Patterns"):
 *   - State access: read from `pluginClient` singleton (module-level)
 *   - SSE subscription: use `useSse()` hook with `onEvent` callback
 *   - HTTP calls: use `pluginClient.getSessions()` (NEVER fetch directly)
 *   - Error handling: catch + expose `error: Error | null`
 *   - Loading state: `useState<boolean>`
 *
 * Per 04-PLAN.md Wave 1 T1.2 (hook implementation):
 *   - Initial fetch on mount
 *   - Re-fetch on any `session.*` SSE event (simple + correct: avoids
 *     stale data and keeps the implementation trivially safe for v1)
 *   - Expose `refresh()` for manual retry (e.g., from "Retry" button
 *     in the panel error state, Wave 3)
 *
 * Per 04-PLAN-CHECK.md note 1 (R1): `session.deleted` removal is
 * currently handled by `stateStore.handleEvent` (SC-03). In this
 * hook, the SSE-driven re-fetch re-reads `/api/state/sessions`,
 * which returns the current server-side list (deleted sessions
 * are absent). The full stateStore extension is a separate T1.4
 * sub-task tracked in 04-PLAN-CHECK.md and is NOT in Wave 1 scope.
 *
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PATTERNS.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PLAN.md (Wave 1)
 *
 * @module sidecar/lib/use-sessions
 */

"use client"

import { useCallback, useEffect, useState } from "react"
import { getPluginClient } from "./plugin-client"
import { useSse } from "./use-sse"
import type { SidecarEvent, SessionSummary } from "./types"

/**
 * Return shape of the `useSessions()` hook.
 */
export interface UseSessionsReturn {
  /** Array of active sessions from the plugin server. Empty if none. */
  sessions: SessionSummary[]
  /** True while the initial fetch or a refresh is in flight. */
  loading: boolean
  /** Error from the last fetch attempt, or null on success. */
  error: Error | null
  /** SSE connection status — true if connected, false if disconnected. */
  connected: boolean
  /** Manually trigger a re-fetch. Returns a promise that resolves when done. */
  refresh: () => Promise<void>
}

/**
 * Hook to fetch and live-update the list of active sessions.
 *
 * On mount, fetches `/api/state/sessions` via the plugin client.
 * Subscribes to SSE `session.*` events via `useSse` and re-fetches
 * the list on any such event (simple, correct v1 strategy).
 *
 * @returns UseSessionsReturn — `{ sessions, loading, error, connected, refresh }`
 */
export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // SSE connection — useSse manages the EventSource lifecycle.
  // The `onEvent` callback re-fetches on any `session.*` event so the
  // panel sees created/updated/deleted/idle/error changes within ~500ms
  // (per UR-SC04-03, ER-SC04-01, ER-SC04-02).
  const { connected } = useSse({
    onEvent: (event: SidecarEvent) => {
      if (event.type.startsWith("session.")) {
        // Re-fetch is intentionally simple: avoids client-side state
        // diffing, never goes stale, costs one HTTP call per event.
        // (v1: 2s polling is documented as Wave 5 backstop; v1.5
        // upgrade path is `useSyncExternalStore` per 04-PATTERNS.md.)
        refreshInternal().catch(() => {
          // Errors are already surfaced via the hook's `error` state
          // by `refreshInternal`; no further handling needed here.
        })
      }
    },
  })

  /**
   * Internal fetch implementation — called on mount and on SSE events.
   * NOT exposed; the public `refresh` (below) is a stable useCallback
   * wrapper for consumer use.
   */
  const refreshInternal = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const client = getPluginClient()
      const result = await client.getSessions()
      setSessions(result.sessions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      // Keep previous sessions on error (don't blank the list on a
      // transient network blip; the panel error state shows the banner).
    } finally {
      setLoading(false)
    }
  }, [])

  // Public refresh — stable reference for the consumer (panel button,
  // retry handler, etc.). Wraps `refreshInternal`.
  const refresh = useCallback(async (): Promise<void> => {
    await refreshInternal()
  }, [refreshInternal])

  // Initial fetch on mount
  useEffect(() => {
    refreshInternal()
  }, [refreshInternal])

  return { sessions, loading, error, connected, refresh }
}
