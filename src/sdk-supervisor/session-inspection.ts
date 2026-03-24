import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { getSessionInspectionPath } from '../shared/paths.js'

const SESSION_INSPECTION_MARKDOWN_FILE = 'assistant-output.md'
const SESSION_INSPECTION_COMMAND_FILE = 'purification-command.json'

export interface PreparedPurificationCommand {
  version: 'v1'
  kind: 'session-inspection-purification'
  status: 'prepared'
  ses_id: string
  markdown_path: string
  tool_hints: ['grep', 'read']
  instruction: string
  prepared_at: string
}

export interface SessionInspectionExportResult {
  sessionId: string
  directoryPath: string
  markdownPath: string
  commandPath: string
}

function renderSessionInspectionMarkdown(input: {
  sessionId: string
  assistantText: string
  preparedAt: string
}): string {
  return [
    '# Session Inspection Export',
    '',
    `- ses_id: \`${input.sessionId}\``,
    `- prepared_at: \`${input.preparedAt}\``,
    '',
    '## Assistant Output',
    '',
    input.assistantText,
  ].join('\n')
}

/**
 * Build the internal async purification command artifact for a saved inspection export.
 *
 * @param input Session identifier and saved markdown path.
 * @returns Prepared command payload for later async processing.
 */
export function createPreparedPurificationCommand(input: {
  sessionId: string
  markdownPath: string
  preparedAt?: string
}): PreparedPurificationCommand {
  const preparedAt = input.preparedAt ?? new Date().toISOString()

  return {
    version: 'v1',
    kind: 'session-inspection-purification',
    status: 'prepared',
    ses_id: input.sessionId,
    markdown_path: input.markdownPath,
    tool_hints: ['grep', 'read'],
    instruction: 'Read the saved markdown_path from disk and use ses_id as the purification target.',
    prepared_at: preparedAt,
  }
}

/**
 * Upsert the per-session inspection export and paired async purification command.
 *
 * @param projectRoot Workspace root used for `.hivemind` path resolution.
 * @param input Completed assistant text and session identity.
 * @returns Stable artifact paths for the updated session inspection export.
 */
export async function upsertSessionInspectionExport(
  projectRoot: string,
  input: {
    sessionId: string
    assistantText: string
  },
): Promise<SessionInspectionExportResult> {
  const directoryPath = getSessionInspectionPath(projectRoot, input.sessionId)
  const markdownPath = path.join(directoryPath, SESSION_INSPECTION_MARKDOWN_FILE)
  const commandPath = path.join(directoryPath, SESSION_INSPECTION_COMMAND_FILE)
  const preparedAt = new Date().toISOString()

  await fs.mkdir(directoryPath, { recursive: true })
  await fs.writeFile(markdownPath, renderSessionInspectionMarkdown({
    sessionId: input.sessionId,
    assistantText: input.assistantText,
    preparedAt,
  }))
  await fs.writeFile(commandPath, JSON.stringify(createPreparedPurificationCommand({
    sessionId: input.sessionId,
    markdownPath,
    preparedAt,
  }), null, 2))

  return {
    sessionId: input.sessionId,
    directoryPath,
    markdownPath,
    commandPath,
  }
}
