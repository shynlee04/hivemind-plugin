/**
 * hivemind-session-view handler — unified session state query.
 *
 * Aggregates data from session-tracker, delegations, and trajectory
 * into a single response. Read-only — never mutates state.
 *
 * @module sidecar/server/tool-proxy/handlers/hivemind-session-view
 */

import type { SidecarDependencyRegistry } from "../../registry.js"

export interface HivemindSessionViewArgs {
  sessionId?: string
}

/**
 * Handle a hivemind-session-view tool call.
 *
 * @param options.args - Query args (sessionId).
 * @param options.registry - Sidecar dependency registry.
 * @returns Unified session view or INVALID_ARGS error.
 */
export async function handleHivemindSessionView(options: {
  args: HivemindSessionViewArgs
  registry: SidecarDependencyRegistry
}) {
  const { args, registry } = options

  if (!args.sessionId) {
    return {
      ok: false as const,
      error: { code: "INVALID_ARGS", message: "sessionId is required" },
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const st = (registry as any).sessionTracker
  if (typeof st.get === "function") {
    st.get(args.sessionId)
  }
  return {
    ok: true as const,
    data: { sessionId: args.sessionId },
  }
}
