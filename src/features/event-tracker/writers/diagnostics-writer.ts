import { getSessionDiagnosticsPath } from '../paths.js'

import { appendExactUtf8Content } from './base-writer.js'

export type SessionDiagnosticWriteInput = {
  sessionId: string
  timestamp: string
  level?: string
  actor?: string
  source?: string
  message?: string
  details?: string
}

function asDisplayValue(value?: string): string {
  return value?.trim() ? value : 'N/A'
}

function asDetailsValue(value?: string): string {
  return value?.trim() ? value : ''
}

/**
 * Renders a grep-friendly single-line diagnostic log entry.
 * @param entry Diagnostic data supplied by the caller.
 * @returns Single-line log entry ready to append to diagnostics.log.
 */
export function renderDiagnosticLogLine(entry: SessionDiagnosticWriteInput): string {
  return [
    entry.timestamp,
    `session=${entry.sessionId}`,
    `level=${asDisplayValue(entry.level)}`,
    `actor=${asDisplayValue(entry.actor)}`,
    `source=${asDisplayValue(entry.source)}`,
    `message=${asDisplayValue(entry.message)}`,
    `details=${asDetailsValue(entry.details)}`,
  ].join(' | ')
}

/**
 * Appends a caller-supplied diagnostic entry to the session diagnostics log.
 * @param projectRoot Absolute or workspace project root.
 * @param entry Diagnostic data supplied by the caller.
 * @returns Resolves when the append completes.
 */
export async function appendSessionDiagnostic(
  projectRoot: string,
  entry: SessionDiagnosticWriteInput,
): Promise<void> {
  const diagnosticsPath = getSessionDiagnosticsPath(projectRoot, entry.sessionId)
  const line = `${renderDiagnosticLogLine(entry)}\n`

  await appendExactUtf8Content(diagnosticsPath, line)
}
