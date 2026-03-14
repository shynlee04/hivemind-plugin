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
export const ARTIFACTS_DIR = 'artifacts'
export const CHECKPOINTS_DIR = 'checkpoints'

// State files
export const STATE_FILES = {
  hiveneuron: 'hiveneuron.json',
  hivebrain: 'hivebrain.md',
  brain: 'brain.json',
  anchors: 'anchors.json',
} as const

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
