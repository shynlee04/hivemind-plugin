import type { Event } from '@opencode-ai/sdk'

import { loadTrajectoryLedger } from '../core/trajectory/index.js'
import { ContractStore } from '../features/agent-work-contract/engine/contract-store.js'
import {
  createCompactionPreservationPacket,
  extractAgentWorkEventPacket,
} from '../features/agent-work-contract/hooks/index.js'
import { loadRuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import { createRecoveryCheckpoint } from '../recovery/index.js'
import { recordTrajectoryEvent } from '../core/trajectory/index.js'

function normalizeEventSummary(event: Event): string {
  if (!event || typeof event !== 'object') {
    console.warn('[event-handler] Malformed event received: not an object', { event })
    return 'event:malformed'
  }

  if (!('type' in event)) {
    console.warn('[event-handler] Malformed event received: missing type field', { event })
    return 'event:malformed'
  }

  // Emit diagnostic for unknown/unexpected event types
  const eventType = String(event.type)
  const KNOWN_EVENT_TYPES = [
    'session.started',
    'session.ended',
    'session.compacted',
    'message.added',
    'message.updated',
    'tool.executed',
    'command.executed',
    'agent.created',
    'trajectory.started',
    'trajectory.ended',
  ]

  if (!KNOWN_EVENT_TYPES.includes(eventType) && !eventType.startsWith('agent-work')) {
    console.warn(`[event-handler] Unknown event type received: "${eventType}" - this event will be recorded but may not be fully handled`)
  }

  return `event:${eventType}`
}

async function resolveAgentWorkEvidence(
  directory: string,
  eventPacket: ReturnType<typeof extractAgentWorkEventPacket>,
): Promise<string[]> {
  if (!eventPacket?.trigger) {
    return []
  }

  const contracts = await new ContractStore(directory).list(eventPacket.sessionId)
  const latestContract = contracts
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]

  if (!latestContract) {
    return [`agent-work-trigger:${eventPacket.trigger}`]
  }

  const compactionPacket = createCompactionPreservationPacket(latestContract)

  return [
    `agent-work-contract:${compactionPacket.contractId}`,
    `agent-work-trigger:${eventPacket.trigger}`,
  ]
}

async function matchesActiveTrajectorySession(
  directory: string,
  trajectoryId: string,
  sessionId: string,
): Promise<boolean> {
  const ledger = await loadTrajectoryLedger(directory)
  const activeTrajectory = ledger.trajectories.find((item) => item.id === trajectoryId)

  return activeTrajectory?.sessionIds.includes(sessionId) ?? false
}

/**
 * Create a lightweight OpenCode event hook that bridges runtime events into the active trajectory ledger.
 *
 * @param directory Project root used to resolve runtime state.
 * @returns OpenCode `event` hook.
 */
export function createEventHandler(directory: string) {
  return async (input: { event: Event }): Promise<void> => {
    const event = input.event
    const agentWorkEvent = extractAgentWorkEventPacket(input)
    const snapshot = await loadRuntimeBindingsSnapshot(directory)
    if (!snapshot.trajectoryId) {
      return
    }

    if (
      agentWorkEvent?.sessionId
      && !(await matchesActiveTrajectorySession(directory, snapshot.trajectoryId, agentWorkEvent.sessionId))
    ) {
      return
    }

    const eventEvidenceRefs = [
      ...snapshot.taskIds,
      ...(await resolveAgentWorkEvidence(directory, agentWorkEvent)),
    ]

    await recordTrajectoryEvent(directory, snapshot.trajectoryId, {
      kind: 'note',
      summary: agentWorkEvent?.summary ?? normalizeEventSummary(event),
      evidenceRefs: eventEvidenceRefs,
    })

    if (event.type === 'session.compacted' && snapshot.workflowId) {
      await createRecoveryCheckpoint(directory, {
        trajectoryId: snapshot.trajectoryId,
        workflowId: snapshot.workflowId,
        taskIds: snapshot.taskIds,
        subtaskIds: snapshot.subtaskIds,
        source: 'event:session.compacted',
        resumeTarget: 'command:hm-harness',
      })
    }
  }
}
