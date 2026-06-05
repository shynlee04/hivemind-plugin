import { asString, getNestedValue } from "../../shared/helpers.js"

export interface SemanticCompletionResult {
  toolActivityStalled: boolean
  hasAssistantMessage: boolean
  hasFileChanges: boolean
  isComplete: boolean
  lastToolActivityAt: number | null
  secondsSinceLastToolActivity: number | null
  /** Cumulative wall-clock duration (ms) that tools were active */
  totalToolActivityDurationMs: number
}

export interface SemanticCompletionOptions {
  toolIdleThresholdMs?: number
  now?: number
  /** Minimum cumulative tool activity duration before completion (default 60000) */
  minTotalToolActivityDurationMs?: number
}

const DEFAULT_TOOL_IDLE_MS = 300_000 // P59 B4: raised from 60s to 300s (5 min) — research tasks need time to read files and write output

const FILE_CHANGE_TOOL_NAMES = new Set([
  "write",
  "edit",
  "create_file",
  "create_or_update_file",
  "bash",
])

const FILE_PATH_PATTERN = /(?:^|[\s"'`])(?:\/[\w.\-]+){2,}\.\w{1,10}(?:$|[\s"'`])/m

/**
 * Extract the role from an OpenCode session message object.
 *
 * Checks `info.role` first (canonical SDK location), then falls back to
 * top-level `role`. Returns `undefined` when no role can be determined.
 *
 * @param message - Session message object of unknown shape.
 * @returns The role string ("user" | "assistant" | "system") or undefined.
 *
 * @example
 * getMessageRole({ info: { role: "assistant" }, parts: [] })
 * // "assistant"
 */
export function getMessageRole(message: unknown): string | undefined {
  return (
    asString(getNestedValue(message, ["info", "role"])) ??
    asString(getNestedValue(message, ["role"]))
  )
}

/**
 * Extract the parts array from an OpenCode session message object.
 *
 * @param message - Session message object of unknown shape.
 * @returns The parts array, or an empty array if not present or not an array.
 *
 * @example
 * getMessageParts({ parts: [{ type: "text", text: "hi" }] })
 * // [{ type: "text", text: "hi" }]
 */
export function getMessageParts(message: unknown): unknown[] {
  const parts = getNestedValue(message, ["parts"])
  return Array.isArray(parts) ? parts : []
}

/**
 * Find the timestamp of the last `tool_use` part across all messages.
 *
 * Iterates through all messages and their parts in order, returning the
 * `timestamp` field of the last part with `type === "tool_use"`. Falls back
 * to the parent message `timestamp` if the part itself lacks one.
 *
 * @param messages - Array of session message objects.
 * @returns Unix timestamp (ms) of the last tool_use, or null if none found.
 *
 * @example
 * findLastToolActivity([{ role: "assistant", parts: [
 *   { type: "tool_use", name: "bash", timestamp: 1000 }
 * ]}])
 * // 1000
 */
export function findLastToolActivity(messages: unknown[]): number | null {
  let lastTimestamp: number | null = null
  for (const message of messages) {
    const parts = getMessageParts(message)
    for (const part of parts) {
      if (getNestedValue(part, ["type"]) !== "tool_use") {
        continue
      }
      const partTs = getNestedValue(part, ["timestamp"])
      const msgTs = getNestedValue(message, ["timestamp"])
      const ts = typeof partTs === "number" ? partTs : typeof msgTs === "number" ? msgTs : null
      if (ts !== null) {
        lastTimestamp = ts
      }
    }
  }
  return lastTimestamp
}

/**
 * Compute the cumulative wall-clock duration (ms) that tools were active.
 *
 * Iterates all messages and their parts, collecting timestamps from tool_use
 * parts. Sorts them and sums the intervals between consecutive timestamps.
 * The final interval extends from the last tool_use timestamp to `now`.
 *
 * Returns 0 when no tool_use parts have timestamps.
 *
 * @param messages - Array of session message objects.
 * @param now - Current time for extending the last interval (defaults to Date.now()).
 * @returns Total cumulative tool activity duration in milliseconds.
 *
 * @example
 * computeTotalToolActivityDuration([
 *   { parts: [{ type: "tool_use", timestamp: 1000 }] },
 *   { parts: [{ type: "tool_use", timestamp: 5000 }] }
 * ], 10000)
 * // (5000 - 1000) + (10000 - 5000) = 9000
 */
export function computeTotalToolActivityDuration(messages: unknown[], now?: number): number {
  const timestamps: number[] = []
  const effectiveNow = now ?? Date.now()

  for (const message of messages) {
    const parts = getMessageParts(message)
    for (const part of parts) {
      if (getNestedValue(part, ["type"]) !== "tool_use") continue
      const partTs = getNestedValue(part, ["timestamp"])
      const msgTs = getNestedValue(message, ["timestamp"])
      const ts = typeof partTs === "number" ? partTs : typeof msgTs === "number" ? msgTs : null
      if (ts !== null) timestamps.push(ts)
    }
  }

  if (timestamps.length === 0) return 0
  timestamps.sort((a, b) => a - b)

  // Sum intervals between consecutive tool_use timestamps
  let total = 0
  for (let i = 1; i < timestamps.length; i++) {
    total += timestamps[i] - timestamps[i - 1]
  }
  // Last tool_use extends to now
  total += effectiveNow - timestamps[timestamps.length - 1]

  return total
}

/**
 * Check whether the last message in the array is from the assistant with usable parts.
 *
 * A usable message has role "assistant" and a non-empty parts array containing
 * at least one part with a truthy `text`, `type`, or `output` field.
 *
 * @param messages - Array of session message objects.
 * @returns true if the last message is a usable assistant message.
 *
 * @example
 * hasAssistantLastMessage([{ role: "assistant", parts: [{ type: "text" }] }])
 * // true
 */
export function hasAssistantLastMessage(messages: unknown[]): boolean {
  if (messages.length === 0) return false
  const last = messages[messages.length - 1]
  if (getMessageRole(last) !== "assistant") return false
  const parts = getMessageParts(last)
  if (parts.length === 0) return false
  return parts.some((p) => {
    const text = getNestedValue(p, ["text"])
    const type = getNestedValue(p, ["type"])
    const output = getNestedValue(p, ["output"])
    return (typeof text === "string" && text.length > 0) || typeof type === "string" || typeof output === "string"
  })
}

/**
 * Detect file-change indicators in `tool_result` parts across all messages.
 *
 * Looks for two signals:
 * 1. Tool names associated with file mutation (`write`, `edit`, `bash`, etc.)
 *    found in tool_use parts that precede tool_result parts.
 * 2. File-path patterns (strings containing path separators and extensions)
 *    in the text content of tool_result parts.
 *
 * @param messages - Array of session message objects.
 * @returns true if at least one file-change indicator is detected.
 *
 * @example
 * hasFileChangeIndicators([{ role: "assistant", parts: [
 *   { type: "tool_use", name: "write", input: { filePath: "/src/a.ts" } },
 *   { type: "tool_result", output: "Wrote /src/a.ts" }
 * ]}])
 * // true
 */
export function hasFileChangeIndicators(messages: unknown[]): boolean {
  const toolUseNames: string[] = []
  for (const message of messages) {
    const parts = getMessageParts(message)
    for (const part of parts) {
      const partType = getNestedValue(part, ["type"])
      if (partType === "tool_use") {
        const name = asString(getNestedValue(part, ["name"]))
        if (name) toolUseNames.push(name)
      }
      if (partType === "tool_result") {
        if (hasFileChangeInToolResult(part)) return true
      }
    }
  }
  return toolUseNames.some((name) => FILE_CHANGE_TOOL_NAMES.has(name))
}

function hasFileChangeInToolResult(part: unknown): boolean {
  const output = asString(getNestedValue(part, ["output"]))
  if (output && FILE_PATH_PATTERN.test(output)) return true
  const text = asString(getNestedValue(part, ["text"]))
  if (text && FILE_PATH_PATTERN.test(text)) return true
  const content = asString(getNestedValue(part, ["content"]))
  if (content && FILE_PATH_PATTERN.test(content)) return true
  return false
}

/**
 * Evaluate whether a delegated session has semantically completed its work.
 *
 * Checks four independent conditions and returns a structured result:
 * 1. **Tool Activity Stall** — no tool_use parts for > threshold milliseconds
 * 2. **Assistant Last Message** — last message is from assistant with usable parts
 * 3. **File Changes Detected** — tool_result content suggests file mutations
 * 4. **Sufficient Tool Duration** — cumulative tool activity >= minimum duration
 *
 * Completion is declared when all four conditions are true.
 *
 * @param messages - Array of session message objects (OpenCode SDK shape).
 * @param options - Optional configuration for idle threshold, time injection, and min duration.
 * @returns Structured result with individual condition flags and aggregate `isComplete`.
 *
 * @example
 * checkSemanticCompletion(messages, { now: Date.now() })
 * // { toolActivityStalled: true, hasAssistantMessage: true, hasFileChanges: true, isComplete: true, ... }
 */
export function checkSemanticCompletion(
  messages: unknown[],
  options?: SemanticCompletionOptions
): SemanticCompletionResult {
  const now = options?.now ?? Date.now()
  const threshold = options?.toolIdleThresholdMs ?? DEFAULT_TOOL_IDLE_MS
  const minDuration = options?.minTotalToolActivityDurationMs ?? DEFAULT_TOOL_IDLE_MS // P59 B4: was 60000, now uses DEFAULT_TOOL_IDLE_MS (300s)
  const lastToolActivityAt = findLastToolActivity(messages)
  const secondsSinceLastToolActivity =
    lastToolActivityAt !== null ? (now - lastToolActivityAt) / 1000 : null
  const toolActivityStalled =
    lastToolActivityAt !== null && now - lastToolActivityAt > threshold
  const hasAssistantMessage = hasAssistantLastMessage(messages)
  const hasFileChanges = hasFileChangeIndicators(messages)
  const totalToolActivityDurationMs = computeTotalToolActivityDuration(messages, now)
  const hasSufficientToolDuration = totalToolActivityDurationMs >= minDuration

  // Completion requires all FOUR conditions
  const isComplete = toolActivityStalled && hasAssistantMessage && hasFileChanges && hasSufficientToolDuration
  return {
    toolActivityStalled,
    hasAssistantMessage,
    hasFileChanges,
    isComplete,
    lastToolActivityAt,
    secondsSinceLastToolActivity,
    totalToolActivityDurationMs,
  }
}
