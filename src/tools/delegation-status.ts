import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import type { DelegationManager } from "../lib/delegation-manager.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"

const DelegationStatusInputSchema = z.object({
  delegationId: z.string().min(1).optional().describe("Specific delegation ID to check"),
  status: z.string().optional().describe("Filter delegations by status (dispatched, running, completed, error, timeout)"),
})

type DelegationStatusInput = z.infer<typeof DelegationStatusInputSchema>

type ToolContext = { sessionID?: string }

export function createDelegationStatusTool(
  delegationManager: DelegationManager,
): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Check delegation status and retrieve results. Returns a specific delegation's state by ID, or lists all delegations (optionally filtered by status).",
    args: {
      delegationId: s.string().optional().describe("Specific delegation ID to check"),
      status: s.string().optional().describe("Filter by status: dispatched, running, completed, error, timeout"),
    },
    async execute(rawArgs: DelegationStatusInput, _context: ToolContext): Promise<string> {
      const args = DelegationStatusInputSchema.parse(rawArgs)

      try {
        // Specific delegation lookup
        if (args.delegationId) {
          const delegation = delegationManager.getStatus(args.delegationId)

        if (!delegation) {
          return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
        }

        const terminalLabel = delegation.terminalKind ?? delegation.status
        const signalSuffix = delegation.terminationSignal ? ` (${delegation.terminationSignal})` : ""
        const message = delegation.terminalKind
          ? `Delegation ${delegation.id} terminal state: ${terminalLabel}${signalSuffix}`
          : `Delegation ${delegation.id} status: ${delegation.status}`

        return renderToolResult(success(message, {
          delegationId: delegation.id,
          status: delegation.status,
            agent: delegation.agent,
            result: delegation.result,
            error: delegation.error,
            createdAt: delegation.createdAt,
            completedAt: delegation.completedAt,
            executionMode: delegation.executionMode,
            surface: delegation.surface,
            recoveryGuarantee: delegation.recoveryGuarantee,
            workingDirectory: delegation.workingDirectory,
            ptySessionId: delegation.ptySessionId,
            fallbackReason: delegation.fallbackReason,
            queueKey: delegation.queueKey,
            terminalKind: delegation.terminalKind,
            terminationSignal: delegation.terminationSignal,
            explicitCancellation: delegation.explicitCancellation,
            nestingDepth: delegation.nestingDepth,
            gracePeriodExpiresAt: delegation.gracePeriodExpiresAt,
          }))
        }

        // List all delegations (optionally filtered)
        const allDelegations = delegationManager.getAllDelegations()

        const filtered = args.status && args.status !== "all"
          ? allDelegations.filter(d => d.status === args.status)
          : allDelegations

        return renderToolResult(success(
          `${filtered.length} delegation(s)${args.status ? ` with status "${args.status}"` : ""}`,
          filtered,
          { total: allDelegations.length },
        ))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { DelegationStatusInputSchema }
