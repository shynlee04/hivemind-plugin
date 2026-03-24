import type { EventType } from '../types.js'

export interface CreateEventIdInput {
  sessionId: string
  turnNumber: number
  type: EventType
  ordinal: number
}

/**
 * Builds a deterministic event identifier from stable identity segments.
 */
export function createEventId(input: CreateEventIdInput): string {
  return [
    input.sessionId,
    String(input.turnNumber),
    input.type,
    String(input.ordinal),
  ].join('::')
}
