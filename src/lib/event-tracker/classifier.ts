import { CLASSIFIED_EVENT_TYPES } from "./types.js"
import type { ClassifiedEvent, ClassifiedEventType } from "./types.js"

/**
 * Classifies a raw event into one of the 10 classified event types.
 *
 * Examines the raw event payload for known patterns (role fields, type fields,
 * delegation identifiers, error indicators) and returns a typed classification.
 * Unknown events that match no pattern are classified as 'unknown'.
 *
 * @param event - The raw event payload to classify. May be any type including null/undefined.
 * @returns A {@link ClassifiedEvent} with the determined type and classification metadata.
 *
 * @example
 * ```ts
 * const classified = classifyEvent({ role: "user", content: "hello" })
 * classified.type // "user_message"
 * ```
 */
export function classifyEvent(event: unknown): ClassifiedEvent {
  const classifiedAt = Date.now()
  if (!isObject(event)) {
    return { type: "unknown", original: event, classifiedAt }
  }

  const type = resolveClassifiedType(event)
  return { type, original: event, classifiedAt }
}

/**
 * Resolves the classified event type by examining event payload patterns.
 *
 * Priority order: explicit type match → error → delegation → tool → role-based → unknown.
 * This ensures deterministic classification when multiple patterns could match.
 *
 * @param event - A validated non-null object event payload.
 * @returns The matching classified event type, or 'unknown'.
 */
function resolveClassifiedType(event: Record<string, unknown>): ClassifiedEventType | "unknown" {
  const explicitType = asString(event.type)
  if (isClassifiedType(explicitType)) return explicitType

  if (event.error !== undefined) return "error"
  if (isDelegationCreated(event)) return "delegation_created"
  if (isDelegationReturned(event)) return "delegation_returned"
  if (asString(event.toolName) !== "") return "tool_invocation"

  const role = asString(event.role)
  if (role === "user") return "user_message"
  if (role === "assistant") return "assistant_output"

  return "unknown"
}

/**
 * Checks whether a delegation is being created based on hook type, status, or ID presence.
 *
 * Matches `session.created` hook events, or events with `status=created` and a `delegationId`.
 */
function isDelegationCreated(event: Record<string, unknown>): boolean {
  const hookType = asString(event.type)
  const status = asString(event.status)
  const hasDelegationId = asString(event.delegationId) !== ""
  return (hookType === "session.created" && hasDelegationId)
    || (status === "created" && hasDelegationId)
}

/**
 * Checks whether a delegation is returning results based on hook type, status, and ID.
 *
 * Matches `tool.executed`/`tool.completed` hook events, or events with `status=returned`
 * and a `delegationId`.
 */
function isDelegationReturned(event: Record<string, unknown>): boolean {
  const hookType = asString(event.type)
  const status = asString(event.status)
  const hasDelegationId = asString(event.delegationId) !== ""
  return ((hookType === "tool.executed" || hookType === "tool.completed") && hasDelegationId)
    || (status === "returned" && hasDelegationId)
}

/**
 * Type guard that validates a string is one of the 10 classified event types.
 */
function isClassifiedType(value: string): value is ClassifiedEventType {
  return (CLASSIFIED_EVENT_TYPES as readonly string[]).includes(value)
}

/**
 * Narrows a value to a non-null object without using `any`.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/**
 * Extracts a string from an unknown value, returning empty string for non-strings.
 */
function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}
