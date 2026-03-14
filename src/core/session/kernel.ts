/**
 * Session Kernel
 * Core session lifecycle management (≤200 LOC)
 */

import { nanoid } from 'nanoid'
import { eventBus } from '../../shared/event-bus'
import { log } from '../../shared/logging'

export interface Session {
  id: string
  status: 'pending' | 'active' | 'blocked' | 'done'
  intent?: string
  focus?: string
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

export interface SessionCreateOptions {
  intent?: string
  focus?: string
  forceNewActionTask?: boolean
}

let activeSession: Session | null = null

export function createSession(options: SessionCreateOptions = {}): Session {
  const session: Session = {
    id: `ses_${nanoid(16)}`,
    status: 'pending',
    intent: options.intent,
    focus: options.focus,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  log.info('Session created', session.id)
  eventBus.emit('session:created', session)
  
  return session
}

export function activateSession(session: Session): void {
  session.status = 'active'
  session.updatedAt = Date.now()
  activeSession = session
  
  log.info('Session activated', session.id)
  eventBus.emit('session:activated', session)
}

export function getActiveSession(): Session | null {
  return activeSession
}

export function updateSession(session: Session, updates: Partial<Session>): Session {
  Object.assign(session, updates, { updatedAt: Date.now() })
  eventBus.emit('session:updated', session)
  return session
}

export function closeSession(session: Session): void {
  session.status = 'done'
  session.updatedAt = Date.now()
  
  if (activeSession?.id === session.id) {
    activeSession = null
  }
  
  log.info('Session closed', session.id)
  eventBus.emit('session:closed', session)
}
