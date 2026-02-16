/**
 * Tool Response Utilities - Standardized JSON output for HiveMind tools.
 *
 * PATCH-US-009: All tools return JSON with status field.
 * Entity-creating tools include entity_id for FK chaining.
 */

export interface ToolSuccessPayload {
  status: "success"
  message: string
  entity_id?: string
  metadata?: Record<string, unknown>
}

export interface ToolErrorPayload {
  status: "error"
  error: string
  suggestion?: string
}

export function toSuccessOutput(
  message: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): string {
  const payload: ToolSuccessPayload = { status: "success", message }
  if (entityId) payload.entity_id = entityId
  if (metadata) payload.metadata = metadata
  return JSON.stringify(payload, null, 2)
}

export function toErrorOutput(error: string, suggestion?: string): string {
  const payload: ToolErrorPayload = { status: "error", error }
  if (suggestion) payload.suggestion = suggestion
  return JSON.stringify(payload, null, 2)
}
