import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"
import { readFile } from "node:fs/promises"

import { readPersistedDelegations } from "../../task-management/continuity/delegation-persistence.js"
import { redactTextSecrets } from "../../shared/security/redaction.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"
import type { Delegation, DelegationStatus, DelegationTerminalKind } from "../../shared/types.js"
import { resolveSessionFile } from "../session/session-resolver.js"
import { safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
import type { HierarchyManifest } from "../../features/session-tracker/types.js"
import { findStackableSessions, findResumableSessions, getRetryRecommendation, buildStackingGuidanceBanner } from "../../coordination/delegation/session-intelligence.js"
import { HierarchyManifestChildSchema, type HierarchyManifestChildValidated } from "./readers/types.js"

// Per-invocation cache for hierarchy-manifest.json — prevents redundant parsing
// within a single tool execution. Keyed by `${projectRoot}::${rootSessionId}`.
const manifestCache = new Map<string, { data: HierarchyManifest; ts: number }>()
const CACHE_TTL = 5_000 // 5 seconds
const MAX_CACHE_ENTRIES = 10

/** Zod contract for delegation-status control actions. */
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "resume", "chain", "adjust-prompt", "change-agent"]),
  chainParentSessionId: z.string().optional(),
  restartPrompt: z.string().optional(),
  agent: z.string().optional(),
}).refine((value) => (value.action === "restart" || value.action === "resume") ? !!value.restartPrompt : true, "restartPrompt is required for restart and resume")
  .refine((value) => value.action !== "chain" || !!value.chainParentSessionId, "chainParentSessionId is required for chain")
  .refine((value) => value.action !== "adjust-prompt" || !!value.restartPrompt, "restartPrompt is required for adjust-prompt")
  .refine((value) => value.action !== "change-agent" || !!value.agent, "agent is required for change-agent")

const DelegationStatusInputSchema = z.object({
  delegationId: z.string().min(1).optional(),
  status: z.string().optional(),
  action: z.enum(["status", "get", "list", "control", "find-stackable"]).default("status"),
  control: DelegationControlSchema.optional(),
  agentFilter: z.string().optional(),
})

type DelegationStatusInput = z.infer<typeof DelegationStatusInputSchema>
type ToolContext = { sessionID?: string }
type ManagerLike = {
  canSessionAccessDelegation: (sessionId: string | undefined, delegation: Delegation | undefined) => boolean
  controlDelegation?: (request: { action: "abort" | "cancel" | "restart" | "resume" | "chain" | "adjust-prompt" | "change-agent"; delegationId: string; chainParentSessionId?: string; restartPrompt?: string; agent?: string }) => Promise<unknown>
  getAllDelegations: () => Delegation[]
  getStatus: (id: string) => Delegation | undefined
}
type StatusDeps = {
  coordinator?: { dispatch: (params: Record<string, unknown>) => Promise<Record<string, unknown>> }
  getChildMessageCount?: (sessionId: string) => Promise<number | null>
  getEscalationLevel?: (id: string) => string | null
  lifecycle?: { isTerminal: (status: string) => boolean; markAborted: (id: string) => unknown; markCancelled: (id: string) => unknown }
  now?: () => number
  readPersisted?: () => Delegation[]
  terminateChild?: (sessionId: string) => Promise<unknown>
  projectRoot?: string
}

const UNSUPPORTED_REPLACEMENT_MESSAGE =
  "[Harness] restart/redirect is runtime-blocked: @opencode-ai/plugin ToolContext v1.15.4 does not expose a task field or verified custom-tool API for creating a replacement child session. Abort/cancel existing records remain supported; replacement dispatch requires a future verified SDK/CP-PTY path."

/**
 * Converts a delegation record into the public status-tool response shape.
 *
 * @param delegation - Delegation record from memory or persisted fallback.
 * @returns Serializable status metadata for tool output.
 */
function renderDelegation(delegation: Delegation): Record<string, unknown> {
  const isTerminal = delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout"
  return {
    delegationId: delegation.id,
    childSessionId: delegation.childSessionId,
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
    actionCount: delegation.actionCount,
    evidenceLevel: delegation.evidenceLevel,
    executionState: delegation.executionState,
    finalMessageExcerpt: delegation.finalMessageExcerpt ? redactTextSecrets(delegation.finalMessageExcerpt) : undefined,
    firstActionAt: delegation.firstActionAt,
    messageCount: delegation.messageCount,
    resume: isTerminal ? { childSessionId: delegation.childSessionId, mode: "continue-child-session" } : undefined,
    signalSource: delegation.signalSource,
    signals: { actionCount: delegation.actionCount ?? 0, messageCount: delegation.messageCount ?? 0, toolCallCount: delegation.toolCallCount ?? 0 },
    toolCallCount: delegation.toolCallCount,
  }
}

function formatElapsed(ms: number): string {
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function calculateProgressPct(delegation: Delegation, elapsedMs: number): number | null {
  if (delegation.status === "completed") return 100
  if (delegation.status === "error" || delegation.status === "timeout") return 100
  return Math.min(99, Math.floor((elapsedMs / 300_000) * 100))
}

async function renderDelegationV2(delegation: Delegation & { v2?: boolean; prompt?: string }, deps: StatusDeps): Promise<Record<string, unknown>> {
  const base = renderDelegation(delegation)
  if (!delegation.v2) return { ...base, prompt: delegation.prompt, elapsedMs: null, elapsedHuman: null, progressPct: null }
  const elapsedMs = (deps.now?.() ?? Date.now()) - delegation.createdAt
  const childMessageCount = await deps.getChildMessageCount?.(delegation.childSessionId)
  return { ...base, agent: delegation.agent, childMessageCount, elapsedHuman: formatElapsed(elapsedMs), elapsedMs, escalationLevel: deps.getEscalationLevel?.(delegation.id) ?? null, progressPct: calculateProgressPct(delegation, elapsedMs), prompt: delegation.prompt, signals: { actionCount: delegation.actionCount ?? 0, messageCount: delegation.messageCount ?? childMessageCount ?? 0, toolCallCount: delegation.toolCallCount ?? 0 } }
}

const VALID_DELEGATION_STATUSES: ReadonlySet<string> = new Set(["dispatched", "running", "completed", "error", "timeout"])

/** Runtime validation for DelegationStatus — rejects unknown status strings. */
function validateDelegationStatus(raw: string): DelegationStatus {
  if (VALID_DELEGATION_STATUSES.has(raw)) return raw as DelegationStatus
  return "running" // Safe fallback: treat unknown status as running (non-terminal)
}

// Helper to construct a Delegation representation from session-tracker child data
async function getSessionTrackerDelegation(projectRoot: string, sessionId: string): Promise<Delegation | null> {
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved || resolved.type !== "child" || !resolved.childRecord) {
    return null
  }
  const childRecord = resolved.childRecord
  const toolCallCount = childRecord.turns.reduce((acc, turn) => acc + (turn.tools?.length ?? 0), 0)

  let result: string | undefined
  let error: string | undefined
  if (childRecord.status === "completed") {
    result = childRecord.lastMessage
  } else if (childRecord.status === "error") {
    error = childRecord.lastMessage
  }

  return {
    id: childRecord.sessionID,
    parentSessionId: childRecord.parentSessionID,
    childSessionId: childRecord.sessionID,
    agent: childRecord.mainAgent?.name ?? childRecord.delegatedBy?.subagentType ?? "unknown",
    status: validateDelegationStatus(childRecord.status),
    result,
    error,
    createdAt: new Date(childRecord.created).getTime(),
    completedAt: childRecord.status !== "active" ? new Date(childRecord.updated).getTime() : undefined,
    executionMode: childRecord.delegatedBy?.tool === "task" ? "sdk" : "headless",
    surface: "agent-delegation",
    recoveryGuarantee: "resumable",
    workingDirectory: projectRoot,
    ptySessionId: undefined,
    fallbackReason: undefined,
    queueKey: "",
    nestingDepth: childRecord.delegationDepth,
    terminalKind: childRecord.status !== "active" ? (childRecord.status as DelegationTerminalKind) : undefined,
    terminationSignal: undefined,
    explicitCancellation: false,
    messageCount: childRecord.turns.length,
    toolCallCount,
    actionCount: toolCallCount,
    finalMessageExcerpt: childRecord.lastMessage,
    lastMessageCount: childRecord.turns.length,
    stablePollCount: 0,
  }
}

// Per-invocation cache helper for hierarchy-manifest.json parsing.
// Returns cached data if available and within TTL; otherwise reads and caches.
async function readManifest(projectRoot: string, rootSessionId: string): Promise<HierarchyManifest> {
  const cacheKey = `${projectRoot}::${rootSessionId}`
  const cached = manifestCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }
  const manifestPath = safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")
  const raw = await readFile(manifestPath, "utf-8")
  const data = JSON.parse(raw) as HierarchyManifest
  // Evict oldest entry if at capacity
  if (manifestCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = manifestCache.entries().next().value
    if (oldest) manifestCache.delete(oldest[0])
  }
  manifestCache.set(cacheKey, { data, ts: Date.now() })
  return data
}

// Helper to find all child sessions in session-tracker for a given parent session
async function getSessionTrackerChildren(projectRoot: string, parentSessionId: string): Promise<Delegation[]> {
  try {
    const resolved = await resolveSessionFile(projectRoot, parentSessionId)
    if (!resolved) return []
    const rootSessionId = resolved.rootSessionId

    const manifest = await readManifest(projectRoot, rootSessionId)
    const allChildren = manifest.children ?? {}

    const children: Delegation[] = []
    for (const [childSessionId, child] of Object.entries(allChildren)) {
      const parsed = HierarchyManifestChildSchema.safeParse(child)
      if (!parsed.success) continue
      const childMeta = parsed.data as HierarchyManifestChildValidated
      if (childMeta.parentSessionID === parentSessionId) {
        children.push({
          id: childSessionId,
          parentSessionId: childMeta.parentSessionID,
          childSessionId: childSessionId,
          agent: childMeta.subagentType ?? "unknown",
          status: childMeta.status as DelegationStatus,
          createdAt: new Date(childMeta.createdAt).getTime(),
          completedAt: childMeta.status !== "active" && childMeta.updatedAt ? new Date(childMeta.updatedAt).getTime() : undefined,
          executionMode: "sdk",
          surface: "agent-delegation",
          recoveryGuarantee: "resumable",
          workingDirectory: projectRoot,
          ptySessionId: undefined,
          fallbackReason: undefined,
          queueKey: "",
          nestingDepth: childMeta.delegationDepth ?? 1,
          terminalKind: childMeta.status !== "active" ? (childMeta.status as DelegationTerminalKind) : undefined,
          terminationSignal: undefined,
          explicitCancellation: false,
          lastMessageCount: 0,
          stablePollCount: 0,
        })
      }
    }
    return children
  } catch {
    return []
  }
}

// Helper to check if caller session can access delegation lineage
async function canAccessDelegation(
  projectRoot: string,
  callerSessionId: string,
  delegation: Delegation,
  manager: ManagerLike,
): Promise<boolean> {
  if (manager.canSessionAccessDelegation(callerSessionId, delegation)) {
    return true
  }
  try {
    const resolvedTarget = await resolveSessionFile(projectRoot, delegation.childSessionId)
    const resolvedCaller = await resolveSessionFile(projectRoot, callerSessionId)
    if (resolvedTarget && resolvedCaller) {
      return resolvedTarget.rootSessionId === resolvedCaller.rootSessionId
    }
  } catch {
    // ignore
  }
  return false
}

interface HierarchyContext {
  parentSessionId: string | null
  rootSessionId: string
  nestingDepth: number
  ancestors: string[]
  children: Array<{ sessionId: string; agent: string; status: string }>
  siblings: Array<{ sessionId: string; agent: string; status: string }>
  descendantCount: number
  delegationPath: string
}

// Helper to construct detailed hierarchy context
async function getHierarchyContext(
  projectRoot: string,
  rootSessionId: string,
  currentSessionId: string,
  parentSessionId: string | null,
  nestingDepth: number,
): Promise<HierarchyContext | null> {
  try {
    const manifest = await readManifest(projectRoot, rootSessionId)
    const allChildren = manifest.children ?? {}

    const ancestors: string[] = []
    let currParent = parentSessionId
    while (currParent && currParent !== rootSessionId) {
      ancestors.push(currParent)
      const parentMeta = allChildren[currParent]
      currParent = parentMeta ? parentMeta.parentSessionID : null
    }
    if (parentSessionId) {
      ancestors.push(rootSessionId)
    }

    const childrenList: Array<{ sessionId: string; agent: string; status: string }> = []
    for (const [id, child] of Object.entries(allChildren)) {
      const parsed = HierarchyManifestChildSchema.safeParse(child)
      if (!parsed.success) continue
      const childMeta = parsed.data as HierarchyManifestChildValidated
      if (childMeta.parentSessionID === currentSessionId) {
        childrenList.push({
          sessionId: id,
          agent: childMeta.subagentType ?? "unknown",
          status: childMeta.status ?? "unknown",
        })
      }
    }

    const siblingsList: Array<{ sessionId: string; agent: string; status: string }> = []
    if (parentSessionId) {
      for (const [id, child] of Object.entries(allChildren)) {
        const parsed = HierarchyManifestChildSchema.safeParse(child)
        if (!parsed.success) continue
        const childMeta = parsed.data as HierarchyManifestChildValidated
        if (childMeta.parentSessionID === parentSessionId && id !== currentSessionId) {
          siblingsList.push({
            sessionId: id,
            agent: childMeta.subagentType ?? "unknown",
            status: childMeta.status ?? "unknown",
          })
        }
      }
    }

    let descendantCount = 0
    for (const [, child] of Object.entries(allChildren)) {
      const parsed = HierarchyManifestChildSchema.safeParse(child)
      if (!parsed.success) continue
      const childMeta = parsed.data as HierarchyManifestChildValidated
      let checkParent: string | null = childMeta.parentSessionID
      const visited = new Set<string>() // Cycle detection: prevents infinite loop on circular parent refs
      while (checkParent) {
        if (visited.has(checkParent)) break // Circular reference detected — stop traversal
        visited.add(checkParent)
        if (checkParent === currentSessionId) {
          descendantCount++
          break
        }
        const parentEntry: unknown = allChildren[checkParent]
        const parentParseResult = parentEntry ? HierarchyManifestChildSchema.safeParse(parentEntry) : undefined
        const parentValidated: HierarchyManifestChildValidated | undefined = parentParseResult?.success ? parentParseResult.data as HierarchyManifestChildValidated : undefined
        checkParent = parentValidated ? (parentValidated.parentSessionID ?? null) : null
      }
    }

    const pathParts = [rootSessionId, ...[...ancestors].reverse().filter(a => a !== rootSessionId)]
    if (currentSessionId !== rootSessionId) {
      pathParts.push(currentSessionId)
    }
    const delegationPath = pathParts.join(" -> ")

    return {
      parentSessionId,
      rootSessionId,
      nestingDepth,
      ancestors,
      children: childrenList,
      siblings: siblingsList,
      descendantCount,
      delegationPath,
    }
  } catch {
    const pathParts = []
    if (parentSessionId) {
      pathParts.push(rootSessionId)
      if (parentSessionId !== rootSessionId) {
        pathParts.push(parentSessionId)
      }
    }
    pathParts.push(currentSessionId)
    return {
      parentSessionId,
      rootSessionId,
      nestingDepth,
      ancestors: parentSessionId ? (parentSessionId === rootSessionId ? [rootSessionId] : [parentSessionId, rootSessionId]) : [],
      children: [],
      siblings: [],
      descendantCount: 0,
      delegationPath: pathParts.join(" -> "),
    }
  }
}

async function mergeAllDelegations(
  projectRoot: string,
  sessionID: string,
  manager: ManagerLike,
  readPersisted: () => Delegation[],
): Promise<Delegation[]> {
  const managerDelegations = manager.getAllDelegations()
  const persisted = readPersisted()
  const trackerChildren = await getSessionTrackerChildren(projectRoot, sessionID)

  const byId = new Map<string, Delegation>()
  const allRecords = [...trackerChildren, ...persisted, ...managerDelegations]

  for (const record of allRecords) {
    const existing = byId.get(record.id)
    if (existing) {
      byId.set(record.id, {
        ...record,
        ...existing,
        messageCount: existing.messageCount ?? record.messageCount,
        toolCallCount: existing.toolCallCount ?? record.toolCallCount,
        actionCount: existing.actionCount ?? record.actionCount,
        finalMessageExcerpt: existing.finalMessageExcerpt || record.finalMessageExcerpt,
        result: existing.result || record.result,
        error: existing.error || record.error,
        completedAt: existing.completedAt || record.completedAt,
      })
    } else {
      byId.set(record.id, record)
    }
  }

  return Array.from(byId.values())
}

export function createDelegationStatusTool(
  delegationManager: ManagerLike,
  deps: StatusDeps = {},
): ReturnType<typeof tool> {
  const s = tool.schema
  const readPersisted = deps.readPersisted ?? (deps.lifecycle ? () => [] : readPersistedDelegations)
  const projectRoot = deps.projectRoot ?? process.cwd()

  return tool({
    description:
      "Check delegation status, discover stackable sessions, and retrieve results. " +
      "Actions: status (default), list, control, find-stackable. " +
      "**find-stackable**: Discovers terminal sessions available for stacking — use BEFORE creating new delegations to prefer stack-on over fresh dispatch. " +
      "The SDK supports stacking onto ANY valid session ID (completed, failed, timed out) both within and across delegation trees.",
    args: {
      delegationId: s.string().optional().describe("Specific delegation ID to check"),
      status: s.string().optional().describe("Filter by status: dispatched, running, completed, error, timeout"),
      action: s.string().optional().describe("status, list, control, or find-stackable"),
      control: s.object({}).optional().describe("Control action payload"),
      agentFilter: s.string().optional().describe("Filter stackable sessions by agent name (for find-stackable action)"),
    },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      // Clear per-invocation cache at start to prevent stale data across rapid tool calls
      manifestCache.clear()

      const parsed = DelegationStatusInputSchema.safeParse(rawArgs)
      if (!parsed.success) return renderToolResult(error(`[Harness] Invalid delegation-status input: ${z.prettifyError(parsed.error)}`))
      const args = parsed.data

      try {
        if (!context.sessionID) {
          return renderToolResult(error("[Harness] Missing caller session ID for delegation-status"))
        }
        if (args.action === "find-stackable") return await handleFindStackable(args, context.sessionID, delegationManager, readPersisted, deps)
        if (args.action === "list") return renderList(args, context.sessionID, delegationManager, readPersisted, deps)
        if (args.action === "control") return await handleControl(args, context.sessionID, delegationManager, readPersisted, deps)

        if (args.delegationId) {
          let delegation = delegationManager.getStatus(args.delegationId)
            ?? delegationManager.getAllDelegations().find((entry) => entry.childSessionId === args.delegationId)
            ?? readPersisted().find((entry) => entry.id === args.delegationId || entry.childSessionId === args.delegationId)

          let trackerDel: Delegation | null = null
          try {
            trackerDel = await getSessionTrackerDelegation(projectRoot, delegation?.childSessionId ?? args.delegationId)
          } catch {
            // ignore
          }

          if (delegation && trackerDel) {
            delegation = {
              ...trackerDel,
              ...delegation,
              messageCount: delegation.messageCount ?? trackerDel.messageCount,
              toolCallCount: delegation.toolCallCount ?? trackerDel.toolCallCount,
              actionCount: delegation.actionCount ?? trackerDel.actionCount,
              finalMessageExcerpt: delegation.finalMessageExcerpt || trackerDel.finalMessageExcerpt,
              result: delegation.result || trackerDel.result,
              error: delegation.error || trackerDel.error,
              completedAt: delegation.completedAt || trackerDel.completedAt,
            }
          } else if (trackerDel) {
            delegation = trackerDel
          }

          if (!delegation) {
            return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
          }

          if (!(await canAccessDelegation(projectRoot, context.sessionID, delegation, delegationManager))) {
            return renderToolResult(error(
              `[Harness] Access denied for delegation "${args.delegationId}": caller session is not in the recorded owner lineage`,
            ))
          }

          const terminalLabel = delegation.terminalKind ?? delegation.status
          const signalSuffix = delegation.terminationSignal ? ` (${delegation.terminationSignal})` : ""
          const message = delegation.terminalKind
            ? `Delegation ${delegation.id} terminal state: ${terminalLabel}${signalSuffix}`
            : `Delegation ${delegation.id} status: ${delegation.status}`

          const rendered = await renderDelegationV2(delegation as Delegation & { v2?: boolean }, deps)

          let rootSessionId = delegation.childSessionId
          let parentSessionId = delegation.parentSessionId
          let nestingDepth = delegation.nestingDepth ?? 1
          try {
            const resolved = await resolveSessionFile(projectRoot, delegation.childSessionId)
            if (resolved) {
              rootSessionId = resolved.rootSessionId
              if (resolved.type === "child" && resolved.childRecord) {
                parentSessionId = resolved.childRecord.parentSessionID
                nestingDepth = resolved.childRecord.delegationDepth
              }
            }
          } catch {
            // ignore
          }

          const hierarchy = await getHierarchyContext(
            projectRoot,
            rootSessionId,
            delegation.childSessionId,
            parentSessionId,
            nestingDepth
          )

          const isTerminal = delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout"
          const retryRecommendation = isTerminal ? getRetryRecommendation(delegation) : null
          const options = {
            canAbort: !isTerminal,
            canCancel: !isTerminal,
            canResume: isTerminal,
            canChain: isTerminal,
            canStackOn: isTerminal,
            resumeCommand: isTerminal
              ? `task({ subagent_type: "${delegation.agent}", task_id: "${delegation.childSessionId}", prompt: "..." })`
              : undefined,
            stackCommand: isTerminal
              ? `delegate-task({ agent: "${delegation.agent}", prompt: "...", stackOnSessionId: "${delegation.childSessionId}" })`
              : undefined,
            retryCommand: retryRecommendation
              ? redactTextSecrets(retryRecommendation.taskCommand)
              : undefined,
            retryGuidance: retryRecommendation
              ? redactTextSecrets(retryRecommendation.guidance)
              : undefined,
          }

          return renderToolResult(success(message, {
            ...rendered,
            hierarchy,
            options,
          }))
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
  const projectRoot = deps.projectRoot ?? process.cwd()
  const all = await mergeAllDelegations(projectRoot, sessionID, manager, readPersisted)

  const accessible = []
  for (const d of all) {
    if (await canAccessDelegation(projectRoot, sessionID, d, manager)) {
      accessible.push(d)
    }
  }

  const filtered = args.status && args.status !== "all" ? accessible.filter((d) => d.status === args.status) : accessible

  // Proactively surface stackable and resumable sessions in list output
  const stackable = findStackableSessions(accessible)
  const resumable = findResumableSessions(accessible)
  const guidanceBanner = buildStackingGuidanceBanner(stackable.length, resumable.length)

  const renderedDelegations = await Promise.all(filtered.map((d) => renderDelegationV2(d as Delegation & { v2?: boolean }, deps)))
  return renderToolResult(success(
    `${filtered.length} delegation(s)${args.status ? ` with status "${args.status}"` : ""}\n${guidanceBanner}`,
    renderedDelegations,
    {
      total: accessible.length,
      stackableCount: stackable.length,
      resumableCount: resumable.length,
      stackableSessions: stackable.slice(0, 10).map(s => ({
        childSessionId: s.childSessionId,
        agent: s.agent,
        status: s.status,
        stackCommand: s.delegateTaskCommand,
        reason: s.reason,
      })),
    },
  ))
}

async function handleControl(args: DelegationStatusInput, callerSessionId: string, manager: ManagerLike, readPersisted: () => Delegation[], deps: StatusDeps): Promise<string> {
  if (!args.delegationId || !args.control) return renderToolResult(error("[Harness] control action requires delegationId and control"))
  const projectRoot = deps.projectRoot ?? process.cwd()

  let delegation = (manager.getStatus(args.delegationId)
    ?? manager.getAllDelegations().find((d) => d.childSessionId === args.delegationId)
    ?? readPersisted().find((d) => d.id === args.delegationId || d.childSessionId === args.delegationId)) as (Delegation & { prompt?: string }) | undefined

  if (!delegation) {
    const trackerDel = await getSessionTrackerDelegation(projectRoot, args.delegationId)
    if (trackerDel) {
      delegation = trackerDel
    }
  }

  if (!delegation) return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
  if (!(await canAccessDelegation(projectRoot, callerSessionId, delegation, manager))) return renderToolResult(error(`[Harness] Access denied for delegation "${args.delegationId}": caller session is not in the recorded owner lineage`))

  const isTerminal = delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout"
  if (isTerminal) {
    if (args.control.action === "cancel" || args.control.action === "abort") {
      const existsInManager = manager.getStatus(delegation.id) !== undefined
      if (args.control.action === "cancel") {
        if (existsInManager) {
          deps.lifecycle?.markCancelled?.(delegation.id)
        }
        return renderToolResult(success(`Delegation ${delegation.id} cancelled (was terminal: ${delegation.status})`, { delegationId: delegation.id, status: "cancelled", wasTerminal: delegation.status }))
      }
      if (args.control.action === "abort") {
        if (existsInManager) {
          deps.lifecycle?.markAborted?.(delegation.id)
        }
        await deps.terminateChild?.(delegation.childSessionId)
        return renderToolResult(success(`Delegation ${delegation.id} aborted (was terminal: ${delegation.status})`, { delegationId: delegation.id, status: "aborted", wasTerminal: delegation.status }))
      }
    }
    return renderToolResult(error("[Harness] cannot control terminal delegation"))
  }

  if (manager.controlDelegation) {
    const result = await manager.controlDelegation({
      action: args.control.action,
      delegationId: delegation.id,
      chainParentSessionId: args.control.chainParentSessionId,
      restartPrompt: args.control.restartPrompt,
      agent: args.control.agent,
    })
    if (args.control.action === "abort") await deps.terminateChild?.(delegation.childSessionId)
    return renderToolResult(success(`Delegation ${delegation.id} ${args.control.action}ed`, result))
  }

  const existsInManager = manager.getStatus(delegation.id) !== undefined
  if (args.control.action === "abort") {
    if (existsInManager) {
      deps.lifecycle?.markAborted(delegation.id)
    }
    await deps.terminateChild?.(delegation.childSessionId)
    return renderToolResult(success(`Delegation ${delegation.id} aborted`, { delegationId: delegation.id, status: "aborted" }))
  }
  if (args.control.action === "cancel") {
    if (existsInManager) {
      deps.lifecycle?.markCancelled(delegation.id)
    }
    return renderToolResult(success(`Delegation ${delegation.id} cancelled`, { delegationId: delegation.id, status: "cancelled" }))
  }
  return renderToolResult(error("[Harness] restart/redirect requires coordinator-backed manager control API"))
}

/**
 * Handles the find-stackable action: discovers terminal sessions available
 * for stacking new work onto, surfacing ready-to-use commands.
 */
async function handleFindStackable(
  args: DelegationStatusInput,
  sessionID: string,
  manager: ManagerLike,
  readPersisted: () => Delegation[],
  deps: StatusDeps,
): Promise<string> {
  const projectRoot = deps.projectRoot ?? process.cwd()
  const all = await mergeAllDelegations(projectRoot, sessionID, manager, readPersisted)

  const accessible = []
  for (const d of all) {
    if (await canAccessDelegation(projectRoot, sessionID, d, manager)) {
      accessible.push(d)
    }
  }

  const stackable = findStackableSessions(accessible, args.agentFilter)
  const resumable = findResumableSessions(accessible)
  const banner = buildStackingGuidanceBanner(stackable.length, resumable.length)

  if (stackable.length === 0 && resumable.length === 0) {
    return renderToolResult(success(
      "No stackable or resumable sessions found — new dispatch is appropriate.",
      { stackable: [], resumable: [], guidance: banner },
    ))
  }

  return renderToolResult(success(
    banner,
    {
      stackable: stackable.slice(0, 15).map(s => ({
        childSessionId: s.childSessionId,
        agent: s.agent,
        status: s.status,
        delegationId: s.delegationId,
        completedAt: s.completedAt,
        error: s.error,
        reason: s.reason,
        taskCommand: s.taskCommand,
        delegateTaskCommand: s.delegateTaskCommand,
        finalMessageExcerpt: s.finalMessageExcerpt,
      })),
      resumable: resumable.slice(0, 10).map(s => ({
        childSessionId: s.childSessionId,
        agent: s.agent,
        status: s.status,
        delegationId: s.delegationId,
        reason: s.reason,
        taskCommand: s.taskCommand,
      })),
    },
  ))
}

export { DelegationStatusInputSchema }
export { UNSUPPORTED_REPLACEMENT_MESSAGE }
