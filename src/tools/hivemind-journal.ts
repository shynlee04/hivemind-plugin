/**
 * HIVEMIND-JOURNAL Tool
 *
 * CQRS write-side bridge for session journaling.
 * This is the ONLY write-side entry point for session journaling.
 *
 * Writes to the flat journey-events markdown file:
 * - Events (assistant_output, user_message, tool_call, compaction, trajectory) → journey-events/{sessionId}.md
 * - Diagnostic events → journey-events/{sessionId}.md (Diagnostics section)
 *
 * @module hivemind-journal
 */

import { appendFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

import { tool, type ToolDefinition } from '@opencode-ai/plugin'

import { appendDiagnosticToMarkdown } from '../features/event-tracker/markdown-writer.js'
import { getJourneyEventsMarkdownPath } from '../features/event-tracker/paths.js'
import { renderToolResult } from '../shared/tool-helpers.js'

/**
 * Event types supported by the journal tool.
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
 */
type SessionEventPayload = {
  actor?: string
  title?: string
  summary?: string
  details?: string
}

/**
 * Payload shape for diagnostic events.
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

function asDisplayValue(value?: string): string {
  return value?.trim() ? value : 'N/A'
}

/**
 * Renders a session event as a markdown block for appending to journey-events.
 * @param entry - Event data with type, timestamp, and optional fields.
 * @returns Markdown block string ready to append.
 */
function renderEventBlock(entry: {
  type: string
  timestamp: string
  actor?: string
  title?: string
  summary?: string
  details?: string
}): string {
  const details = entry.details?.trim() ? entry.details : ''

  return [
    `## ${entry.type}`,
    '',
    `- **Timestamp**: ${entry.timestamp}`,
    `- **Actor**: ${asDisplayValue(entry.actor)}`,
    `- **Title**: ${asDisplayValue(entry.title)}`,
    `- **Summary**: ${asDisplayValue(entry.summary)}`,
    '',
    '### Details',
    '',
    details,
    '',
  ].join('\n')
}

/**
 * Appends content to a file, creating parent directories if needed.
 * @param filePath - Target file path.
 * @param content - Content to append.
 */
async function appendToFile(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await appendFile(filePath, content, 'utf8')
}

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
      'Writes assistant_output, user_message, tool_call, compaction, and trajectory events to journey-events markdown. ' +
      'Writes diagnostic events to the Diagnostics section of the same file.',
    args: journalToolArgs,
    async execute(args: HivemindJournalArgs, context) {
      const effectiveRoot = context.directory ?? projectRoot
      const { sessionId, eventType, payload, timestamp } = args
      const filePath = getJourneyEventsMarkdownPath(effectiveRoot, sessionId)

      try {
        switch (eventType) {
          case 'assistant_output':
          case 'user_message':
          case 'tool_call':
          case 'compaction':
          case 'trajectory': {
            const eventPayload = payload as SessionEventPayload
            const block = renderEventBlock({
              type: eventType,
              timestamp,
              actor: eventPayload.actor,
              title: eventPayload.title,
              summary: eventPayload.summary,
              details: eventPayload.details,
            })
            await appendToFile(filePath, block)
            return renderToolResult({ success: true, path: filePath })
          }

          case 'diagnostic': {
            const diagPayload = payload as DiagnosticPayload
            await appendDiagnosticToMarkdown(filePath, {
              timestamp,
              level: diagPayload.level ?? 'info',
              message: diagPayload.message ?? '',
            })
            return renderToolResult({ success: true, path: filePath })
          }

          default: {
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
