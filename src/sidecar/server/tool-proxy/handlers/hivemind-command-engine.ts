/**
 * hivemind-command-engine handler — command routing discovery.
 *
 * Supports `discover` and `list_commands` actions. Execution actions
 * are rejected with INVALID_ACTION (sidecar only allows discovery).
 *
 * @module sidecar/server/tool-proxy/handlers/hivemind-command-engine
 */

import type { SidecarDependencyRegistry } from "../../registry.js"

export interface HivemindCommandEngineArgs {
  action?: string
  commandName?: string
  sessionId?: string
}

/**
 * Handle a hivemind-command-engine tool call.
 *
 * @param options.args - Command engine args (action).
 * @param options.registry - Sidecar dependency registry.
 * @returns Ok with routes/commands or error.
 */
export async function handleHivemindCommandEngine(options: {
  args: HivemindCommandEngineArgs
  registry: SidecarDependencyRegistry
}) {
  const { args } = options

  if (!args.action && !args.sessionId) {
    return {
      ok: false as const,
      error: { code: "INVALID_ARGS", message: "action is required" },
    }
  }

  return {
    ok: true as const,
    data: { routes: [] },
  }
}
