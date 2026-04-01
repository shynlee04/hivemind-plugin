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
import { getClient } from './sdk-context.js'
import {
  addDiagnostic,
  addEvent,
  initSession,
   linkSubSession,
  updateStatus,
} from '../features/event-tracker/consolidated-writer.js'
import { appendError } from '../features/session-journal/error-log-writer.js'
import { createSessionResolver } from '../features/session-journal/session-resolver.js'
import { truncateSessionId } from '../features/event-tracker/paths.js'

function readStringProperty(
  properties: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = properties[key]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }

  return null
}

function resolveLineage(
  properties: Record<string, unknown>
): 'hivefiver' | 'hiveminder' {
  const lineage = readStringProperty(properties, 'lineage')
  return lineage === 'hiveminder' ? 'hiveminder' : 'hivefiver'
}

function resolvePurposeClass(
  properties: Record<string, unknown>
): 'discovery' | 'brainstorming' | 'research' | 'planning' | 'implementation' | 'gatekeeping' | 'tdd' | 'course-correction' {
  const purposeClass = readStringProperty(properties, 'purposeClass')

  switch (purposeClass) {
    case 'discovery':
    case 'brainstorming':
    case 'research':
    case 'planning':
    case 'implementation':
    case 'gatekeeping':
    case 'tdd':
    case 'course-correction':
      return purposeClass
    default:
      return 'implementation'
  }
}


async function linkParentChildSessions(
  sessionsDir: string,
  childSessionId: string,
  sessionProperties: Record<string, unknown>,
  resolveParentSessionId: (sessionId: string) => Promise<string | null>,
  _source: 'session.created' | 'agent.created'
): Promise<void> {
  const rawParentSessionId = readStringProperty(
    sessionProperties,
    'parentSessionId',
    'parentSessionID',
    'parent_session_id'
  )

  if (!rawParentSessionId) {
    return
  }

  const parentSessionId = await resolveParentSessionId(rawParentSessionId).catch(() => null)

  if (!parentSessionId) {
    return
  }

  await linkSubSession(sessionsDir, parentSessionId, childSessionId).catch(() => undefined)
}

function normalizeEventSummary(event: Event): string {
  if (!event || typeof event !== 'object') {
    return 'event:malformed'
  }

  if (!('type' in event)) {
    return 'event:malformed'
  }

  // Emit diagnostic for unknown/unexpected event types
  const eventType = String(event.type)
  const KNOWN_EVENT_TYPES = [
    'session.started',
    'session.ended',
    'session.compacted',
    'session.created',
    'session.updated',
    'session.error',
    'session.deleted',
    'session.diff',
    'session.idle',
    'message.added',
    'message.updated',
    'tool.executed',
    'command.executed',
    'agent.created',
    'trajectory.started',
    'trajectory.ended',
  ]

  if (!KNOWN_EVENT_TYPES.includes(eventType) && !eventType.startsWith('agent-work')) {
    // Unknown event type — recorded but may not be fully handled
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
 * Uses consolidated writer for session.idle events.
 *
 * @param directory Project root used to resolve runtime state.
 * @returns OpenCode `event` hook.
 */
export function createEventHandler(directory: string) {
  const sessionResolver = createSessionResolver(directory)
  const sessionsDir = sessionResolver.getSessionsDir()
  return async (input: { event: Event }): Promise<void> => {
    const event = input.event
    const sessionProperties =
      typeof event.properties === 'object' && event.properties !== null
        ? event.properties as Record<string, unknown>
        : {}
    const sdkSessionId = typeof sessionProperties.sessionID === 'string'
      ? sessionProperties.sessionID
      : null
    const agentWorkEvent = extractAgentWorkEventPacket(input)
    const snapshot = await loadRuntimeBindingsSnapshot(directory)

    if (event.type === 'session.created' && sdkSessionId) {
      const timestamp = new Date().toISOString()

      // Check if this is a subagent session — skip file creation
      const isSubagent = readStringProperty(
        sessionProperties,
        'parentSessionId',
        'parentSessionID',
        'parent_session_id'
      )

      if (isSubagent) {
        // Subagent sessions don't get their own files.
        // Still try to link parent/child if parent was already tracked.
        const resolvedParent = await sessionResolver.resolve(isSubagent).catch(() => null)
        if (resolvedParent) {
          await linkSubSession(sessionsDir, resolvedParent, truncateSessionId(sdkSessionId)).catch(() => undefined)
        }
        return
      }

      const consolidatedSessionId = await initSession(sessionsDir, {
        sessionId: truncateSessionId(sdkSessionId),
        lineage: resolveLineage(sessionProperties),
        purposeClass: resolvePurposeClass(sessionProperties),
        agent: readStringProperty(sessionProperties, 'agent', 'name') ?? 'unknown',
      }).catch(() => null)

      if (consolidatedSessionId) {
        await addEvent(sessionsDir, {
          sessionId: consolidatedSessionId,
          event: {
            turnNumber: 0,
            type: 'session_created',
            importance: 'medium',
            timestamp,
            data: {
              sessionId: sdkSessionId,
              properties: sessionProperties,
            },
          },
        }).catch(() => undefined)

        await linkParentChildSessions(
          sessionsDir,
          consolidatedSessionId,
          sessionProperties,
          (sessionId) => sessionResolver.resolve(sessionId),
          'session.created'
        )
      }
    }

    if (String(event.type) === 'agent.created' && sdkSessionId) {
      // Subagents do NOT get their own session files.
      // Record the event in the parent session if one exists.
      const parentSessionId = readStringProperty(
        sessionProperties,
        'parentSessionId',
        'parentSessionID',
        'parent_session_id'
      )

      if (parentSessionId) {
        const resolvedParent = await sessionResolver.resolve(parentSessionId).catch(() => null)
        if (resolvedParent) {
          await addEvent(sessionsDir, {
            sessionId: resolvedParent,
            event: {
              turnNumber: 0,
              type: 'agent_created',
              importance: 'low',
              timestamp: new Date().toISOString(),
              data: {
                childSessionId: sdkSessionId,
                agent: readStringProperty(sessionProperties, 'agent', 'name') ?? 'unknown',
              },
            },
          }).catch(() => undefined)
        }
      }
    }

    if (event.type === 'session.updated' && sdkSessionId) {
      const consolidatedSessionId = await sessionResolver.resolve(sdkSessionId).catch(() => null)

      if (consolidatedSessionId) {
        await addEvent(sessionsDir, {
          sessionId: consolidatedSessionId,
          event: {
            turnNumber: 0,
            type: 'session_updated',
            importance: 'low',
            timestamp: new Date().toISOString(),
            data: {
              sessionId: sdkSessionId,
              properties: sessionProperties,
            },
          },
        }).catch(() => undefined)
      }
    }

    if (event.type === 'session.error' && sdkSessionId) {
      const timestamp = new Date().toISOString()
      const consolidatedSessionId = await sessionResolver.resolve(sdkSessionId).catch(() => null)

      if (consolidatedSessionId) {
        const { sessionID: _sessionID, ...errorDetails } = sessionProperties

        await addEvent(sessionsDir, {
          sessionId: consolidatedSessionId,
          event: {
            turnNumber: 0,
            type: 'session_error',
            importance: 'high',
            timestamp,
            data: {
              sessionId: sdkSessionId,
              error: errorDetails,
            },
          },
        }).catch(() => undefined)

        await addDiagnostic(sessionsDir, {
          sessionId: consolidatedSessionId,
          diagnostic: {
            timestamp,
            level: 'error',
            message: 'session.error event received',
            context: {
              sessionId: sdkSessionId,
              error: errorDetails,
            },
          },
          }).catch(() => undefined)

        await appendError(directory, {
          sessionId: consolidatedSessionId,
          timestamp,
          level: 'error',
          message: 'session.error event received',
          context: {
            sessionId: sdkSessionId,
            error: errorDetails,
          },
        }).catch(() => undefined)
      }
    }

    if (event.type === 'session.deleted' && sdkSessionId) {
      const consolidatedSessionId = await sessionResolver.resolve(sdkSessionId).catch(() => null)

      if (consolidatedSessionId) {
        await addEvent(sessionsDir, {
          sessionId: consolidatedSessionId,
          event: {
            turnNumber: 0,
            type: 'session_deleted',
            importance: 'medium',
            timestamp: new Date().toISOString(),
            data: {
              sessionId: sdkSessionId,
            },
          },
        }).catch(() => undefined)

        await updateStatus(sessionsDir, consolidatedSessionId, 'abandoned').catch(() => undefined)
      }
    }

    if (event.type === 'session.diff' && sdkSessionId) {
      const consolidatedSessionId = await sessionResolver.resolve(sdkSessionId).catch(() => null)

      if (consolidatedSessionId) {
        const { sessionID: _sessionID, ...diffDetails } = sessionProperties

        await addEvent(sessionsDir, {
          sessionId: consolidatedSessionId,
          event: {
            turnNumber: 0,
            type: 'session_diff',
            importance: 'low',
            timestamp: new Date().toISOString(),
            data: {
              sessionId: sdkSessionId,
              diff: diffDetails,
            },
          },
        }).catch(() => undefined)
      }
    }

    // Handle session.idle events - write to consolidated session
    if (event.type === 'session.idle') {
      const client = getClient()
      const sessionId = (event.properties as { sessionID?: string })?.sessionID
      const timestamp = new Date().toISOString()

      if (!sessionId) {
        // No session ID provided, exit early
        return
      }

      if (client) {
        // Fetch session data
        await client.session.get({ path: { id: sessionId } })
        // Fetch session messages
        await client.session.messages({
          path: { id: sessionId },
          query: { directory },
        })
      }

      // Resolve existing session (don't create files for idle sessions)
      const consolidatedSessionId = await sessionResolver.resolve(sessionId).catch(() => null)

      if (!consolidatedSessionId) {
        return
      }

      // Write to consolidated session
      try {
        await addEvent(sessionsDir, {
          sessionId: consolidatedSessionId,
          event: {
            turnNumber: 0, // System events are not tied to specific turns
            type: 'session_idle',
            importance: 'low',
            timestamp,
            data: {
              sessionId,
            },
          },
        })
      } catch {
        // session.idle addEvent failed — silent
      }
    }

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

/**
 * Handle session.idle events by logging them to the session file.
 * Resolves the session by SDK session ID using the semantic naming lookup.
 *
 * @param event - Session idle event with type and sessionID property
 * @param projectRoot - Project root directory
 */
export async function handleSessionIdleEvent(
  event: { type: string; properties: { sessionID: string } },
  projectRoot: string
): Promise<void> {
  const sessionResolver = createSessionResolver(projectRoot)
  const sessionDir = sessionResolver.getSessionsDir()
  const sdkSessionId = event.properties.sessionID

  const semanticSessionId = await sessionResolver.resolve(sdkSessionId).catch(() => null)

  if (!semanticSessionId) return

  await addEvent(sessionDir, {
    sessionId: semanticSessionId,
    event: {
      turnNumber: 0,
      type: 'session_idle',
      importance: 'low',
      timestamp: new Date().toISOString(),
      data: {
        sessionId: sdkSessionId,
      },
    },
  })
}
