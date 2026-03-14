/**
 * Session Boundary
 * Determine when sessions should split or compact (≤200 LOC)
 */

import { Session } from './kernel'
import { log } from '../../shared/logging'

export interface BoundaryCheck {
  shouldSplit: boolean
  shouldCompact: boolean
  reason?: string
}

const TURN_THRESHOLD = 50
const TOKEN_THRESHOLD = 100000

export function checkBoundary(session: Session, turnCount: number, tokenCount: number): BoundaryCheck {
  const result: BoundaryCheck = {
    shouldSplit: false,
    shouldCompact: false,
  }
  
  // Check token threshold
  if (tokenCount > TOKEN_THRESHOLD) {
    result.shouldCompact = true
    result.reason = `Token count ${tokenCount} exceeds threshold ${TOKEN_THRESHOLD}`
    log.warn('Session boundary check: compact recommended', session.id)
  }
  
  // Check turn threshold
  if (turnCount > TURN_THRESHOLD) {
    result.shouldSplit = true
    result.reason = `Turn count ${turnCount} exceeds threshold ${TURN_THRESHOLD}`
    log.warn('Session boundary check: split recommended', session.id)
  }
  
  return result
}

export function createBoundary(session: Session, reason: string): string {
  const boundary = `--- SESSION BOUNDARY: ${session.id} ---\nReason: ${reason}\n---`
  log.info('Session boundary created', session.id, reason)
  return boundary
}
