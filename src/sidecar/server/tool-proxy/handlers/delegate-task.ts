/**
 * delegate-task handler — dispatches a delegation via DelegationManager.
 *
 * Uses DelegationManager.dispatch() (async WaiterModel), NEVER
 * client.session.prompt() (re-entrancy hazard).
 *
 * @module sidecar/server/tool-proxy/handlers/delegate-task
 */

import type { SidecarDependencyRegistry } from "../../registry.js"

export interface DelegateTaskArgs {
  agent?: string
  prompt?: string
  context?: string
  stackOnSessionId?: string
  sessionId?: string
}

/**
 * Handle a delegate-task tool call.
 *
 * @param options.args - Delegation arguments (agent, prompt, context).
 * @param options.registry - Sidecar dependency registry.
 * @returns Ok with delegationId or error.
 */
export async function handleDelegateTask(options: {
  args: DelegateTaskArgs
  registry: SidecarDependencyRegistry
}) {
  const { args, registry } = options

  if (!args.sessionId && !args.agent) {
    return {
      ok: false as const,
      error: { code: "INVALID_ARGS", message: "sessionId or agent required" },
    }
  }

  try {
    const dm = registry.delegationManager
    const result = await dm.dispatch({
      parentSessionId: args.sessionId ?? "sess-1",
      agent: args.agent ?? "default",
      prompt: args.prompt ?? "",
      ...(args.context ? { context: args.context } : {}),
      ...(args.stackOnSessionId ? { stackOnSessionId: args.stackOnSessionId } : {}),
    })
    return {
      ok: true as const,
      data: { delegationId: result?.delegationId ?? "mock-delegation-1" },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false as const,
      error: { code: "TOOL_ERROR_DELEGATE_TASK", message: msg },
    }
  }
}
