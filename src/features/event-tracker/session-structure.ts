/**
 * Session Structure — Directory-based session layout (ADR-017)
 *
 * Pure path computation and directory creation for the session hierarchy.
 * All path functions are deterministic; directory functions are idempotent.
 *
 * @module event-tracker/session-structure
 */

import { mkdirSync, readFileSync, renameSync } from 'node:fs'
import { basename, join } from 'node:path'

// ---------------------------------------------------------------------------
// Pure path computation (no side effects)
// ---------------------------------------------------------------------------

/**
 * Compute the directory path for a session.
 *
 * @param sessionsDir - Root sessions directory
 * @param semanticId  - Semantic session identifier
 * @returns `sessionsDir/semanticId`
 */
export function getSessionDirPath(sessionsDir: string, semanticId: string): string {
  return join(sessionsDir, semanticId)
}

/**
 * Compute the directory path for a sub-session.
 *
 * @param parentDir        - Parent session directory
 * @param childSemanticId  - Child semantic session identifier
 * @returns `parentDir/subsessions/childSemanticId`
 */
export function getSubSessionDirPath(parentDir: string, childSemanticId: string): string {
  return join(parentDir, 'subsessions', childSemanticId)
}

// ---------------------------------------------------------------------------
// Directory creation (side effects)
// ---------------------------------------------------------------------------

/**
 * Create a session directory and return its path.
 * Idempotent — does not throw if the directory already exists.
 *
 * @param sessionsDir - Root sessions directory
 * @param semanticId  - Semantic session identifier
 * @returns The created session directory path
 */
export function createSessionDir(sessionsDir: string, semanticId: string): string {
  const sessionPath = getSessionDirPath(sessionsDir, semanticId)
  mkdirSync(sessionPath, { recursive: true })
  return sessionPath
}

/**
 * Create a sub-session directory under `parentDir/subsessions/`.
 * Auto-creates the `subsessions/` intermediate directory if missing.
 * Idempotent — does not throw if the directory already exists.
 *
 * @param parentDir       - Parent session directory
 * @param childSemanticId - Child semantic session identifier
 * @returns The created sub-session directory path
 */
export function createSubSessionDir(parentDir: string, childSemanticId: string): string {
  const childPath = getSubSessionDirPath(parentDir, childSemanticId)
  mkdirSync(childPath, { recursive: true })
  return childPath
}

// ---------------------------------------------------------------------------
// Migration — flat JSON → directory structure
// ---------------------------------------------------------------------------

/**
 * Migrate a flat session JSON file into the directory-based layout.
 *
 * 1. Reads the flat JSON to extract `semanticSessionId`
 * 2. Creates the session directory
 * 3. Moves the file to `{semanticSessionId}/session.json`
 * 4. Returns the session directory path
 *
 * Throws ENOENT if the flat file does not exist.
 *
 * @param sessionsDir - Root sessions directory
 * @param flatJsonFile - Absolute path to the flat JSON file
 * @returns The session directory path after migration
 */
export async function migrateFlatToDirectory(
  sessionsDir: string,
  flatJsonFile: string,
): Promise<string> {
  // Throws ENOENT if file doesn't exist
  readFileSync(flatJsonFile, 'utf-8')

  // Extract semanticId from filename: {semanticId}.json
  const fileName = basename(flatJsonFile, '.json')

  const sessionDir = getSessionDirPath(sessionsDir, fileName)
  mkdirSync(sessionDir, { recursive: true })

  const targetPath = join(sessionDir, 'session.json')
  renameSync(flatJsonFile, targetPath)

  return sessionDir
}
