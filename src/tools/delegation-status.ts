import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import type { DelegationManager } from "../lib/delegation-manager.js"
import { readPersistedDelegations } from "../task-management/continuity/delegation-persistence.js"
import { redactTextSecrets } from "../shared/security/redaction.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"
import type { Delegation } from "../shared/types.js"

const DelegationStatusInputSchema = z.object({
  delegationId: z.string().min(1).optional().describe("Specific delegation ID to check"),
  status: z.string().optional().describe("Filter delegations by status (dispatched, running, completed, error, timeout)"),
})

type DelegationStatusInput = z.infer<typeof DelegationStatusInputSchema>

type ToolContext = { sessionID?: string }

/**
 * Converts a delegation record into the public status-tool response shape.
 *
 * @param delegation - Delegation record from memory or persisted fallback.
 * @returns Serializable status metadata for tool output.
 */
function renderDelegation(delegation: Delegation): Record<string, unknown> {
  return {
    delegationId: delegation.id,
    status: delegation.status,
    agent: delegation.agent,
    result: delegation.result ? redactTextSecrets(delegation.result) : undefined,
    error: delegation.error ? redactTextSecrets(delegation.error) : undefined,
    createdAt: delegation.createdAt,
    completedAt: delegation.completedAt,
    executionMode: delegation.executionMode,
    surface: delegation.surface,
    recoveryGuarantee: delegation.recoveryGuarantee,
    workingDirectory: delegation.workingDirectory,
    ptySessionId: delegation.ptySessionId,
    fallbackReason: delegation.fallbackReason ? redactTextSecrets(delegation.fallbackReason) : undefined,
    queueKey: delegation.queueKey,
    terminalKind: delegation.terminalKind,
    terminationSignal: delegation.terminationSignal,
    explicitCancellation: delegation.explicitCancellation,
    nestingDepth: delegation.nestingDepth,
    gracePeriodExpiresAt: delegation.gracePeriodExpiresAt,
  }
}

/**
 * Merges memory and persisted delegations while keeping memory authoritative.
 *
 * @param activeDelegations - Delegations currently held by DelegationManager.
 * @param persistedDelegations - Durable delegation records from disk.
 * @returns Combined records deduplicated by delegation ID.
 */
function mergeDelegations(activeDelegations: Delegation[], persistedDelegations: Delegation[]): Delegation[] {
  const byId = new Map<string, Delegation>()
  for (const delegation of persistedDelegations) {
    byId.set(delegation.id, delegation)
  }
  for (const delegation of activeDelegations) {
    byId.set(delegation.id, delegation)
  }
  return Array.from(byId.values())
}

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
    async execute(rawArgs: DelegationStatusInput, context: ToolContext): Promise<string> {
      const args = DelegationStatusInputSchema.parse(rawArgs)

      try {
        if (!context.sessionID) {
          return renderToolResult(error("[Harness] Missing caller session ID for delegation-status"))
        }

        // Specific delegation lookup
        if (args.delegationId) {
          const delegation = delegationManager.getStatus(args.delegationId)
            ?? readPersistedDelegations().find((entry) => entry.id === args.delegationId)

        if (!delegation) {
          return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
        }

        if (!delegationManager.canSessionAccessDelegation(context.sessionID, delegation)) {
          return renderToolResult(error(
            `[Harness] Access denied for delegation "${args.delegationId}": caller session is not in the recorded owner lineage`,
          ))
        }

        const terminalLabel = delegation.terminalKind ?? delegation.status
        const signalSuffix = delegation.terminationSignal ? ` (${delegation.terminationSignal})` : ""
        const message = delegation.terminalKind
          ? `Delegation ${delegation.id} terminal state: ${terminalLabel}${signalSuffix}`
          : `Delegation ${delegation.id} status: ${delegation.status}`

        return renderToolResult(success(message, renderDelegation(delegation)))
        }

        // List all delegations (optionally filtered)
        const allDelegations = mergeDelegations(
          delegationManager.getAllDelegations(),
          readPersistedDelegations(),
        ).filter((delegation) => delegationManager.canSessionAccessDelegation(context.sessionID, delegation))

        const filtered = args.status && args.status !== "all"
          ? allDelegations.filter(d => d.status === args.status)
          : allDelegations

        return renderToolResult(success(
          `${filtered.length} delegation(s)${args.status ? ` with status "${args.status}"` : ""}`,
          filtered.map(renderDelegation),
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
