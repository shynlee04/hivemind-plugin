import type { Event } from '@opencode-ai/sdk'

import { loadRuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import { createRecoveryCheckpoint } from '../recovery/index.js'
import { recordTrajectoryEvent } from '../core/trajectory/index.js'

function normalizeEventSummary(event: Event): string {
  if (!event || typeof event !== 'object' || !('type' in event)) {
    return 'event:unknown'
  }

  return `event:${String(event.type)}`
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
    const snapshot = await loadRuntimeBindingsSnapshot(directory)
    if (!snapshot.trajectoryId) {
      return
    }

    await recordTrajectoryEvent(directory, snapshot.trajectoryId, {
      kind: 'note',
      summary: normalizeEventSummary(event),
      evidenceRefs: snapshot.taskIds,
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
