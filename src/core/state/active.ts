/**
 * Active State
 * Replaces brain.json with cleaner structure (≤200 LOC)
 */

import * as fs from 'fs'
import * as path from 'path'
import { getHivemindPath } from '../../shared/paths'
import { log } from '../../shared/logging'

export interface ActiveState {
  sessionId: string | null
  planId: string | null
  focus: string | null
  mode: 'plan_driven' | 'quick_fix' | 'exploration'
  lastActivity: number
  version: number
}

const ACTIVE_FILE = 'active.json'

function getActivePath(projectRoot: string): string {
  return path.join(getHivemindPath(projectRoot), 'state', ACTIVE_FILE)
}

export function loadActive(projectRoot: string): ActiveState {
  const filePath = getActivePath(projectRoot)
  
  if (!fs.existsSync(filePath)) {
    return createDefaultActive()
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as ActiveState
  } catch (err) {
    log.warn('Failed to load active state, using default')
    return createDefaultActive()
  }
}

export function saveActive(projectRoot: string, state: ActiveState): void {
  state.version += 1
  state.lastActivity = Date.now()
  
  const filePath = getActivePath(projectRoot)
  const dir = path.dirname(filePath)
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2))
  log.debug('Active state saved', state.sessionId)
}

export function createDefaultActive(): ActiveState {
  return {
    sessionId: null,
    planId: null,
    focus: null,
    mode: 'exploration',
    lastActivity: Date.now(),
    version: 1,
  }
}

export function setActiveSession(projectRoot: string, sessionId: string): ActiveState {
  const state = loadActive(projectRoot)
  state.sessionId = sessionId
  saveActive(projectRoot, state)
  return state
}

export function clearActiveSession(projectRoot: string): ActiveState {
  const state = loadActive(projectRoot)
  state.sessionId = null
  state.focus = null
  saveActive(projectRoot, state)
  return state
}
