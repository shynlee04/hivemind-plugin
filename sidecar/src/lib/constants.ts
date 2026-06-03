/**
 * SC-03 constants — panel definitions, port configuration, SSE backoff settings.
 *
 * Central source of truth for all configuration values used across the
 * sidecar app. All values are exported as typed `const` declarations.
 *
 * @module sidecar/lib/constants
 */

/** Default port for the sidecar Next.js app. */
export const DEFAULT_PORT = 3099

/** Fallback port used when the sentinel file is not found (independent dev). */
export const FALLBACK_PORT = 3199

/** Path to the sentinel port file, relative to the project root. */
export const PORT_FILE_PATH = ".hivemind/state/sidecar-port.json"

/** Base SSE reconnection delay in milliseconds. */
export const SSE_RECONNECT_BASE_MS = 1000

/** Maximum SSE reconnection backoff in milliseconds. */
export const SSE_MAX_BACKOFF_MS = 30000

/** Heartbeat timeout — connection considered dead after this many ms without a heartbeat event. */
export const HEARTBEAT_TIMEOUT_MS = 90000

/** Interval for retrying plugin server connection when unavailable. */
export const PLUGIN_CHECK_INTERVAL_MS = 5000

/** URL for the SSE events endpoint on the plugin server. */
export const SSE_EVENTS_PATH = "/api/events"

/** URL for the WebSocket delegation endpoint on the plugin server. */
export const WS_DELEGATION_PATH = "/ws/delegation"

/** Panel definitions — each has an id, label, icon, and description. */
export interface PanelDefinition {
  id: "sessions" | "delegation" | "mems" | "control"
  label: string
  icon: string
  description: string
}

/** The 4 panel definitions that form the dashboard grid. */
export const PANELS: readonly PanelDefinition[] = [
  {
    id: "sessions",
    label: "Session Explorer",
    icon: "🔍",
    description: "Browse active sessions, view children, context, and delegation trees",
  },
  {
    id: "delegation",
    label: "Delegation Dashboard",
    icon: "🔀",
    description: "Monitor delegation status, timings, and agent activity",
  },
  {
    id: "mems",
    label: "MEMS Browser",
    icon: "🧠",
    description: "Explore memory documents, trajectory timeline, and pressure metrics",
  },
  {
    id: "control",
    label: "Control Panel",
    icon: "⚙️",
    description: "Execute commands, invoke tools, and configure the runtime",
  },
]

/** Default panel shown when no ?panel= param is provided. */
export const DEFAULT_PANEL: PanelDefinition["id"] = "sessions"

/** Valid panel IDs for runtime validation. */
export type PanelId = PanelDefinition["id"]
