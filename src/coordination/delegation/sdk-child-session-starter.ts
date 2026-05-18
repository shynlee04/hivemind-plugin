import type { OpenCodeClient } from "../../shared/session-api.js"
import { createSession, getSessionID, sendPromptAsync, V2SessionClient } from "../../shared/session-api.js"
import { resolveDelegationPermissionProfile } from "../spawner/spawn-request-builder.js"
import type { ChildSessionStartParams, ChildSessionStartResult } from "./coordinator.js"
import type { OpencodeClient as V2OpencodeClient, PermissionRuleset } from "@opencode-ai/sdk/v2/client"

export interface SdkChildSessionStarterOptions {
  /** v1 SDK client (required for backward compatibility) */
  client: OpenCodeClient
  /** v2 SDK client (optional — enables PermissionRuleset on session.create) */
  v2Client?: V2OpencodeClient
  /** Working directory for v2 client defaults */
  directory?: string
}

/**
 * Starts a delegated OpenCode child session through the SDK session API.
 *
 * When v2Client is provided, uses v2 session.create() with PermissionRuleset
 * for fine-grained tool permissions. Falls back to v1 createSession() when
 * v2Client is unavailable.
 *
 * @param options - SDK clients and configuration
 * @returns Starter dependency used by `DelegationCoordinator` after preflight succeeds.
 *
 * @example
 * ```typescript
 * const starter = createSdkChildSessionStarter({ client, v2Client })
 * await starter.start({ parentSessionId, agent, prompt, delegationId, validatedAgent, workingDirectory })
 * ```
 */
export function createSdkChildSessionStarter(options: SdkChildSessionStarterOptions): {
  start(params: ChildSessionStartParams & { permissions?: PermissionRuleset }): Promise<ChildSessionStartResult>
} {
  return {
    async start(params) {
      // Try v2 SDK with PermissionRuleset if available
      if (options.v2Client && params.permissions) {
        return startWithV2(options.v2Client, options.directory, params)
      }

      // Fallback to v1 session creation
      return startWithV1(options.client, params)
    },
  }
}

async function startWithV2(
  v2Client: V2OpencodeClient,
  directory: string | undefined,
  params: ChildSessionStartParams & { permissions?: PermissionRuleset },
): Promise<ChildSessionStartResult> {
  const v2 = new V2SessionClient(v2Client, { directory })

  // v2 session.create with PermissionRuleset
  const created = await v2.create(params.parentSessionId, {
    title: `Delegation: ${params.agent}`,
    agent: params.agent,
    permissions: params.permissions,
  })

  const childSessionId = (created as { id?: string })?.id
  if (!childSessionId) throw new Error("[Harness] v2 child session creation did not return a session ID.")

  // Send initial prompt via v2
  await v2.prompt(childSessionId, {
    parts: [{ type: "text", text: params.prompt }],
    agent: params.validatedAgent.name,
  })

  return { childSessionId }
}

async function startWithV1(
  client: OpenCodeClient,
  params: ChildSessionStartParams,
): Promise<ChildSessionStartResult> {
  const childSession = await createSession(client, {
    directory: params.workingDirectory,
    parentID: params.parentSessionId,
    title: `Delegation: ${params.agent}`,
  })
  const childSessionId = getSessionID(childSession)
  if (!childSessionId) throw new Error("[Harness] Child session creation did not return a session ID.")

  const permissionProfile = resolveDelegationPermissionProfile({
    agent: params.agent,
    category: params.validatedAgent.category,
    prompt: params.prompt,
  }, params.validatedAgent)

  await sendPromptAsync(client, childSessionId, {
    agent: params.validatedAgent.name,
    parts: [{ type: "text", text: params.prompt }],
    tools: buildDelegationPromptTools(permissionProfile.tools),
  })

  return { childSessionId }
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
