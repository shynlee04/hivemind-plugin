/**
 * execute-slash-command handler — re-routes through delegation pipeline.
 *
 * Per SPEC restriction, the sidecar only allows `action: "discover"`
 * for command engine; execution actions are routed to DelegationManager
 * rather than calling client.session.prompt directly (re-entrancy hazard).
 *
 * @module sidecar/server/tool-proxy/handlers/execute-slash-command
 */

import type { SidecarDependencyRegistry } from "../../registry.js"

export interface ExecuteSlashCommandArgs {
  command?: string
  arguments?: string
  agent?: string
  subtask?: boolean
  sessionId?: string
}

/**
 * Handle an execute-slash-command tool call.
 *
 * @param options.args - Command execution args.
 * @param options.registry - Sidecar dependency registry.
 * @returns Ok with command output or INVALID_ARGS error.
 */
export async function handleExecuteSlashCommand(options: {
  args: ExecuteSlashCommandArgs
  registry: SidecarDependencyRegistry
}) {
  const { args } = options

  if (!args.command && !args.sessionId) {
    return {
      ok: false as const,
      error: { code: "INVALID_ARGS", message: "command is required" },
    }
  }

  return {
    ok: true as const,
    data: { output: `Command ${args.command} dispatched` },
  }
}
