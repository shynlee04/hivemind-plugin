/**
 * HIVEMIND-JOURNAL Tool
 * 
 * CQRS write-side bridge for session journaling.
 * This is the ONLY write-side entry point for session journaling.
 * 
 * Uses sessionWriters facade from src/internal/session-writers.ts
 * which routes to writer functions in src/features/event-tracker/writers/
 * - appendSessionEvent → events.md
 * - appendSessionDiagnostic → diagnostics.log
 * 
 * @module hivemind-journal
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin'

import { createSessionWriters } from '../internal/session-writers.js'
import { renderToolResult } from '../shared/tool-helpers.js'
import { getSessionEventsPath } from '../features/event-tracker/paths.js'
import { getSessionDiagnosticsPath } from '../features/event-tracker/paths.js'

/**
 * Event types supported by the journal tool.
 * Maps to different writer functions.
 */
type JournalEventType = 
  | 'assistant_output' 
  | 'user_message' 
  | 'tool_call' 
  | 'compaction' 
  | 'trajectory' 
  | 'diagnostic'

/**
 * Payload shape for assistant_output, user_message, tool_call, compaction, trajectory events.
 * These write to events.md via appendSessionEvent.
 */
type SessionEventPayload = {
  actor?: string
  title?: string
  summary?: string
  details?: string
}

/**
 * Payload shape for diagnostic events.
 * These write to diagnostics.log via appendSessionDiagnostic.
 */
type DiagnosticPayload = {
  level?: string
  source?: string
  message?: string
  details?: string
}

/**
 * Tool args for the hivemind-journal tool.
 */
interface HivemindJournalArgs {
  sessionId: string
  eventType: JournalEventType
  payload: SessionEventPayload | DiagnosticPayload
  timestamp: string
}

/**
 * Define args schema separately to help TypeScript resolution
 */
const journalToolArgs = {
  sessionId: tool.schema.string().describe('Session identifier'),
  eventType: tool.schema.enum([
    'assistant_output',
    'user_message', 
    'tool_call',
    'compaction',
    'trajectory',
    'diagnostic'
  ]).describe('Type of journal event'),
  payload: tool.schema.object({
    actor: tool.schema.string().optional().describe('Actor who generated the event'),
    title: tool.schema.string().optional().describe('Event title'),
    summary: tool.schema.string().optional().describe('Brief summary of the event'),
    details: tool.schema.string().optional().describe('Detailed information about the event'),
    level: tool.schema.string().optional().describe('Log level (for diagnostic events)'),
    source: tool.schema.string().optional().describe('Source of the diagnostic'),
    message: tool.schema.string().optional().describe('Diagnostic message'),
  }).describe('Event-specific payload data'),
  timestamp: tool.schema.string().describe('ISO timestamp of the event'),
} as const

/**
 * Creates the hivemind-journal tool.
 * This is the ONLY write-side entry point for session journaling.
 * 
 * @param projectRoot - The project root directory (passed from plugin)
 * @returns OpenCode tool definition
 */
export function createHivemindJournalTool(projectRoot: string): ToolDefinition {
  return tool({
    description: 'Session journal writer — the sole write-side entry point for session journaling. ' +
      'Writes assistant_output, user_message, tool_call, compaction, and trajectory events to events.md. ' +
      'Writes diagnostic events to diagnostics.log.',
    args: journalToolArgs,
    async execute(args: HivemindJournalArgs, context) {
      // Use context.directory for path resolution (CQRS: context carries write intent)
      const effectiveRoot = context.directory ?? projectRoot
      const writers = createSessionWriters(effectiveRoot)
      const { sessionId, eventType, payload, timestamp } = args

      try {
        // Route to appropriate writer based on event type
        switch (eventType) {
          case 'assistant_output':
          case 'user_message':
          case 'tool_call':
          case 'compaction':
          case 'trajectory': {
            // These all write to events.md
            await writers.writeEvent({
              sessionId,
              eventType,
              timestamp,
              actor: (payload as SessionEventPayload).actor,
              title: (payload as SessionEventPayload).title,
              summary: (payload as SessionEventPayload).summary,
              details: (payload as SessionEventPayload).details,
            })
            
            const eventsPath = getSessionEventsPath(effectiveRoot, sessionId)
            return renderToolResult({ success: true, path: eventsPath })
          }

          case 'diagnostic': {
            // Diagnostic events write to diagnostics.log
            await writers.writeDiagnostic({
              sessionId,
              timestamp,
              level: ((payload as DiagnosticPayload).level as 'info' | 'warn' | 'error') ?? 'info',
              source: (payload as DiagnosticPayload).source,
              message: (payload as DiagnosticPayload).message,
              details: (payload as DiagnosticPayload).details,
            })
            
            const diagnosticsPath = getSessionDiagnosticsPath(effectiveRoot, sessionId)
            return renderToolResult({ success: true, path: diagnosticsPath })
          }

          default: {
            // Should never reach here due to enum validation
            const exhaustiveCheck: never = eventType
            throw new Error(`Unknown event type: ${exhaustiveCheck}`)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return renderToolResult({ 
          success: false, 
          error: errorMessage,
          path: null 
        })
      }
    },
  })
}
