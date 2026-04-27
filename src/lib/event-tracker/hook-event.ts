import { asString, getNestedValue } from "../helpers.js"
import { redactTextSecrets } from "../security/redaction.js"
import { getEventParentID, getEventSessionID } from "../session-api.js"
import type { JourneyEventHookInput, JourneyEventType, SessionJourneyEvent, SessionJourneyToolUsage } from "./types.js"

const MAX_TOOL_SUMMARY_LENGTH = 240

const IGNORED_HOOK_TYPES = new Set([
  "message.updated",
  "message.part.delta",
  "message.part.updated",
  "session.diff",
  "session.status",
])

const TOOL_HOOK_TYPES = new Set([
  "tool.execute.after",
  "tool.executed",
  "tool.completed",
])

const SESSION_HOOK_TYPES = new Set([
  "session.created",
  "session.updated",
  "session.idle",
  "session.deleted",
])

/**
 * Determines whether an OpenCode hook event should be recorded by the event tracker.
 *
 * @param event - The untrusted hook event payload to classify.
 * @returns `true` when the event is a supported session event or a tool event with a session ID.
 *
 * @example
 * ```ts
 * shouldTrackEventTrackerEvent({ type: "session.created" }) // true
 * shouldTrackEventTrackerEvent({ type: "message.updated" }) // false
 * ```
 */
export function shouldTrackEventTrackerEvent(event: unknown): boolean {
  const hookType = resolveHookType(event)
  if (shouldIgnoreHookType(hookType)) return false
  if (SESSION_HOOK_TYPES.has(hookType)) return true
  if (isToolHookType(hookType)) return Boolean(resolveSessionId(event))
  return false
}

/**
 * Builds a filesystem-safe event-tracker artifact stem from a session identifier.
 *
 * @param sessionId - Session, root-session, or semantic ID to collapse into a `ses_####` stem.
 * @returns A lowercase artifact stem suitable for event-tracker JSON and Markdown filenames.
 *
 * @example
 * ```ts
 * sanitizeSessionArtifactStem("ses-abc12345") // "ses_abc1"
 * sanitizeSessionArtifactStem("root-xyz9") // "ses_xyz9"
 * ```
 */
export function sanitizeSessionArtifactStem(sessionId: string): string {
  const explicit = sessionId.match(/ses[_-]?([A-Za-z0-9]{4})/i)?.[1]
  const suffixSource = explicit ?? sessionId.replace(/[^A-Za-z0-9]/g, "").slice(-4)
  const suffix = suffixSource.padEnd(4, "0").slice(0, 4).toLowerCase()
  return `ses_${suffix}`
}

/**
 * Converts an OpenCode hook event into bounded event-tracker metadata without raw payload storage.
 *
 * @param input - Hook event payload plus optional timestamp/source overrides.
 * @returns A redacted, bounded `SessionJourneyEvent` ready for document persistence.
 * @throws {Error} When no session ID can be resolved from the hook payload.
 *
 * @example
 * ```ts
 * const event = createJourneyEventFromHook({
 *   event: { type: "session.created", sessionID: "ses_demo" },
 *   timestamp: 1700000000000,
 * })
 * event.type // "session_start"
 * ```
 */
export function createJourneyEventFromHook(input: JourneyEventHookInput): SessionJourneyEvent {
  const sessionId = resolveSessionId(input.event)
  if (!sessionId) {
    throw new Error("[Harness] Cannot write event-tracker artifact without session ID")
  }
  const hookType = resolveHookType(input.event)
  const type = eventTypeFromHook(hookType)
  const timestamp = input.timestamp ?? Date.now()
  const toolName = isToolHookType(hookType) ? resolveToolName(input.event) : ""
  const title = toolName ? `Tool ${toolName}` : titleFromType(type)
  const rootSessionId = resolveRootSessionId(input.event)
  const artifactStem = sanitizeSessionArtifactStem(rootSessionId || sessionId)
  const toolUsage = toolName ? {
    toolName,
    status: resolveToolStatus(input.event),
    summary: summarizeToolReturn(input.event),
    timestamp,
  } satisfies SessionJourneyToolUsage : undefined
  return {
    id: buildEventId(artifactStem, type, timestamp),
    sessionId,
    ...(rootSessionId ? { rootSessionId } : {}),
    artifactStem,
    type,
    actor: toolName ? "tool" : "system",
    title,
    summary: toolUsage ? `Tool ${toolUsage.toolName} ${toolUsage.status}: ${toolUsage.summary}` : `${title} (${hookType})`,
    timestamp,
    source: input.source ?? "opencode.event",
    stateRole: "audit trail",
    ...(toolUsage ? { toolUsage } : {}),
  }
}

function buildEventId(artifactStem: string, type: JourneyEventType, timestamp: number): string {
  return [artifactStem, type, String(timestamp)].join("::")
}

function eventTypeFromHook(type: string): JourneyEventType {
  if (type === "session.created") return "session_start"
  if (type === "session.updated") return "session_updated"
  if (type === "session.idle") return "session_idle"
  if (type === "session.deleted") return "session_end"
  return "session_event"
}

function shouldIgnoreHookType(type: string): boolean {
  return IGNORED_HOOK_TYPES.has(type)
}

function isToolHookType(type: string): boolean {
  return TOOL_HOOK_TYPES.has(type)
}

function titleFromType(type: JourneyEventType): string {
  switch (type) {
    case "session_start": return "Session started"
    case "session_updated": return "Session updated"
    case "session_idle": return "Session idle"
    case "session_end": return "Session ended"
    case "session_event": return "Session event"
  }
}

function resolveSessionId(event: unknown): string {
  return (getEventSessionID(event)
    || asString(getNestedValue(event, ["sessionID"]))
    || asString(getNestedValue(event, ["sessionId"]))
    || asString(getNestedValue(event, ["properties", "sessionID"]))
    || asString(getNestedValue(event, ["properties", "sessionId"]))
    || "")
}

function resolveRootSessionId(event: unknown): string {
  return (asString(getNestedValue(event, ["properties", "info", "rootID"]))
    || asString(getNestedValue(event, ["properties", "info", "rootId"]))
    || asString(getNestedValue(event, ["properties", "info", "rootSessionID"]))
    || asString(getNestedValue(event, ["properties", "info", "rootSessionId"]))
    || asString(getNestedValue(event, ["properties", "info", "mainSessionID"]))
    || asString(getNestedValue(event, ["properties", "info", "mainSessionId"]))
    || getEventParentID(event)
    || asString(getNestedValue(event, ["properties", "rootSessionID"]))
    || asString(getNestedValue(event, ["properties", "rootSessionId"]))
    || asString(getNestedValue(event, ["properties", "parentID"]))
    || asString(getNestedValue(event, ["properties", "parentId"]))
    || asString(getNestedValue(event, ["rootSessionID"]))
    || asString(getNestedValue(event, ["rootSessionId"]))
    || asString(getNestedValue(event, ["parentID"]))
    || asString(getNestedValue(event, ["parentId"]))
    || "")
}

function resolveHookType(event: unknown): string {
  return asString(getNestedValue(event, ["type"])) || "unknown"
}

function resolveToolName(event: unknown): string {
  return (asString(getNestedValue(event, ["properties", "tool"]))
    || asString(getNestedValue(event, ["properties", "toolName"]))
    || asString(getNestedValue(event, ["tool"]))
    || asString(getNestedValue(event, ["toolName"]))
    || "")
}

function resolveToolStatus(event: unknown): string {
  return (asString(getNestedValue(event, ["properties", "status"]))
    || asString(getNestedValue(event, ["properties", "state"]))
    || asString(getNestedValue(event, ["status"]))
    || "completed")
}

function summarizeToolReturn(event: unknown): string {
  const candidate = (asString(getNestedValue(event, ["properties", "summary"]))
    || asString(getNestedValue(event, ["properties", "resultSummary"]))
    || asString(getNestedValue(event, ["properties", "outputSummary"]))
    || asString(getNestedValue(event, ["summary"]))
    || asString(getNestedValue(event, ["properties", "output"]))
    || asString(getNestedValue(event, ["output"]))
    || "completed")
  const normalized = redactTextSecrets(candidate).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
  return normalized.length <= MAX_TOOL_SUMMARY_LENGTH ? normalized : `${normalized.slice(0, MAX_TOOL_SUMMARY_LENGTH - 1)}…`
}
