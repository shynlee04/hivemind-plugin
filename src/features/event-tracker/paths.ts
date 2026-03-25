import path from 'node:path'

import { HIVEMIND_DIR, SESSIONS_DIR } from '../../shared/paths.js'

function getSessionFilePath(projectRoot: string, sessionId: string, filename: string): string {
  return path.join(getEventTrackerSessionDir(projectRoot, sessionId), filename)
}

/**
 * Builds the event-tracker directory path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Session directory path under .hivemind/sessions.
 */
export function getEventTrackerSessionDir(projectRoot: string, sessionId: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, sessionId)
}

/**
 * Builds the events file path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to events markdown file.
 */
export function getSessionEventsPath(projectRoot: string, sessionId: string): string {
  return getSessionFilePath(projectRoot, sessionId, 'events.md')
}

/**
 * Builds the diagnostics file path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to diagnostics log file.
 */
export function getSessionDiagnosticsPath(projectRoot: string, sessionId: string): string {
  return getSessionFilePath(projectRoot, sessionId, 'diagnostics.log')
}

/**
 * Builds the delegation file path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to delegation markdown file.
 */
export function getSessionDelegationPath(projectRoot: string, sessionId: string): string {
  return getSessionFilePath(projectRoot, sessionId, 'delegation.md')
}

/**
 * Builds the injection file path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to injection markdown file.
 */
export function getSessionInjectionPath(projectRoot: string, sessionId: string): string {
  return getSessionFilePath(projectRoot, sessionId, 'injection.md')
}

/**
 * Builds the metadata path for a session.
 * @param projectRoot Absolute or workspace project root.
 * @param sessionId Session identifier.
 * @returns Path to session metadata JSON file.
 */
export function getSessionMetadataPath(projectRoot: string, sessionId: string): string {
  return getSessionFilePath(projectRoot, sessionId, 'session.json')
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
  return getSessionFilePath(projectRoot, sessionId, `${sessionId}.json`)
}
