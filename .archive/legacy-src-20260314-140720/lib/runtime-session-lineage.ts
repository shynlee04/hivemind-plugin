import { getClient } from "./sdk-access.js"

type SessionGetClient = {
  session?: {
    get?: (args: { sessionID: string }) => Promise<unknown>
  }
}

export interface RuntimeSessionLineage {
  sessionID: string | null
  parentID: string | null
  isChildSession: boolean
  source: "sdk" | "missing-session-id" | "sdk-unavailable" | "lookup-failed"
}

const runtimeSessionLineageCache = new Map<string, RuntimeSessionLineage>()

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null
}

function getStringField(record: Record<string, unknown> | null, key: string): string | null {
  if (!record) return null
  const value = record[key]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function normalizeSessionLineage(sessionID: string, payload: unknown): RuntimeSessionLineage {
  const record = toRecord(payload)
  const infoRecord = toRecord(record?.info)
  const parentID = getStringField(record, "parentID") ?? getStringField(infoRecord, "parentID")

  return {
    sessionID,
    parentID,
    isChildSession: parentID !== null,
    source: "sdk",
  }
}

/**
 * Resolve the OpenCode session identifier from any supported message shape.
 *
 * @param messages - Message array produced by OpenCode hooks.
 * @returns The first discovered session identifier, or null when unavailable.
 */
export function getSessionIdFromMessages(messages: unknown[]): string | null {
  for (const message of messages) {
    const record = toRecord(message)
    const infoRecord = toRecord(record?.info)
    const infoSessionId = getStringField(infoRecord, "sessionID")
    if (infoSessionId) {
      return infoSessionId
    }

    const parts = Array.isArray(record?.parts) ? record?.parts : []
    for (const part of parts) {
      const partRecord = toRecord(part)
      const partSessionId = getStringField(partRecord, "sessionID")
      if (partSessionId) {
        return partSessionId
      }
    }
  }

  return null
}

/**
 * Resolve parent linkage for the current OpenCode session.
 *
 * @param sessionID - Runtime OpenCode session ID supplied by hooks or message data.
 * @returns Parent linkage metadata used to minimize child-session prompt surfaces.
 */
export async function resolveRuntimeSessionLineage(sessionID?: string | null): Promise<RuntimeSessionLineage> {
  if (!sessionID) {
    return {
      sessionID: null,
      parentID: null,
      isChildSession: false,
      source: "missing-session-id",
    }
  }

  const cached = runtimeSessionLineageCache.get(sessionID)
  if (cached) {
    return cached
  }

  const client = getClient() as SessionGetClient | null
  if (!client?.session?.get) {
    return {
      sessionID,
      parentID: null,
      isChildSession: false,
      source: "sdk-unavailable",
    }
  }

  try {
    const resolved = normalizeSessionLineage(sessionID, await client.session.get({ sessionID }))
    runtimeSessionLineageCache.set(sessionID, resolved)
    return resolved
  } catch {
    return {
      sessionID,
      parentID: null,
      isChildSession: false,
      source: "lookup-failed",
    }
  }
}

export function clearRuntimeSessionLineageCache(): void {
  runtimeSessionLineageCache.clear()
}
