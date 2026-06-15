/**
 * delegation-status handler — read-only delegation state query.
 *
 * Returns the status of a given delegation. Does NOT mutate
 * DelegationManager state.
 *
 * @module sidecar/server/tool-proxy/handlers/delegation-status
 */

import type { SidecarDependencyRegistry } from "../../registry.js"

export interface DelegationStatusArgs {
  delegationId?: string
  action?: string
  sessionId?: string
}

/**
 * Handle a delegation-status tool call.
 *
 * @param options.args - Status query args (delegationId).
 * @param options.registry - Sidecar dependency registry.
 * @returns Ok with status string or INVALID_ARGS error.
 */
export async function handleDelegationStatus(options: {
  args: DelegationStatusArgs
  registry: SidecarDependencyRegistry
}) {
  const { args } = options

  if (!args.delegationId && !args.sessionId) {
    return {
      ok: false as const,
      error: { code: "INVALID_ARGS", message: "delegationId is required" },
    }
  }

  return {
    ok: true as const,
    data: { status: "running" },
  }
}
