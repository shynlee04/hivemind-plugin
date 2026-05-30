import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { getContinuityStoragePath } from "./index.js"

import { redactBoundaryFields } from "../../shared/security/redaction.js"
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

export function persistDelegations(delegations: Delegation[]): void {
  // G-4 (REQ-21-13): Delegations are ALWAYS persisted — removed commit_docs gate.
  // commit_docs schema field is KEPT for GSD framework (162+ refs).
  // The gate was a CA-03 design error: commit_docs controls git commits, not delegation persistence.
  //
  // If opt-out is needed in future, add a separate `persist_delegations` config field.

  const filePath = getDelegationsFilePath()
  mkdirSync(dirname(filePath), { recursive: true })

  // Read existing persisted delegations to perform read-merge-write
  let existing: Delegation[] = []
  try {
    existing = readPersistedDelegations()
  } catch (error) {
    // If the file is corrupt or doesn't exist, log and proceed with incoming only
    console.error(`[Harness] persistDelegations: failed to read existing delegations, overwriting: ${error}`)
  }

  // Merge: incoming overrides/updates existing by id, preserving others.
  // We identify the caller's subsystem to prevent bringing back pruned terminal delegations.
  const incomingMap = new Map(delegations.map(d => [d.id, d]))
  const mergedList: Delegation[] = []

  const isV2Caller = delegations.some(d => d.v2 || d.id.startsWith("dt-"))
  const isV1Caller = delegations.some(d => !d.v2 && !d.id.startsWith("dt-"))
  const isEmptyCaller = delegations.length === 0

  for (const d of delegations) {
    mergedList.push(d)
  }

  for (const d of existing) {
    if (incomingMap.has(d.id)) {
      continue
    }

    const isV2 = d.v2 || d.id.startsWith("dt-")
    const isTerminal = d.status === "completed" || d.status === "error" || d.status === "timeout"

    if (isTerminal) {
      if (isV2Caller && isV2) {
        // v2 coordinator pruned this v2 terminal delegation, do not merge back
        continue
      }
      if (isV1Caller && !isV2) {
        // v1 runtime pruned this v1 terminal delegation, do not merge back
        continue
      }
      if (isEmptyCaller) {
        // If incoming is empty, check if it's a single-subsystem environment (e.g. tests)
        const diskHasV2 = existing.some(x => x.v2 || x.id.startsWith("dt-"))
        const diskHasV1 = existing.some(x => !x.v2 && !x.id.startsWith("dt-"))

        if (diskHasV1 && !diskHasV2 && !isV2) {
          continue
        }
        if (diskHasV2 && !diskHasV1 && isV2) {
          continue
        }
      }
    }

    mergedList.push(d)
  }

  // Atomic write: write to temp file first, then rename to prevent
  // corrupt reads if the process crashes mid-write. Use a unique temp file
  // per write so overlapping persistence calls cannot consume each other's
  // temp file before renameSync runs.
  const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  const redactedDelegations = redactBoundaryFields(mergedList, {
    redactFieldNames: ["result", "error", "fallbackReason"],
  })
  writeFileSync(tmpFile, `${JSON.stringify(redactedDelegations, null, 2)}\n`, "utf-8")
  renameSync(tmpFile, filePath)
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
