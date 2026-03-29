import path from 'node:path'

import { HIVEMIND_DIR, SESSIONS_DIR } from '../../shared/paths.js'

function getJourneyEventsDir(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, 'journey-events')
}

function getErrorLogsDir(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, 'error-logs')
}

/**
 * @deprecated Session-scoped directories are deprecated in favor of flat session files.
 */
function getSessionFilePath(projectRoot: string, sessionId: string, filename: string): string {
  return path.join(getEventTrackerSessionDir(projectRoot, sessionId), filename)
}

/**
 * Builds the event-tracker directory path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Session directory path under .hivemind/sessions.
 * @deprecated Session-scoped directories are deprecated in favor of flat session files.
 */
export function getEventTrackerSessionDir(projectRoot: string, sessionId: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, sessionId)
}

/**
 * Builds the journey-events directory path.
 * @param projectRoot Absolute or workspace project root.
 * @returns Path to the journey-events directory under .hivemind/sessions.
 */
export function getJourneyEventsPath(projectRoot: string): string {
  return getJourneyEventsDir(projectRoot)
}

/**
 * Builds the error-logs directory path.
 * @param projectRoot Absolute or workspace project root.
 * @returns Path to the error-logs directory under .hivemind/sessions.
 */
export function getErrorLogsPath(projectRoot: string): string {
  return getErrorLogsDir(projectRoot)
}

/**
 * Builds the flat journey-events markdown path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to the journey-events markdown file.
 */
export function getJourneyEventsMarkdownPath(projectRoot: string, sessionId: string): string {
  return path.join(getJourneyEventsDir(projectRoot), `${sessionId}.md`)
}

/**
 * Builds the flat error log path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to the session error log file.
 */
export function getErrorLogPath(projectRoot: string, sessionId: string): string {
  return path.join(getErrorLogsDir(projectRoot), `${sessionId}.log`)
}

/**
 * Builds the events file path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to events markdown file.
 */
export function getSessionEventsPath(projectRoot: string, sessionId: string): string {
  return getJourneyEventsMarkdownPath(projectRoot, sessionId)
}

/**
 * Builds the diagnostics file path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to diagnostics log file.
 */
export function getSessionDiagnosticsPath(projectRoot: string, sessionId: string): string {
  return getErrorLogPath(projectRoot, sessionId)
}

/**
 * Builds the delegation file path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to the compatibility markdown file under journey-events.
 * @deprecated Delegation entries now append into the flat journey-events markdown file.
 */
export function getSessionDelegationPath(projectRoot: string, sessionId: string): string {
  return getJourneyEventsMarkdownPath(projectRoot, sessionId)
}

/**
 * Builds the injection file path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to the compatibility markdown file under journey-events.
 * @deprecated Injection entries now append into the flat journey-events markdown file.
 */
export function getSessionInjectionPath(projectRoot: string, sessionId: string): string {
  return getJourneyEventsMarkdownPath(projectRoot, sessionId)
}

/**
 * Builds the metadata path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to session metadata JSON file.
 */
export function getSessionMetadataPath(projectRoot: string, sessionId: string): string {
  return path.join(getJourneyEventsDir(projectRoot), `${sessionId}.json`)
}

/**
 * Builds the event-tracker index path.
 * @param projectRoot Absolute or workspace project root.
 * @returns Path to sessions index markdown file.
 */
export function getEventTrackerIndexPath(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, 'index.md')
}

/**
 * Builds the synthesis path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to synthesis markdown file.
 * @deprecated Session-scoped directories are deprecated in favor of flat session files.
 */
export function getSessionSynthesisPath(projectRoot: string, sessionId: string): string {
  return getSessionFilePath(projectRoot, sessionId, 'synthesis.md')
}

/**
 * Builds the consolidated session JSON path (session/v2 format).
 * Produces a single JSON file with turn-based structure replacing the 3-file approach.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Semantic session ID (ses_<timestamp>_<purpose>_<agent>).
 * @returns Path to consolidated session JSON file.
 */
export function getConsolidatedSessionPath(projectRoot: string, sessionId: string): string {
  return path.join(getJourneyEventsDir(projectRoot), `${sessionId}.json`)
}
