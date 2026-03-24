import type { ParsedTurn } from '../parser/types.js'
import type { EventEntry } from '../types.js'

import {
  buildDelegationReturnedEvidencePayload,
  type DelegationReturnedEvidenceInput,
  normalizeDelegationCoreFields,
} from './delegation-returned-evidence.js'
import { createEventId } from './event-id.js'

export type DelegationReturnedEvidence = DelegationReturnedEvidenceInput

export interface ClassifierInput {
  sessionId: string
  timestamp: string
  turn: ParsedTurn
  delegationReturnedEvidenceByPacketId?: Record<string, DelegationReturnedEvidence>
}

function createEvent(
  input: ClassifierInput,
  type: EventEntry['type'],
  ordinal: number,
  data: Record<string, unknown>,
  importance: EventEntry['importance'],
): EventEntry {
  return {
    id: createEventId({
      sessionId: input.sessionId,
      turnNumber: input.turn.turnNumber,
      type,
      ordinal,
    }),
    sessionId: input.sessionId,
    turnNumber: input.turn.turnNumber,
    type,
    importance,
    timestamp: input.timestamp,
    data,
  }
}

/**
 * Classifies parser turn data into immutable event entries.
 */
export function classifyTurnEvents(input: ClassifierInput): EventEntry[] {
  const events: EventEntry[] = []
  let ordinal = 0

  events.push(
    createEvent(
      input,
      'user_message',
      ordinal++,
      { userMessage: input.turn.userMessage },
      'low',
    ),
  )

  events.push(
    createEvent(
      input,
      'assistant_output',
      ordinal++,
      {
        assistantContent: input.turn.assistantContent,
        agentName: input.turn.agentName,
        model: input.turn.model,
      },
      'low',
    ),
  )

  for (const delegation of input.turn.delegationTargets) {
    const normalized = normalizeDelegationCoreFields({
      packetId: delegation.packetId,
      delegatedTo: delegation.delegatedTo,
      subagentType: delegation.subagentType,
      description: delegation.description,
    })

    events.push(
      createEvent(
        input,
        'delegation_created',
        ordinal++,
        {
          packetId: normalized.packetId,
          delegatedTo: normalized.delegatedTo,
          subagentType: normalized.subagentType,
          description: normalized.description,
        },
        'medium',
      ),
    )

    const evidence = delegation.packetId
      ? input.delegationReturnedEvidenceByPacketId?.[delegation.packetId]
      : undefined

    if (!evidence) {
      continue
    }

    const payload = buildDelegationReturnedEvidencePayload({
      packetId: delegation.packetId,
      delegatedTo: delegation.delegatedTo,
      subagentType: delegation.subagentType,
      description: delegation.description,
      evidence,
    })

    events.push(
      createEvent(input, 'delegation_returned', ordinal++, { ...payload }, 'high'),
    )
  }

  return events
}
