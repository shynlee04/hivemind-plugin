import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { getContinuityStoragePath } from "./continuity.js"
import type { Delegation } from "./types.js"

function getDelegationStoreDirectory(): string {
  return dirname(getContinuityStoragePath())
}

export function getDelegationsFilePath(): string {
  return join(getDelegationStoreDirectory(), "delegations.json")
}

export function persistDelegations(delegations: Delegation[]): void {
  const filePath = getDelegationsFilePath()
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(delegations, null, 2)}\n`, "utf-8")
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
    workingDirectory: typeof record.workingDirectory === "string" ? record.workingDirectory : process.cwd(),
    ptySessionId: typeof record.ptySessionId === "string" ? record.ptySessionId : undefined,
    fallbackReason,
    queueKey: typeof record.queueKey === "string" ? record.queueKey : "",
    nestingDepth: typeof record.nestingDepth === "number" ? record.nestingDepth : 1,
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
