import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import { readPersistedDelegations } from "../../task-management/continuity/delegation-persistence.js"
import { redactTextSecrets } from "../../shared/security/redaction.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"
import type { Delegation } from "../../shared/types.js"

/** Zod contract for delegation-status control actions. */
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "redirect"]),
  redirectAgent: z.string().optional(),
  restartPrompt: z.string().optional(),
}).refine((value) => value.action !== "redirect" || !!value.redirectAgent, "redirectAgent is required for redirect")

const DelegationStatusInputSchema = z.object({
  delegationId: z.string().min(1).optional(),
  status: z.string().optional(),
  action: z.enum(["status", "list", "control"]).default("status"),
  control: DelegationControlSchema.optional(),
})

type DelegationStatusInput = z.infer<typeof DelegationStatusInputSchema>
type ToolContext = { sessionID?: string }
type ManagerLike = {
  canSessionAccessDelegation: (sessionId: string | undefined, delegation: Delegation | undefined) => boolean
  controlDelegation?: (request: { action: "abort" | "cancel" | "restart" | "redirect"; delegationId: string; redirectAgent?: string; restartPrompt?: string }) => Promise<unknown>
  getAllDelegations: () => Delegation[]
  getStatus: (id: string) => Delegation | undefined
}
type StatusDeps = { coordinator?: { dispatch: (params: Record<string, unknown>) => Promise<Record<string, unknown>> }; getChildMessageCount?: (sessionId: string) => Promise<number | null>; getEscalationLevel?: (id: string) => string | null; lifecycle?: { isTerminal: (status: string) => boolean; markAborted: (id: string) => unknown; markCancelled: (id: string) => unknown }; now?: () => number; readPersisted?: () => Delegation[]; terminateChild?: (sessionId: string) => Promise<unknown> }

const UNSUPPORTED_REPLACEMENT_MESSAGE =
  "[Harness] restart/redirect is runtime-blocked: @opencode-ai/plugin ToolContext v1.15.4 does not expose a task field or verified custom-tool API for creating a replacement child session. Abort/cancel existing records remain supported; replacement dispatch requires a future verified SDK/CP-PTY path."

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

function formatElapsed(ms: number): string {
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

async function renderDelegationV2(delegation: Delegation & { v2?: boolean; prompt?: string }, deps: StatusDeps): Promise<Record<string, unknown>> {
  const base = renderDelegation(delegation)
  if (!delegation.v2) return { ...base, prompt: delegation.prompt, elapsedMs: null, elapsedHuman: null, progressPct: null }
  const elapsedMs = (deps.now?.() ?? Date.now()) - delegation.createdAt
  const ceiling = delegation.safetyCeilingMs ?? 300_000
  return { ...base, agent: delegation.agent, childMessageCount: await deps.getChildMessageCount?.(delegation.childSessionId), elapsedHuman: formatElapsed(elapsedMs), elapsedMs, escalationLevel: deps.getEscalationLevel?.(delegation.id) ?? null, progressPct: Math.min(99, Math.floor((elapsedMs / ceiling) * 100)), prompt: delegation.prompt }
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
  delegationManager: ManagerLike,
  deps: StatusDeps = {},
): ReturnType<typeof tool> {
  const s = tool.schema
  const readPersisted = deps.readPersisted ?? (deps.lifecycle ? () => [] : readPersistedDelegations)

  return tool({
    description:
      "Check delegation status and retrieve results. Returns a specific delegation's state by ID, or lists all delegations (optionally filtered by status).",
    args: {
      delegationId: s.string().optional().describe("Specific delegation ID to check"),
      status: s.string().optional().describe("Filter by status: dispatched, running, completed, error, timeout"),
      action: s.string().optional().describe("status, list, or control"),
      control: s.object({}).optional().describe("Control action payload"),
    },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      const parsed = DelegationStatusInputSchema.safeParse(rawArgs)
      if (!parsed.success) return renderToolResult(error(`[Harness] Invalid delegation-status input: ${z.prettifyError(parsed.error)}`))
      const args = parsed.data

      try {
        if (!context.sessionID) {
          return renderToolResult(error("[Harness] Missing caller session ID for delegation-status"))
        }
        if (args.action === "list") return renderList(args, context.sessionID, delegationManager, readPersisted, deps)
        if (args.action === "control") return await handleControl(args, context, delegationManager, readPersisted, deps)

        if (args.delegationId) {
          const delegation = delegationManager.getStatus(args.delegationId)
            ?? readPersisted().find((entry) => entry.id === args.delegationId)

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

        return renderToolResult(success(message, await renderDelegationV2(delegation as Delegation & { v2?: boolean }, deps)))
        }

        return renderList(args, context.sessionID, delegationManager, readPersisted, deps)
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

async function renderList(args: DelegationStatusInput, sessionID: string, manager: ManagerLike, readPersisted: () => Delegation[], deps: StatusDeps): Promise<string> {
  const all = mergeDelegations(manager.getAllDelegations(), readPersisted()).filter((d) => manager.canSessionAccessDelegation(sessionID, d))
  const filtered = args.status && args.status !== "all" ? all.filter((d) => d.status === args.status) : all
  return renderToolResult(success(`${filtered.length} delegation(s)${args.status ? ` with status "${args.status}"` : ""}`, await Promise.all(filtered.map((d) => renderDelegationV2(d as Delegation & { v2?: boolean }, deps))), { total: all.length }))
}

async function handleControl(args: DelegationStatusInput, context: ToolContext, manager: ManagerLike, readPersisted: () => Delegation[], deps: StatusDeps): Promise<string> {
  if (!args.delegationId || !args.control) return renderToolResult(error("[Harness] control action requires delegationId and control"))
  const delegation = (manager.getStatus(args.delegationId) ?? readPersisted().find((d) => d.id === args.delegationId)) as (Delegation & { prompt?: string }) | undefined
  if (!delegation) return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
  if (!manager.canSessionAccessDelegation(context.sessionID, delegation)) return renderToolResult(error(`[Harness] Access denied for delegation "${args.delegationId}": caller session is not in the recorded owner lineage`))
  if (deps.lifecycle?.isTerminal(delegation.status)) return renderToolResult(error("[Harness] cannot control terminal delegation"))
  if (manager.controlDelegation) {
    if (args.control.action === "restart" || args.control.action === "redirect") {
      return renderToolResult(error(UNSUPPORTED_REPLACEMENT_MESSAGE))
    }
    const result = await manager.controlDelegation({
      action: args.control.action,
      delegationId: delegation.id,
      redirectAgent: args.control.redirectAgent,
      restartPrompt: args.control.restartPrompt,
    })
    if (args.control.action === "abort") await deps.terminateChild?.(delegation.childSessionId)
    return renderToolResult(success(`Delegation ${delegation.id} ${args.control.action}ed`, result))
  }
  if (args.control.action === "abort") { deps.lifecycle?.markAborted(delegation.id); await deps.terminateChild?.(delegation.childSessionId); return renderToolResult(success(`Delegation ${delegation.id} aborted`, { delegationId: delegation.id, status: "aborted" })) }
  if (args.control.action === "cancel") { deps.lifecycle?.markCancelled(delegation.id); return renderToolResult(success(`Delegation ${delegation.id} cancelled`, { delegationId: delegation.id, status: "cancelled" })) }
  return renderToolResult(error("[Harness] restart/redirect requires coordinator-backed manager control API"))
}

export { DelegationStatusInputSchema }
export { UNSUPPORTED_REPLACEMENT_MESSAGE }
