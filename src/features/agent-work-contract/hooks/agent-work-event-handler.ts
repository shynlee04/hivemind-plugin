/**
 * Agent-Work event helper.
 *
 * Extracts schema-validated event packets for future composition into the
 * authoritative root event hook.
 *
 * @module agent-work-contract/hooks/agent-work-event-handler
 */

import { z } from 'zod'

import { ChainActionTriggerSchema } from '../schema/contract.js'

const AgentWorkEventInputSchema = z.object({
  event: z.object({
    type: z.string().min(1),
    properties: z.record(z.string(), z.unknown()),
  }),
})

const SessionCompactedEventSchema = z.object({
  type: z.literal('session.compacted'),
  properties: z.object({
    sessionID: z.string().min(1),
  }),
})

const CommandExecutedEventSchema = z.object({
  type: z.literal('command.executed'),
  properties: z.object({
    name: z.string().min(1),
    sessionID: z.string().min(1),
    arguments: z.string(),
    messageID: z.string().min(1),
  }),
})

export const AgentWorkEventPacketSchema = z.object({
  eventType: z.enum(['session.compacted', 'command.executed']),
  sessionId: z.string().min(1),
  summary: z.string().min(1),
  trigger: ChainActionTriggerSchema.optional(),
})

export type AgentWorkEventPacket = z.infer<typeof AgentWorkEventPacketSchema>

/**
 * Extract a validated agent-work event packet from an OpenCode event payload.
 *
 * Unsupported event types return `null` so root hook composition can remain the
 * single authority for event registration.
 *
 * @param input - Raw event hook input.
 * @returns Parsed packet for supported event types, otherwise `null`.
 * @example
 * ```typescript
 * const packet = extractAgentWorkEventPacket({
 *   event: { type: 'session.compacted', properties: { sessionID: 's-1' } },
 * })
 * ```
 */
export function extractAgentWorkEventPacket(input: unknown): AgentWorkEventPacket | null {
  const parsedInput = AgentWorkEventInputSchema.safeParse(input)
  if (!parsedInput.success) {
    return null
  }

  if (parsedInput.data.event.type === 'session.compacted') {
    const event = SessionCompactedEventSchema.parse(parsedInput.data.event)
    return AgentWorkEventPacketSchema.parse({
      eventType: event.type,
      sessionId: event.properties.sessionID,
      summary: `event:${event.type}`,
      trigger: 'onCompaction80',
    })
  }

  if (parsedInput.data.event.type === 'command.executed') {
    const event = CommandExecutedEventSchema.parse(parsedInput.data.event)
    return AgentWorkEventPacketSchema.parse({
      eventType: event.type,
      sessionId: event.properties.sessionID,
      summary: `event:${event.type}`,
    })
  }

  return null
}
