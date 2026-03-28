/**
 * Path utilities for HiveMind
 * Centralizes all path constants and helpers
 */

import path from 'path'

// Root directory names
export const HIVEMIND_DIR = '.hivemind'
export const STATE_DIR = 'state'
export const SESSIONS_DIR = 'sessions'
export const GRAPH_DIR = 'graph'
export const CONFIG_DIR = 'config'

// State files
export const STATE_FILES = {} as const

// Path builders
export function getHivemindPath(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR)
}

export function getStatePath(projectRoot: string, filename: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, STATE_DIR, filename)
}

export function getSessionPath(projectRoot: string, sessionId: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, sessionId)
}

export function getSessionInspectionPath(projectRoot: string, sessionId: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, 'session-inspection', sessionId)
}

export function getErrorLogPath(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, 'error-log')
}

export function getConfigPath(projectRoot: string, configName: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, CONFIG_DIR, configName)
}

// Path predicates
export function isHivemindPath(filePath: string): boolean {
  return filePath.includes(HIVEMIND_DIR)
}

export function isSessionFile(filePath: string): boolean {
  return filePath.includes(SESSIONS_DIR)
}

/**
 * Canonical path authority: derives all runtime paths from a single project root.
 * All modules should use this instead of building paths ad-hoc.
 */
export function getEffectivePaths(projectRoot: string) {
  const root = path.join(projectRoot, HIVEMIND_DIR)
  const stateDir = path.join(root, STATE_DIR)
  const configDir = path.join(root, CONFIG_DIR)
  const graphDir = path.join(root, GRAPH_DIR)
  const sessionsDir = path.join(root, SESSIONS_DIR)
  const sessionInspectionDir = path.join(root, 'session-inspection')
  const projectPlanningDir = path.join(root, 'project', 'planning')
  const errorLogDir = path.join(root, 'error-log')

  return {
    root,
    stateDir,
    configDir,
    graphDir,
    sessionsDir,
    sessionInspectionDir,
    projectPlanningDir,
    errorLogDir,
    runtimeAttachmentSettings: path.join(configDir, 'runtime-attachment.json'),
    workflowTasksState: path.join(stateDir, 'tasks.json'),
    workflowTasksGraph: path.join(graphDir, 'tasks.json'),
    trajectoryLedger: path.join(stateDir, 'trajectory-ledger.json'),
  }
}
