/**
 * Pure utility functions for tool delegation.
 *
 * Extracted from tool-delegation.ts to satisfy the ≤500 LOC gate (GA-4).
 * These are stateless pure functions with no class dependencies.
 *
 * @module session-tracker/tool-delegation-utils
 */

import { parseSessionTitle } from "../../shared/session-naming.js"

/**
 * Returns safe, pruned tool input metadata for child-session JSON journeys.
 *
 * @param tool - Tool name.
 * @param args - Raw tool args.
 * @returns Pruned metadata matching the main-session markdown capture policy.
 */
export function pruneToolInput(tool: string, args: unknown): Record<string, unknown> {
  const record = asRecord(args)
  if (tool === "read") {
    return { filePath: record.filePath }
  }
  if (tool === "skill") {
    return { name: record.name }
  }
  if (tool === "task") {
    return {
      description: record.description,
      subagent_type: record.subagent_type,
      task_id: extractTaskID(record.task_id),
    }
  }
  return { callID: record.callID }
}

/**
 * Returns safe, pruned output metadata for child-session JSON journeys.
 *
 * @param tool - Tool name.
 * @param output - Raw tool output.
 * @param metadata - Raw tool metadata.
 * @returns Pruned output metadata.
 */
export function pruneToolOutput(
  tool: string,
  output: unknown,
  metadata: unknown,
): Record<string, unknown> {
  const meta = asRecord(metadata)
  const result: Record<string, unknown> = {}
  if (tool === "task") {
    result.task_id = extractTaskID(output)
  }
  if (meta.status === "error" || meta.error !== undefined) {
    result.status = "error"
  }
  return result
}

/**
 * Extracts a task session ID from task tool output or direct values.
 *
 * @param value - Raw output or task ID value.
 * @returns Extracted session ID, or undefined.
 */
export function extractTaskID(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const direct = value.match(/\bses_[A-Za-z0-9_-]+\b/)
  return direct?.[0]
}

/**
 * Extracts completed child-session content from a task tool result.
 *
 * @param value - Raw task tool output.
 * @param taskID - Child task/session identifier to remove from the payload.
 * @returns Result content, or undefined for dispatch-only output.
 */
export function extractTaskResult(value: unknown, taskID: string): string | undefined {
  if (typeof value !== "string") return undefined
  const tagged = value.match(/<task_result>\s*([\s\S]*?)\s*<\/task_result>/)
  if (tagged?.[1]?.trim()) return tagged[1].trim()

  const withoutTaskID = value
    .replace(new RegExp(`task_id:\\s*${taskID}`, "g"), "")
    .trim()
  return withoutTaskID.length > 0 ? withoutTaskID : undefined
}

/**
 * Derives a subagent type string from session metadata with fallback chain.
 *
 * Priority:
 * 1. Parse from session title via naming service (most authoritative)
 * 2. Explicit subagentType param (if not "unknown")
 * 3. Agent name (if not "unknown")
 * 4. "unknown" (last resort)
 *
 * @param sessionTitle - Optional session title to parse.
 * @param explicitSubagentType - Optional explicit subagent type.
 * @param agent - Optional agent name.
 * @returns Derived subagent type string.
 */
export function deriveSubagentType(
  sessionTitle?: string,
  explicitSubagentType?: string,
  agent?: string,
): string {
  if (explicitSubagentType && explicitSubagentType !== "unknown") return explicitSubagentType
  if (sessionTitle) {
    const parsed = parseSessionTitle(sessionTitle)
    if (parsed) return parsed.agent
  }
  if (typeof agent === "string" && agent !== "unknown") return agent
  return "unknown"
}

/**
 * Derives an agent name from session metadata by parsing the session title.
 *
 * @param input - Record containing title or sessionTitle.
 * @returns Parsed agent name, or undefined if not parseable.
 */
export function deriveAgentNameFromSession(input: Record<string, unknown>): string | undefined {
  const sessionTitle = typeof input.sessionTitle === "string" ? input.sessionTitle
    : typeof input.title === "string" ? input.title
    : undefined
  if (sessionTitle) {
    const parsed = parseSessionTitle(sessionTitle)
    if (parsed) return parsed.agent
  }
  return undefined
}

/**
 * Safely narrows an unknown value to a record.
 *
 * @param value - Unknown value to inspect.
 * @returns The value as a record, or an empty object.
 */
export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}
