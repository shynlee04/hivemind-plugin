import { randomUUID } from 'node:crypto'

import {
  attachRuntimeIdentityAndReadiness,
  type ReadinessSignal,
  type RuntimeIdentity,
} from '../../shared/contracts/runtime-status.js'

/**
 * Build the initialization report by attaching runtime identity and readiness signals.
 * @param input - Object containing closeout status and report data
 * @returns The report augmented with runtime_identity and readiness_signal
 */
export function buildInitReport(input: {
  closeoutStatus: 'open' | 'ready' | 'blocked' | 'qa-pending'
  report: Record<string, unknown>
}): Record<string, unknown> & {
  runtime_identity: RuntimeIdentity
  readiness_signal: ReadinessSignal
} {
  return attachRuntimeIdentityAndReadiness({
    closeoutStatus: input.closeoutStatus,
    report: input.report,
  })
}

/**
 * Create a unique runtime identifier with a given prefix.
 * @param prefix - String prefix for the identifier
 * @returns A unique identifier string (e.g., "ses_a1b2c3d4e5f6")
 * @example
 * const sessionId = createRuntimeId('ses')
 * // Returns: "ses_a1b2c3d4e5f6"
 */
export function createRuntimeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}
