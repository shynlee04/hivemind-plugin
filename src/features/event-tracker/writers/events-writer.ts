import { getSessionEventsPath } from '../paths.js'

import { appendExactUtf8Content } from './base-writer.js'

export type SessionEventWriteInput = {
  sessionId: string
  timestamp: string
  type: string
  actor?: string
  title?: string
  summary?: string
  details?: string
}

function asDisplayValue(value?: string): string {
  return value?.trim() ? value : 'N/A'
}

/**
 * Renders a readable markdown block for a session event.
 * @param entry Event data supplied by the caller.
 * @returns Markdown block ready to append to `sessions/journey-events/{sessionId}.md`.
 * @deprecated Use consolidated-journal-writer for session event output.
 */
export function renderEventMarkdownBlock(entry: SessionEventWriteInput): string {
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
 * Appends a caller-supplied event entry to the flat journey-events markdown file.
 * @param projectRoot Absolute or workspace project root.
 * @param entry Event data supplied by the caller.
 * @returns Resolves when the append completes.
 * @deprecated Use consolidated-journal-writer for session event output.
 */
export async function appendSessionEvent(
  projectRoot: string,
  entry: SessionEventWriteInput,
): Promise<void> {
  const eventsPath = getSessionEventsPath(projectRoot, entry.sessionId)
  const block = renderEventMarkdownBlock(entry)

  await appendExactUtf8Content(eventsPath, block)
}
