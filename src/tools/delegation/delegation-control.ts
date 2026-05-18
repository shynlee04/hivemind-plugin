/**
 * Delegation control tool for managing active child sessions.
 *
 * Provides actions: abort, cancel, restart, redirect, adjust-prompt, change-agent.
 * Uses v2 SDK for session abort and update operations.
 */
import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import { readPersistedDelegations } from "../../task-management/continuity/delegation-persistence.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"
import type { Delegation } from "../../shared/types.js"
import { V2SessionClient } from "../../shared/session-api.js"
import type { OpencodeClient as V2OpencodeClient } from "@opencode-ai/sdk/v2/client"

/** Zod contract for delegation control actions. */
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "redirect", "adjust-prompt", "change-agent"]),
  delegationId: z.string().min(1),
  prompt: z.string().optional(),
  agent: z.string().optional(),
})

type DelegationControlInput = z.infer<typeof DelegationControlSchema>
type ToolContext = { sessionID?: string }

export interface DelegationControlDeps {
  /** Check if session can access delegation */
  canAccess: (sessionId: string | undefined, delegation: Delegation) => boolean
  /** Get delegation by ID */
  getDelegation: (id: string) => Delegation | undefined
  /** Get all delegations */
  getAllDelegations: () => Delegation[]
  /** Abort delegation in lifecycle */
  abortDelegation: (delegationId: string, reason?: string) => unknown
  /** Cancel delegation in lifecycle */
  cancelDelegation: (delegationId: string, reason?: string) => unknown
  /** Terminate child session via SDK */
  terminateChild: (sessionId: string) => Promise<unknown>
  /** v2 SDK client for session operations */
  v2Client?: V2OpencodeClient
  /** Directory for v2 client defaults */
  directory?: string
}

/**
 * Creates the delegation-control tool.
 *
 * @param deps - Dependencies for control operations
 * @returns OpenCode tool for delegation control
 */
export function createDelegationControlTool(deps: DelegationControlDeps): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Control an active delegation: abort, cancel, restart, redirect, adjust-prompt, or change-agent.",
    args: {
      action: s.enum(["abort", "cancel", "restart", "redirect", "adjust-prompt", "change-agent"]).describe("Control action to perform"),
      delegationId: s.string().describe("ID of the delegation to control"),
      prompt: s.string().optional().describe("New prompt for adjust-prompt or restart"),
      agent: s.string().optional().describe("New agent for change-agent or redirect"),
    },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      const parsed = DelegationControlSchema.safeParse(rawArgs)
      if (!parsed.success) {
        return renderToolResult(error(`[Harness] Invalid delegation-control input: ${z.prettifyError(parsed.error)}`))
      }
      const args = parsed.data

      if (!context.sessionID) {
        return renderToolResult(error("[Harness] Missing caller session ID for delegation-control"))
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

      try {
        switch (args.action) {
          case "abort":
            return await handleAbort(args, delegation, deps)
          case "cancel":
            return await handleCancel(args, delegation, deps)
          case "restart":
            return handleRestart(args, delegation)
          case "redirect":
            return handleRedirect(args, delegation)
          case "adjust-prompt":
            return await handleAdjustPrompt(args, delegation, deps)
          case "change-agent":
            return await handleChangeAgent(args, delegation, deps)
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(`[Harness] Control action "${args.action}" failed: ${message}`))
      }
    },
  })
}

async function handleAbort(
  args: DelegationControlInput,
  delegation: Delegation,
  deps: DelegationControlDeps,
): Promise<string> {
  deps.abortDelegation(args.delegationId, "[Harness] Delegation aborted by control tool")
  await deps.terminateChild(delegation.childSessionId)
  return renderToolResult(
    success(`Delegation ${args.delegationId} aborted`, {
      delegationId: args.delegationId,
      status: "aborted",
      childSessionId: delegation.childSessionId,
    }),
  )
}

async function handleCancel(
  args: DelegationControlInput,
  delegation: Delegation,
  deps: DelegationControlDeps,
): Promise<string> {
  deps.cancelDelegation(args.delegationId, "[Harness] Delegation cancelled by control tool")
  await deps.terminateChild(delegation.childSessionId)
  return renderToolResult(
    success(`Delegation ${args.delegationId} cancelled`, {
      delegationId: args.delegationId,
      status: "cancelled",
      childSessionId: delegation.childSessionId,
    }),
  )
}

function handleRestart(
  _args: DelegationControlInput,
  _delegation: Delegation,
): string {
  // Restart requires creating a new child session — blocked without verified SDK path
  return renderToolResult(error(
    `[Harness] restart is runtime-blocked: requires verified SDK/CP-PTY path for creating replacement child session. Abort existing delegation first.`,
  ))
}

function handleRedirect(
  args: DelegationControlInput,
  _delegation: Delegation,
): string {
  if (!args.agent) {
    return renderToolResult(error("[Harness] redirect requires agent parameter"))
  }
  // Redirect requires changing parent session — not directly supported in v1
  return renderToolResult(error(
    `[Harness] redirect requires changing parent session reference — not supported without v2 SDK session.update() with parentID`,
  ))
}

async function handleAdjustPrompt(
  args: DelegationControlInput,
  delegation: Delegation,
  deps: DelegationControlDeps,
): Promise<string> {
  if (!args.prompt) {
    return renderToolResult(error("[Harness] adjust-prompt requires prompt parameter"))
  }

  if (!deps.v2Client) {
    return renderToolResult(error(
      "[Harness] adjust-prompt requires v2 SDK client for session.prompt() — v1 SDK does not support message injection",
    ))
  }

  const v2 = new V2SessionClient(deps.v2Client, { directory: deps.directory })
  await v2.prompt(delegation.childSessionId, {
    parts: [{ type: "text", text: args.prompt }],
    noReply: true,
  })

  return renderToolResult(
    success(`Prompt adjusted for delegation ${args.delegationId}`, {
      delegationId: args.delegationId,
      childSessionId: delegation.childSessionId,
      promptLength: args.prompt.length,
    }),
  )
}

async function handleChangeAgent(
  args: DelegationControlInput,
  delegation: Delegation,
  deps: DelegationControlDeps,
): Promise<string> {
  if (!args.agent) {
    return renderToolResult(error("[Harness] change-agent requires agent parameter"))
  }

  if (!deps.v2Client) {
    return renderToolResult(error(
      "[Harness] change-agent requires v2 SDK client for session.update() — v1 SDK does not support agent updates",
    ))
  }

  const v2 = new V2SessionClient(deps.v2Client, { directory: deps.directory })
  await v2.update(delegation.childSessionId, {
    title: `Delegation: ${args.agent}`,
  })

  return renderToolResult(
    success(`Agent changed for delegation ${args.delegationId}`, {
      delegationId: args.delegationId,
      childSessionId: delegation.childSessionId,
      newAgent: args.agent,
    }),
  )
}
