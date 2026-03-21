/**
 * Shared Evidence Lane Types and Contracts
 *
 * Single source of truth for evidence lane types across all validators.
 * This module defines the canonical EvidenceLane enum and EvidenceResult interface
 * used by runtime validators, continuity tests, and evidence reporters.
 *
 * Evidence lanes:
 * - LOCAL_DIAGNOSTICS (VER-01): Local type checking, import validation, schema validation
 * - INTEGRATION_CHECKS (VER-02): Integration path testing with mocked dependencies
 * - LIVE_OFFICIAL_INTERFACE_PROOF (VER-03): Live runtime verification
 *
 * @module shared/evidence-lane
 */

export enum EvidenceLane {
  LOCAL_DIAGNOSTICS = 'local_diagnostics',
  INTEGRATION_CHECKS = 'integration_checks',
  LIVE_OFFICIAL_INTERFACE_PROOF = 'live_official_interface_proof',
}

export type EvidenceStatus = 'pass' | 'fail' | 'unavailable' | 'not_applicable'

export interface EvidenceResult<T = unknown> {
  lane: EvidenceLane
  status: EvidenceStatus
  label: '[non-live evidence]' | null
  message: string | null
  justification: string | null
  evidence: T
}

/**
 * Create an EvidenceResult with standard fields
 */
export function createEvidenceResult<T>(
  lane: EvidenceLane,
  status: EvidenceStatus,
  evidence: T,
  opts: { label?: '[non-live evidence]' | null; message?: string | null; justification?: string | null } = {},
): EvidenceResult<T> {
  return {
    lane,
    status,
    label: opts.label ?? null,
    message: opts.message ?? null,
    justification: opts.justification ?? null,
    evidence,
  }
}

/**
 * Create a non-live evidence result for when live proof is unavailable
 */
export function createNonLiveEvidenceResult<T>(
  lane: EvidenceLane,
  evidence: T,
  justification: string,
): EvidenceResult<T> {
  return createEvidenceResult(lane, 'unavailable', evidence, {
    label: '[non-live evidence]',
    justification,
  })
}

/**
 * Create a not-applicable result for when a lane doesn't apply
 */
export function createNotApplicableResult<T>(
  lane: EvidenceLane,
  evidence: T,
  justification: string,
): EvidenceResult<T> {
  return createEvidenceResult(lane, 'not_applicable', evidence, {
    justification,
  })
}
