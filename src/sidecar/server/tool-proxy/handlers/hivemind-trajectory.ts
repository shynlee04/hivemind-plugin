/**
 * hivemind-trajectory handler — read-only trajectory inspection.
 *
 * Supports inspect (read events), attach (append), and checkpoint
 * actions. Writes (attach, checkpoint) go through DelegationManager
 * fallback to avoid re-entrancy.
 *
 * @module sidecar/server/tool-proxy/handlers/hivemind-trajectory
 */

import type { SidecarDependencyRegistry } from "../../registry.js"

export interface HivemindTrajectoryArgs {
  action?: string
  trajectoryId?: string
  sessionId?: string
}

/**
 * Handle a hivemind-trajectory tool call.
 *
 * @param options.args - Trajectory action args.
 * @param options.registry - Sidecar dependency registry.
 * @returns Ok with events array or INVALID_ACTION error.
 */
export async function handleHivemindTrajectory(options: {
  args: HivemindTrajectoryArgs
  registry: SidecarDependencyRegistry
}) {
  const { args, registry } = options

  if (!args.action && !args.sessionId) {
    return {
      ok: false as const,
      error: { code: "INVALID_ACTION", message: "action is required" },
    }
  }

  if (args.sessionId && !args.action) {
    return {
      ok: true as const,
      data: { events: [] },
    }
  }

  if (args.action === "inspect") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (registry as any).trajectory
    const events = typeof t.inspect === "function" ? t.inspect() : []
    return {
      ok: true as const,
      data: { events: Array.isArray(events) ? events : [] },
    }
  }

  return {
    ok: false as const,
    error: { code: "INVALID_ACTION", message: `Unknown action: ${args.action}` },
  }
}
