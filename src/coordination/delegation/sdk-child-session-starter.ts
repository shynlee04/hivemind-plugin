import type { OpenCodeClient } from "../../shared/session-api.js"
import { createSession, getSessionID, sendPromptAsync } from "../../shared/session-api.js"
import { resolveDelegationPermissionProfile } from "../spawner/spawn-request-builder.js"
import type { ChildSessionStartParams, ChildSessionStartResult } from "./coordinator.js"

/**
 * Starts a delegated OpenCode child session through the SDK session API.
 *
 * @param client - OpenCode SDK client injected by the plugin runtime.
 * @returns Starter dependency used by `DelegationCoordinator` after preflight succeeds.
 *
 * @example
 * ```typescript
 * const starter = createSdkChildSessionStarter(client)
 * await starter.start({ parentSessionId, agent, prompt, delegationId, validatedAgent, workingDirectory })
 * ```
 */
export function createSdkChildSessionStarter(client: OpenCodeClient): {
  start(params: ChildSessionStartParams): Promise<ChildSessionStartResult>
} {
  return {
    async start(params) {
      const childSession = await createSession(client, {
        directory: params.workingDirectory,
        parentID: params.parentSessionId,
        title: `Delegation: ${params.agent}`,
      })
      const childSessionId = getSessionID(childSession)
      if (!childSessionId) throw new Error("[Harness] Child session creation did not return a session ID.")

      // Fire early callback so coordinator maps parent-child session mapping
      // before sendPromptAsync yields or triggers downstream hooks.
      params.onChildSessionId?.(childSessionId)

      const permissionProfile = resolveDelegationPermissionProfile({
        agent: params.agent,
        prompt: params.prompt,
      })

      await sendPromptAsync(client, childSessionId, {
        agent: params.validatedAgent.name,
        parts: [{ type: "text", text: params.prompt }],
        tools: buildDelegationPromptTools(permissionProfile.tools),
        ...(params.model ? { model: params.model } : {}),
      })

      return { childSessionId }
    },
  }
}

/**
 * Converts the resolved permission profile into prompt-time tool toggles.
 * Recursive delegation is always disabled inside delegated children.
 */
function buildDelegationPromptTools(allowedTools: readonly string[]): Record<string, boolean> {
  return {
    ...Object.fromEntries(allowedTools.map((toolName) => [toolName, true])),
    "delegate-task": false,
    task: false,
  }
}
