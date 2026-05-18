/**
 * Resume delegation tool for continuing completed or paused delegations.
 *
 * Allows resuming a delegation with a new prompt, preserving context from
 * the original child session. If the session still exists, sends a new prompt.
 * If archived, creates a new session with parentID pointing to the old one.
 */
import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import { readPersistedDelegations } from "../../task-management/continuity/delegation-persistence.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"
import type { Delegation } from "../../shared/types.js"
import { V2SessionClient } from "../../shared/session-api.js"
import type { OpencodeClient as V2OpencodeClient } from "@opencode-ai/sdk/v2/client"

/** Zod contract for resume delegation input. */
export const ResumeDelegationSchema = z.object({
  delegationId: z.string().min(1),
  prompt: z.string().min(1),
  agent: z.string().optional(),
})

type ResumeDelegationInput = z.infer<typeof ResumeDelegationSchema>
type ToolContext = { sessionID?: string }

export interface ResumeDelegationDeps {
  /** Check if session can access delegation */
  canAccess: (sessionId: string | undefined, delegation: Delegation) => boolean
  /** Get delegation by ID */
  getDelegation: (id: string) => Delegation | undefined
  /** Get all delegations */
  getAllDelegations: () => Delegation[]
  /** Register a new delegation in lifecycle */
  registerDelegation: (delegation: Delegation) => void
  /** Transition delegation status */
  transition: (delegationId: string, status: string) => boolean
  /** v2 SDK client for session operations */
  v2Client?: V2OpencodeClient
  /** Directory for v2 client defaults */
  directory?: string
  /** Create a new delegation ID */
  createDelegationId: () => string
}

/**
 * Creates the resume-delegation tool.
 *
 * @param deps - Dependencies for resume operations
 * @returns OpenCode tool for resuming delegations
 */
export function createResumeDelegationTool(deps: ResumeDelegationDeps): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Resume a completed or paused delegation with a new prompt. Preserves context from the original child session.",
    args: {
      delegationId: s.string().describe("ID of the delegation to resume"),
      prompt: s.string().describe("New prompt to send to the resumed session"),
      agent: s.string().optional().describe("Optional new agent name (default: same as original)"),
    },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      const parsed = ResumeDelegationSchema.safeParse(rawArgs)
      if (!parsed.success) {
        return renderToolResult(error(`[Harness] Invalid resume-delegation input: ${z.prettifyError(parsed.error)}`))
      }
      const args = parsed.data

      if (!context.sessionID) {
        return renderToolResult(error("[Harness] Missing caller session ID for resume-delegation"))
      }

      const delegation = deps.getDelegation(args.delegationId)
        ?? readPersistedDelegations().find((d) => d.id === args.delegationId)

      if (!delegation) {
        return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
      }

      if (!deps.canAccess(context.sessionID, delegation)) {
        return renderToolResult(error(
          `[Harness] Access denied for delegation "${args.delegationId}": caller session is not in the recorded owner lineage`,
        ))
      }

      if (!deps.v2Client) {
        return renderToolResult(error(
          "[Harness] resume-delegation requires v2 SDK client — v1 SDK does not support session.prompt() for resuming",
        ))
      }

      try {
        return await handleResume(args, delegation, deps)
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(`[Harness] Resume failed: ${message}`))
      }
    },
  })
}

async function handleResume(
  args: ResumeDelegationInput,
  delegation: Delegation,
  deps: ResumeDelegationDeps,
): Promise<string> {
  const v2Client = deps.v2Client
  if (!v2Client) {
    throw new Error("[Harness] v2 SDK client required for resume-delegation")
  }

  const v2 = new V2SessionClient(v2Client, { directory: deps.directory })
  const newAgent = args.agent ?? delegation.agent

  // Create a new delegation record that chains from the original
  const newDelegationId = deps.createDelegationId()
  const newDelegation: Delegation = {
    ...delegation,
    id: newDelegationId,
    agent: newAgent,
    prompt: args.prompt,
    status: "dispatched",
    createdAt: Date.now(),
    completedAt: undefined,
    result: undefined,
    error: undefined,
    lastMessageCount: 0,
    stablePollCount: 0,
    restartedFrom: delegation.id,
    terminalKind: undefined,
    terminationSignal: undefined,
    explicitCancellation: undefined,
  }

  deps.registerDelegation(newDelegation)
  deps.transition(newDelegationId, "running")

  // Send new prompt to existing child session (context preserved)
  await v2.prompt(delegation.childSessionId, {
    parts: [{ type: "text", text: args.prompt }],
    agent: newAgent,
  })

  return renderToolResult(
    success(`Delegation resumed: ${newDelegationId}`, {
      delegationId: newDelegationId,
      resumedFrom: delegation.id,
      childSessionId: delegation.childSessionId,
      agent: newAgent,
      status: "running",
    }),
  )
}
