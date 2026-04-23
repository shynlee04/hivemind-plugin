import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { getContinuityStoragePath } from "./continuity.js"
import type { Delegation } from "./types.js"

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

export function getDelegationsFilePath(): string {
  return join(getDelegationStoreDirectory(), "delegations.json")
}

export function persistDelegations(delegations: Delegation[]): void {
  const filePath = getDelegationsFilePath()
  mkdirSync(dirname(filePath), { recursive: true })
  // Atomic write: write to temp file first, then rename to prevent
  // corrupt reads if the process crashes mid-write.
  const tmpFile = filePath + ".tmp"
  writeFileSync(tmpFile, `${JSON.stringify(delegations, null, 2)}\n`, "utf-8")
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
    ? record.terminalKind
    : undefined

  return {
    id: record.id,
    parentSessionId: record.parentSessionId,
    childSessionId: record.childSessionId,
    agent: record.agent,
    status: record.status as Delegation["status"],
    result: typeof record.result === "string" ? record.result : undefined,
    error: typeof record.error === "string" ? record.error : undefined,
    createdAt: record.createdAt,
    completedAt: typeof record.completedAt === "number" ? record.completedAt : undefined,
    safetyCeilingMs: typeof record.safetyCeilingMs === "number" ? record.safetyCeilingMs : undefined,
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
    terminalKind,
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
      return []
    }

    return parsed
      .map((entry) => normalizePersistedDelegation(entry))
      .filter((entry): entry is Delegation => entry !== null)
  } catch {
    return []
  }
}
