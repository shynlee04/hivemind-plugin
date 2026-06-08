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
 * GAP-01 fix (sidecar-completeness-2026-06-06): the previous implementation
 * called `st.get(sessionId)` but DISCARDED the result, always returning
 * `{ ok: true, data: { sessionId } }` with no real data. This fix:
 *   - Uses the typed `registry.sessionTracker` getter (no `(registry as any)`)
 *   - Captures the `sessionTracker.get()` result and returns the full record
 *   - Throws `[Hivemind]` if `sessionTracker` is not bound (registry design
 *     contract — typed getter throws on unbound access)
 *   - Returns a NOT_FOUND error envelope if the session is not found
 *
 * @param options.args - Query args (sessionId).
 * @param options.registry - Sidecar dependency registry.
 * @returns Unified session view, or an error envelope.
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

  // Typed getter — throws [Hivemind] Sidecar: SessionTracker not bound yet
  // when the dependency has not been wired. This eliminates the previous
  // `(registry as any).sessionTracker` cast, addressing GAP-07 for this
  // handler file.
  const sessionTracker = registry.sessionTracker
  const session = await sessionTracker.get(args.sessionId)
  if (session === undefined || session === null) {
    return {
      ok: false as const,
      error: {
        code: "NOT_FOUND",
        message: `Session ${args.sessionId} not found`,
      },
    }
  }

  return { ok: true as const, data: { session } }
}
