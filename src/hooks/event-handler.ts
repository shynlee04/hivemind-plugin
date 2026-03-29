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
  loadSession,
  updateStatus,
} from '../features/event-tracker/consolidated-writer.js'
import {
  appendDiagnosticToMarkdown,
  ensureEventsMarkdown,
  updateSessionTimestamp,
} from '../features/event-tracker/markdown-writer.js'
import { appendError } from '../features/session-journal/error-log-writer.js'
import { createSessionResolver } from '../features/session-journal/session-resolver.js'

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

function formatEventDetails(
  summary: string,
  details?: Record<string, unknown>,
): string {
  if (!details || Object.keys(details).length === 0) {
    return summary
  }

  return `${summary}\n\n\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\``
}

async function appendLifecycleTurn(
  sessionsDir: string,
  sessionId: string,
  turn: {
    timestamp: string
    type: 'error' | 'session_created' | 'session_idle'
    content: string
  },
): Promise<void> {
  const session = await loadSession(sessionsDir, sessionId)
  const filePath = await ensureEventsMarkdown(sessionsDir, session)

  // Noise events → diagnostics instead of turns
  await appendDiagnosticToMarkdown(filePath, {
    timestamp: turn.timestamp,
    level: turn.type === 'error' ? 'error' : 'info',
    message: turn.content,
  })
  await updateSessionTimestamp(filePath).catch(() => undefined)
}

async function appendLifecycleDiagnostic(
  sessionsDir: string,
  sessionId: string,
  diagnostic: {
    timestamp: string
    level: string
    message: string
  },
): Promise<void> {
  const session = await loadSession(sessionsDir, sessionId)
  const filePath = await ensureEventsMarkdown(sessionsDir, session)

  await appendDiagnosticToMarkdown(filePath, diagnostic)
}

async function linkParentChildSessions(
  sessionsDir: string,
  childSessionId: string,
  sessionProperties: Record<string, unknown>,
  resolveParentSessionId: (sessionId: string) => Promise<string | null>,
  source: 'session.created' | 'agent.created'
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

  const parentSessionId = await resolveParentSessionId(rawParentSessionId).catch((err) => {
    console.error(`[session-journal] resolve parent session (${source}) failed:`, err)
    return null
  })

  if (!parentSessionId) {
    return
  }

  await linkSubSession(sessionsDir, parentSessionId, childSessionId).catch((err) => {
    console.error(`[session-journal] linkSubSession (${source}) failed:`, err)
  })
}

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
      const consolidatedSessionId = await initSession(sessionsDir, {
        sessionId: sdkSessionId,
        lineage: resolveLineage(sessionProperties),
        purposeClass: resolvePurposeClass(sessionProperties),
        agent: readStringProperty(sessionProperties, 'agent', 'name') ?? 'unknown',
      }).catch((err) => {
        console.error('[session-journal] initSession (session.created) failed:', err)
        return null
      })

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
        }).catch((err) => {
          console.error('[session-journal] addEvent (session.created) failed:', err)
        })

        await linkParentChildSessions(
          sessionsDir,
          consolidatedSessionId,
          sessionProperties,
          (sessionId) => sessionResolver.resolve(sessionId),
          'session.created'
        )

        await appendLifecycleTurn(sessionsDir, consolidatedSessionId, {
          timestamp,
          type: 'session_created',
          content: formatEventDetails(`Session created for SDK session ${sdkSessionId}.`, sessionProperties),
        }).catch(() => undefined)
      }
    }

    if (String(event.type) === 'agent.created' && sdkSessionId) {
      const consolidatedSessionId = await sessionResolver.resolveOrCreate(sdkSessionId, {
        lineage: resolveLineage(sessionProperties),
        purposeClass: resolvePurposeClass(sessionProperties),
        agent: readStringProperty(sessionProperties, 'agent', 'name') ?? 'unknown',
      }).catch((err) => {
        console.error('[session-journal] resolveOrCreate (agent.created) failed:', err)
        return null
      })

      if (consolidatedSessionId) {
        await addEvent(sessionsDir, {
          sessionId: consolidatedSessionId,
          event: {
            turnNumber: 0,
            type: 'agent_created',
            importance: 'medium',
            timestamp: new Date().toISOString(),
            data: {
              sessionId: sdkSessionId,
              properties: sessionProperties,
            },
          },
        }).catch((err) => {
          console.error('[session-journal] addEvent (agent.created) failed:', err)
        })

        await linkParentChildSessions(
          sessionsDir,
          consolidatedSessionId,
          sessionProperties,
          (sessionId) => sessionResolver.resolve(sessionId),
          'agent.created'
        )
      }
    }

    if (event.type === 'session.updated' && sdkSessionId) {
      const consolidatedSessionId = await sessionResolver.resolve(sdkSessionId).catch((err) => {
        console.error('[session-journal] resolveSession (session.updated) failed:', err)
        return null
      })

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
        }).catch((err) => {
          console.error('[session-journal] addEvent (session.updated) failed:', err)
        })
      }
    }

    if (event.type === 'session.error' && sdkSessionId) {
      const timestamp = new Date().toISOString()
      const consolidatedSessionId = await sessionResolver.resolve(sdkSessionId).catch((err) => {
        console.error('[session-journal] resolveSession (session.error) failed:', err)
        return null
      })

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
        }).catch((err) => {
          console.error('[session-journal] addEvent (session.error) failed:', err)
        })

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
          }).catch((err) => {
          console.error('[session-journal] addDiagnostic (session.error) failed:', err)
        })

        await appendLifecycleTurn(sessionsDir, consolidatedSessionId, {
          timestamp,
          type: 'error',
          content: formatEventDetails(`Session error for SDK session ${sdkSessionId}.`, errorDetails),
        }).catch(() => undefined)

        await appendLifecycleDiagnostic(sessionsDir, consolidatedSessionId, {
          timestamp,
          level: 'error',
          message: 'session.error event received',
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
      const consolidatedSessionId = await sessionResolver.resolve(sdkSessionId).catch((err) => {
        console.error('[session-journal] resolveSession (session.deleted) failed:', err)
        return null
      })

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
        }).catch((err) => {
          console.error('[session-journal] addEvent (session.deleted) failed:', err)
        })

        await updateStatus(sessionsDir, consolidatedSessionId, 'abandoned').catch((err) => {
          console.error('[session-journal] updateStatus (session.deleted) failed:', err)
        })
      }
    }

    if (event.type === 'session.diff' && sdkSessionId) {
      const consolidatedSessionId = await sessionResolver.resolve(sdkSessionId).catch((err) => {
        console.error('[session-journal] resolveSession (session.diff) failed:', err)
        return null
      })

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
        }).catch((err) => {
          console.error('[session-journal] addEvent (session.diff) failed:', err)
        })
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

      // Resolve or create consolidated session
      const consolidatedSessionId = await sessionResolver.resolveOrCreate(sessionId, {
        lineage: 'hivefiver',
        purposeClass: 'implementation',
        agent: 'unknown',
      }).catch((err) => {
        console.error('[session-journal] resolveOrCreate (session.idle) failed:', err)
        return null
      })

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

        await appendLifecycleTurn(sessionsDir, consolidatedSessionId, {
          timestamp,
          type: 'session_idle',
          content: `Session idle for SDK session ${sessionId}.`,
        }).catch(() => undefined)
      } catch (err) {
        console.error('[session-journal] addEvent (session.idle) failed:', err)
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

  const semanticSessionId = await sessionResolver.resolveOrCreate(sdkSessionId, {
    lineage: 'hivefiver',
    purposeClass: 'implementation',
    agent: 'unknown',
  })

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

  await appendLifecycleTurn(sessionDir, semanticSessionId, {
    timestamp: new Date().toISOString(),
    type: 'session_idle',
    content: `Session idle for SDK session ${sdkSessionId}.`,
  }).catch(() => undefined)
}
