/**
 * Internal Session Writers Facade
 *
 * CQRS write-side facade that isolates hook I/O from business logic.
 * Hooks call sessionWriters instead of importing writers directly,
 * solving the CQRS violation where hooks were acting as writers.
 *
 * All writer functions require projectRoot for path resolution.
 * Use createSessionWriters(projectRoot) to get a configured instance.
 *
 * @module internal/session-writers
 */

import { appendSessionEvent } from '../features/event-tracker/writers/events-writer.js'
import type { SessionEventWriteInput } from '../features/event-tracker/writers/events-writer.js'
import { initOrUpdateSessionMetadata } from '../features/event-tracker/writers/session-writer.js'
import type { SessionMetadataInput } from '../features/event-tracker/types.js'
import { appendSessionDiagnostic } from '../features/event-tracker/writers/diagnostics-writer.js'
import type { SessionDiagnosticWriteInput } from '../features/event-tracker/writers/diagnostics-writer.js'

// ---------------------------------------------------------------------------
// Interface Types
// ---------------------------------------------------------------------------

/** Supported event types for session journal. */
export type SessionEventType =
  | 'assistant_output'
  | 'user_message'
  | 'tool_call'
  | 'compaction'
  | 'trajectory'
  | 'session_start'
  | 'session_end'
  | 'session_idle'

/** Input for writing a session event to events.md. */
export interface SessionEventInput {
  sessionId: string
  eventType: SessionEventType
  actor?: string
  title?: string
  summary?: string
  details?: string
  timestamp: string
}

/** Input for creating or updating session metadata. */
export interface SessionMetaInput {
  sessionId: string
  lineage?: string
  purposeClass?: string
  agent?: string
  timestamp: string
  status?: 'active' | 'completed' | 'abandoned'
  parentSessionId?: string | null
}

/** Input for writing a diagnostic entry to diagnostics.log. */
export interface DiagnosticInput {
  sessionId: string
  level: 'info' | 'warn' | 'error'
  source?: string
  message?: string
  details?: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Session Writers Interface
// ---------------------------------------------------------------------------

export interface SessionWriters {
  writeEvent(event: SessionEventInput): Promise<void>
  writeMeta(meta: SessionMetaInput): Promise<void>
  writeDiagnostic(diag: DiagnosticInput): Promise<void>
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Creates a sessionWriters instance bound to a specific projectRoot.
 *
 * @param projectRoot Absolute or workspace project root for path resolution.
 * @returns SessionWriters interface with bound projectRoot.
 */
export function createSessionWriters(projectRoot: string): SessionWriters {
  return {
    async writeEvent(event: SessionEventInput): Promise<void> {
      const entry: SessionEventWriteInput = {
        sessionId: event.sessionId,
        timestamp: event.timestamp,
        type: event.eventType,
        actor: event.actor,
        title: event.title,
        summary: event.summary,
        details: event.details,
      }
      await appendSessionEvent(projectRoot, entry)
    },

    async writeMeta(meta: SessionMetaInput): Promise<void> {
      const input: SessionMetadataInput = {
        sessionId: meta.sessionId,
        lineage: (meta.lineage as SessionMetadataInput['lineage']) ?? 'hiveminder',
        purposeClass: (meta.purposeClass as SessionMetadataInput['purposeClass']) ?? 'implementation',
        agent: meta.agent ?? 'unknown',
        timestamp: meta.timestamp,
        status: meta.status ?? 'active',
        parentSessionId: meta.parentSessionId,
      }
      await initOrUpdateSessionMetadata(projectRoot, input)
    },

    async writeDiagnostic(diag: DiagnosticInput): Promise<void> {
      const entry: SessionDiagnosticWriteInput = {
        sessionId: diag.sessionId,
        timestamp: diag.timestamp,
        level: diag.level,
        actor: 'system',
        source: diag.source,
        message: diag.message,
        details: diag.details,
      }
      await appendSessionDiagnostic(projectRoot, entry)
    },
  }
}

/**
 * Singleton-like sessionWriters instance for use when projectRoot is fixed.
 * Initialize once at plugin boot via createSessionWriters(projectRoot).
 */
export const sessionWriters: SessionWriters = {
  async writeEvent(_event: SessionEventInput): Promise<void> {
    throw new Error(
      'sessionWriters.writeEvent called before initialization. ' +
      'Use createSessionWriters(projectRoot) to create a configured instance.',
    )
  },

  async writeMeta(_meta: SessionMetaInput): Promise<void> {
    throw new Error(
      'sessionWriters.writeMeta called before initialization. ' +
      'Use createSessionWriters(projectRoot) to create a configured instance.',
    )
  },

  async writeDiagnostic(_diag: DiagnosticInput): Promise<void> {
    throw new Error(
      'sessionWriters.writeDiagnostic called before initialization. ' +
      'Use createSessionWriters(projectRoot) to create a configured instance.',
    )
  },
}
