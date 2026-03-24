import type { EventEntry } from '../types.js'
import type { SessionEventWriteInput } from '../writers/events-writer.js'

function asText(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : 'N/A'
}

function safeSerialize(data: Record<string, unknown>): string {
  try {
    return JSON.stringify(data)
  } catch {
    return '[unserializable event data]'
  }
}

function createTitle(type: EventEntry['type']): string {
  if (type === 'delegation_returned') {
    return 'Delegation returned'
  }

  if (type === 'delegation_created') {
    return 'Delegation created'
  }

  return `Event: ${type}`
}

function createSummary(event: EventEntry): string {
  if (event.type === 'delegation_returned') {
    const data = event.data
    return `Delegation returned by ${asText(data.delegatedTo)}`
  }

  if (event.type === 'user_message') {
    return asText(event.data.userMessage)
  }

  return createTitle(event.type)
}

function createDetails(event: EventEntry): string {
  if (event.type !== 'delegation_returned') {
    return safeSerialize(event.data)
  }

  const data = event.data

  return [
    `Status: ${asText(data.statusDetail)}`,
    `Evidence: ${asText(data.evidenceSnapshot)}`,
    `Blocked Reason: ${asText(data.blockedReason)}`,
    `Completion: ${asText(data.completionMetadata)}`,
  ].join('\n')
}

function resolveActor(event: EventEntry): string {
  if (event.type === 'user_message') {
    return 'user'
  }

  if (event.type === 'assistant_output') {
    return asText(event.data.agentName)
  }

  if (event.type === 'delegation_created' || event.type === 'delegation_returned') {
    return asText(event.data.delegatedTo)
  }

  return 'N/A'
}

/**
 * Maps a classifier EventEntry to writer input shape.
 */
export function mapEventEntryToSessionEventInput(event: EventEntry): SessionEventWriteInput {
  return {
    sessionId: event.sessionId,
    timestamp: event.timestamp,
    type: event.type,
    actor: resolveActor(event),
    title: createTitle(event.type),
    summary: createSummary(event),
    details: createDetails(event),
  }
}

/**
 * Maps an EventEntry array into writer-compatible inputs.
 */
export function mapEventEntriesToSessionEventInputs(
  events: EventEntry[],
): SessionEventWriteInput[] {
  return events.map((event) => mapEventEntryToSessionEventInput(event))
}
