import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { getContinuityStoragePath } from "./index.js"

import { redactBoundaryFields } from "../../shared/security/redaction.js"
import { ChildWriter } from "../../features/session-tracker/persistence/child-writer.js"
import { HierarchyManifestWriter } from "../../features/session-tracker/persistence/hierarchy-manifest.js"
import type { ChildSessionRecord } from "../../features/session-tracker/types.js"
import type { Delegation, DelegationStatus } from "../../shared/types.js"

const VALID_DELEGATION_STATUSES: ReadonlySet<string> = new Set<string>([
  "dispatched",
  "running",
  "completed",
  "error",
  "timeout",
])

function isValidDelegationStatus(value: string): value is DelegationStatus {
  return VALID_DELEGATION_STATUSES.has(value)
}

function deriveSurface(executionMode: Delegation["executionMode"]): NonNullable<Delegation["surface"]> {
  return executionMode === "sdk" ? "agent-delegation" : "command-process"
}

function deriveRecoveryGuarantee(
  executionMode: Delegation["executionMode"],
): NonNullable<Delegation["recoveryGuarantee"]> {
  if (executionMode === "sdk") {
    return "resumable"
  }
  if (executionMode === "pty") {
    return "best-effort"
  }
  return "non-resumable-after-restart"
}

function getDelegationStoreDirectory(): string {
  return dirname(getContinuityStoragePath())
}

/**
 * Moves a corrupt delegation persistence file aside for operator inspection.
 *
 * @param filePath - Path to the unreadable `delegations.json` file.
 * @returns The quarantine path containing the original corrupt payload.
 */
function quarantineCorruptDelegationsFile(filePath: string): string {
  const quarantinePath = `${filePath}.corrupt-${Date.now()}-${process.pid}-${randomUUID()}`
  renameSync(filePath, quarantinePath)
  return quarantinePath
}

export function getDelegationsFilePath(): string {
  return join(getDelegationStoreDirectory(), "delegations.json")
}

/**
 * Builds a ChildSessionRecord from a Delegation for dual-write to session-tracker.
 * REF: REQ-P41B-04 field mapping table.
 */
function buildChildRecordFromDelegation(d: Delegation): ChildSessionRecord {
  const status = d.status === "dispatched" || d.status === "running" ? "active"
    : d.status === "completed" ? "completed"
    : "error" // timeout / error both map to error

  return {
    sessionID: d.childSessionId,
    parentSessionID: d.parentSessionId,
    delegationDepth: d.nestingDepth ?? 1,
    delegatedBy: {
      agentName: d.agent,
      model: "",
      tool: "task",
      description: d.prompt ?? "",
      subagentType: "",
    },
    created: new Date(d.createdAt).toISOString(),
    updated: d.completedAt ? new Date(d.completedAt).toISOString() : new Date().toISOString(),
    status,
    mainAgent: { name: d.agent, model: "" },
    turns: [],
    children: [],
    // 7 new gap fields (P41-B)
    queueKey: d.queueKey || undefined,
    terminalKind: d.terminalKind,
    recoveryGuarantee: d.recoveryGuarantee,
    executionMode: d.executionMode,
  }
}

export function persistDelegations(delegations: Delegation[]): void {
  // G-4 (REQ-21-13): Delegations are ALWAYS persisted — removed commit_docs gate.
  // commit_docs schema field is KEPT for GSD framework (162+ refs).
  // The gate was a CA-03 design error: commit_docs controls git commits, not delegation persistence.
  //
  // If opt-out is needed in future, add a separate `persist_delegations` config field.
  //
  // REQ-P41D-01: No delegations.json file I/O. Session-tracker is canonical.

  // --- P41-B: Dual-write to session-tracker (fire-and-forget, best-effort) ---
  try {
    const storeDir = getDelegationStoreDirectory()
    const projectRoot = dirname(storeDir) // parent of the .hivemind/state directory
    const childWriter = new ChildWriter({ projectRoot })
    const manifestWriter = new HierarchyManifestWriter({ projectRoot })

    for (const d of delegations) {
      if (!d.childSessionId || !d.parentSessionId) {
        console.warn(`[Harness] persistDelegations dual-write: skipping delegation ${d.id} — missing session IDs`)
        continue
      }

      const childRecord = buildChildRecordFromDelegation(d)
      childWriter.createChildFile(d.parentSessionId, d.childSessionId, childRecord).catch((err) => {
        // Fire-and-forget: log, never throw — old sync path already wrote to delegations.json
        console.error(`[Harness] persistDelegations dual-write (child file): ${err instanceof Error ? err.message : String(err)}`)
      })

      manifestWriter.addChild({
        rootMainSessionID: d.parentSessionId, // fallback — correct for depth-1; regeneratable from continuity
        childSessionID: d.childSessionId,
        parentSessionID: d.parentSessionId,
        delegationDepth: d.nestingDepth ?? 1,
        delegatedBy: d.agent,
        subagentType: "",
        childFile: `${d.childSessionId}.json`,
      }).catch((err) => {
        console.error(`[Harness] persistDelegations dual-write (manifest): ${err instanceof Error ? err.message : String(err)}`)
      })
    }
  } catch (err) {
    // Fire-and-forget: log but never throw — old sync path already wrote to delegations.json
    console.error(`[Harness] persistDelegations dual-write error: ${err instanceof Error ? err.message : String(err)}`)
  }
}

function normalizePersistedDelegation(value: unknown): Delegation | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.id !== "string"
    || typeof record.parentSessionId !== "string"
    || typeof record.childSessionId !== "string"
    || typeof record.agent !== "string"
    || typeof record.status !== "string"
    || typeof record.createdAt !== "number"
  ) {
    return null
  }

  const fallbackReason = typeof record.fallbackReason === "string" ? record.fallbackReason : undefined
  const rawExecutionMode = record.executionMode
  const executionMode: Delegation["executionMode"] = rawExecutionMode === "pty"
    ? "pty"
    : rawExecutionMode === "sdk"
      ? "sdk"
      : fallbackReason
        ? "headless"
        : "sdk"
  const surface = record.surface === "agent-delegation" || record.surface === "command-process"
    ? record.surface
    : deriveSurface(executionMode)
  const recoveryGuarantee = record.recoveryGuarantee === "resumable"
      || record.recoveryGuarantee === "best-effort"
      || record.recoveryGuarantee === "non-resumable-after-restart"
    ? record.recoveryGuarantee
    : deriveRecoveryGuarantee(executionMode)
  const terminalKind = record.terminalKind === "completed"
      || record.terminalKind === "error"
      || record.terminalKind === "timeout"
      || record.terminalKind === "cancelled"
      || record.terminalKind === "interrupted-by-signal"
      || record.terminalKind === "non-resumable-after-restart"
    ? record.terminalKind
    : undefined

  const rawStatus = record.status
  const normalizedStatus: DelegationStatus = isValidDelegationStatus(rawStatus) ? rawStatus : "error"
  const normalizedError = typeof record.error === "string"
    ? record.error
    : normalizedStatus === rawStatus
      ? undefined
      : `[Harness] Invalid persisted delegation status: ${rawStatus}`
  const normalizedTerminalKind = terminalKind ?? (normalizedStatus === rawStatus ? undefined : "error")

  return {
    id: record.id,
    parentSessionId: record.parentSessionId,
    childSessionId: record.childSessionId,
    agent: record.agent,
    status: normalizedStatus,
    result: typeof record.result === "string" ? record.result : undefined,
    error: normalizedError,
    createdAt: record.createdAt,
    completedAt: typeof record.completedAt === "number" ? record.completedAt : undefined,
    lastMessageCount: typeof record.lastMessageCount === "number" ? record.lastMessageCount : 0,
    stablePollCount: typeof record.stablePollCount === "number" ? record.stablePollCount : 0,
    lastMessageCountChangeAt:
      typeof record.lastMessageCountChangeAt === "number"
        ? record.lastMessageCountChangeAt
        : typeof record.createdAt === "number"
          ? record.createdAt
          : Date.now(),
    executionMode,
    surface,
    recoveryGuarantee,
    workingDirectory: typeof record.workingDirectory === "string" ? record.workingDirectory : process.cwd(),
    ptySessionId: typeof record.ptySessionId === "string" ? record.ptySessionId : undefined,
    fallbackReason,
    queueKey: typeof record.queueKey === "string" ? record.queueKey : "",
    nestingDepth: typeof record.nestingDepth === "number" ? record.nestingDepth : 1,
    terminalKind: normalizedTerminalKind,
    terminationSignal: typeof record.terminationSignal === "string" ? record.terminationSignal : undefined,
    explicitCancellation: typeof record.explicitCancellation === "boolean" ? record.explicitCancellation : false,
    gracePeriodExpiresAt:
      typeof record.gracePeriodExpiresAt === "number"
        ? record.gracePeriodExpiresAt
        : undefined,
  }
}

export function readPersistedDelegations(): Delegation[] {
  const filePath = getDelegationsFilePath()
  if (!existsSync(filePath)) {
    return []
  }

  try {
    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      throw new Error(`[Harness] Invalid persisted delegations shape at ${filePath}: expected JSON array`)
    }

    return parsed
      .map((entry) => normalizePersistedDelegation(entry))
      .filter((entry): entry is Delegation => entry !== null)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[Harness] Invalid persisted delegations shape")) {
      throw error
    }

    const quarantinePath = quarantineCorruptDelegationsFile(filePath)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[Harness] Failed to read persisted delegations at ${filePath}; corrupt file quarantined at ${quarantinePath}: ${message}`,
    )
  }
}
