/**
 * Schema normalizer for SDK snake_case to camelCase conversion.
 *
 * SDK types use mixed conventions (snake_case, PascalCase abbreviations).
 * This module normalizes all field names to consistent camelCase per REQ-ST-12
 * and fills in default values for missing required fields.
 *
 * @module session-tracker/transform/schema-normalizer
 */

import type { SessionRecord, ChildSessionRecord } from "../types.js"

// ---------------------------------------------------------------------------
// String conversion
// ---------------------------------------------------------------------------

/**
 * Converts a snake_case or mixed-case string to camelCase.
 *
 * Splits on underscores, then lowercases the first segment and capitalizes
 * the first letter of subsequent segments while lowercasing the rest.
 *
 * @param str - The string to convert.
 * @returns The camelCase string.
 *
 * @example
 * ```typescript
 * toCamelCase("session_id")      // "sessionId"
 * toCamelCase("parent_session_id") // "parentSessionId"
 * toCamelCase("sessionID")       // "sessionId"
 * ```
 */
export function toCamelCase(str: string): string {
  if (!str) return ""

  // Normalize mixed-case: insert underscore before uppercase letters
  // that follow a lowercase letter. "sessionID" → "session_ID"
  const withUnderscores = str.replace(/([a-z])([A-Z])/g, "$1_$2")

  return withUnderscores
    .split("_")
    .map((segment, index) => {
      if (!segment) return ""
      const lowered = segment.toLowerCase()
      if (index === 0) return lowered
      return lowered.charAt(0).toUpperCase() + lowered.slice(1)
    })
    .join("")
}

// ---------------------------------------------------------------------------
// Key normalization
// ---------------------------------------------------------------------------

/**
 * Recursively transforms all object keys from snake_case to camelCase.
 *
 * @param data - The object to normalize.
 * @returns A new object with camelCase keys.
 */
function normalizeKeys(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const camelKey = toCamelCase(key)
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[camelKey] = normalizeKeys(value as Record<string, unknown>)
    } else {
      result[camelKey] = value
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Record normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes SDK session metadata to a conformant {@link SessionRecord}.
 *
 * Converts all snake_case keys to camelCase and fills in default values
 * for any missing required fields.
 *
 * @param data - Raw session metadata from SDK or hook payload.
 * @returns A normalized, complete SessionRecord.
 */
export function normalizeSessionRecord(
  data: Record<string, unknown>,
): SessionRecord {
  const normalized = normalizeKeys(data)
  const now = new Date().toISOString()

  return {
    sessionID: (
      (normalized.sessionId as string) || ""
    ),
    created: (
      (normalized.createdAt as string) ||
      (normalized.created as string) ||
      now
    ),
    updated: (
      (normalized.updatedAt as string) ||
      (normalized.updated as string) ||
      now
    ),
    parentSessionID: (normalized.parentSessionId as string | null) ?? null,
    delegationDepth: (normalized.delegationDepth as number) ?? 0,
    children: (normalized.children as SessionRecord["children"]) ?? [],
    continuityIndex:
      (normalized.continuityIndex as string) || "session-continuity.json",
    status: (normalized.status as string) || "active",
  }
}

/**
 * Normalizes SDK child session metadata to a conformant {@link ChildSessionRecord}.
 *
 * Converts all snake_case keys to camelCase, normalizes nested objects
 * (delegatedBy, mainAgent), and fills in default values for missing fields.
 *
 * @param data - Raw child session metadata from SDK or hook payload.
 * @returns A normalized, complete ChildSessionRecord.
 */
export function normalizeChildRecord(
  data: Record<string, unknown>,
): ChildSessionRecord {
  const normalized = normalizeKeys(data)
  const now = new Date().toISOString()

  const delegatedBy = (normalized.delegatedBy || {}) as Record<string, unknown>
  const mainAgent = (normalized.mainAgent || {}) as Record<string, unknown>

  return {
    sessionID: (normalized.sessionId as string) || "",
    parentSessionID: (normalized.parentSessionId as string) || "",
    delegationDepth: (normalized.delegationDepth as number) ?? 1,
    delegatedBy: {
      agentName: (delegatedBy.agentName as string) || "unknown",
      tool: (delegatedBy.tool as string) || "task",
      description: (delegatedBy.description as string) || "",
      subagentType: (delegatedBy.subagentType as string) || "",
    },
    created: (normalized.created as string) || now,
    updated: (normalized.updated as string) || now,
    status: (normalized.status as string) || "active",
    mainAgent: {
      name: (mainAgent.name as string) || "unknown",
      model: (mainAgent.model as string) || "unknown",
    },
    turns: (normalized.turns as ChildSessionRecord["turns"]) ?? [],
    children: (normalized.children as ChildSessionRecord["children"]) ?? [],
  }
}
