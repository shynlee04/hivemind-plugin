/**
 * Reactive state store for the sidecar dashboard.
 *
 * Wraps json-render's `createStateStore` with sidecar-specific
 * initialization, SSE event dispatch, and cache invalidation logic.
 * The store is populated from `GET /api/state/snapshot` on mount and
 * kept fresh via SSE events dispatched from the `use-sse` hook.
 *
 * @module sidecar/lib/state-store
 */

"use client"

import { createStateStore } from "@json-render/react"
import type { SidecarState, SidecarEvent } from "./types"
import { getPluginClient } from "./plugin-client"

/** Default initial state for the sidecar store. */
const INITIAL_STATE: SidecarState = {
  sessions: {},
  delegations: {},
  trajectory: [],
  pressure: { score: 0, tier: 0, timestamp: Date.now() },
  config: {},
  server: { uptime: 0, port: 0, version: "", startedAt: 0 },
  ui: {
    activePanel: "sessions",
    selectedSessionId: null,
    selectedDelegationId: null,
    sseConnected: false,
    lastUpdated: Date.now(),
  },
}

/**
 * Create and initialize the sidecar StateStore.
 *
 * Fetches a snapshot from the plugin server and begins listening for
 * SSE-driven state updates.
 *
 * @returns The initialized StateStore instance.
 */
export function createSidecarStateStore() {
  const store = createStateStore(INITIAL_STATE)

  /**
   * Initialize the store by fetching a snapshot from the plugin server.
   */
  async function initialize(): Promise<void> {
    try {
      const client = getPluginClient()
      const snapshot = await client.snapshot()

      // Convert session array to record for O(1) lookup
      const sessionsRecord: Record<string, (typeof snapshot.sessions)[0]> = {}
      for (const session of snapshot.sessions) {
        sessionsRecord[session.id] = session
      }

      const delegationsRecord: Record<string, (typeof snapshot.delegations)[0]> = {}
      for (const del of snapshot.delegations) {
        delegationsRecord[del.id] = del
      }

      store.set("/sessions", sessionsRecord)
      store.set("/delegations", delegationsRecord)
      store.set("/trajectory", snapshot.trajectory)
      store.set("/pressure", snapshot.pressure)
      store.set("/config", snapshot.config)
      store.set("/server", snapshot.server)
      store.set("/ui/lastUpdated", Date.now())
    } catch {
      // Plugin unavailable — store remains in default state.
      // The dashboard shell will show the "not available" message.
    }
  }

  /**
   * Refresh the full snapshot from the plugin server.
   */
  async function refreshSnapshot(): Promise<void> {
    await initialize()
  }

  /**
   * Handle an incoming sidecar event by patching the corresponding
   * state path.
   */
  function handleEvent(event: SidecarEvent): void {
    const { type, payload } = event

    if (type.startsWith("session.")) {
      // Patch sessions path
      const currentSessions = store.get("/sessions") as Record<string, unknown>
      if (payload.session && typeof payload.session === "object") {
        const sessionPayload = payload.session as { id: string }
        if (sessionPayload.id) {
          store.set(`/sessions/${sessionPayload.id}`, sessionPayload)
        }
      }
    } else if (type.startsWith("delegation.")) {
      // Patch delegations path
      if (payload.delegation && typeof payload.delegation === "object") {
        const delPayload = payload.delegation as { id: string }
        if (delPayload.id) {
          store.set(`/delegations/${delPayload.id}`, delPayload)
        }
      }
    } else if (type === "invalidate.cache") {
      // Cache invalidation — evict affected category
      const category = payload.category as string | undefined
      if (category === "sessions") {
        initialize().catch(() => {})
      }
    }

    store.set("/ui/lastUpdated", Date.now())
  }

  /**
   * Set the SSE connection status in the store.
   */
  function setConnected(connected: boolean): void {
    store.set("/ui/sseConnected", connected)
  }

  return {
    getState: () => store.get() as SidecarState,
    get: (path: string) => store.get(path),
    set: (path: string, value: unknown) => store.set(path, value),
    subscribe: (path: string, cb: (value: unknown) => void) => store.subscribe(path, cb),
    initialize,
    refreshSnapshot,
    handleEvent,
    setConnected,
  }
}

export type SidecarStateStore = ReturnType<typeof createSidecarStateStore>
