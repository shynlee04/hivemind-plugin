import type { ControlPlaneIntakeGateResult } from '../../control-plane/control-plane-types.js'

/**
 * Resolved profile input from intake - represents the normalized values
 * collected from CLI flags, presets, or existing runtime snapshot.
 */
export interface ControlPlaneResolvedProfileInput {
  preferredUserName?: string
  language?: string
  artifactLanguage?: string
  expertLevel?: string
  governanceMode?: string
  automationLevel?: string
  outputStyle?: string
}

/**
 * Result of intake resolution - combines gate decision with resolved profile input.
 * @example
 * const resolution = resolveControlPlaneIntakeGate(primitive, input, snapshot)
 * if (resolution.gate) {
 *   // Profile incomplete, need to show questionnaire
 * }
 */
export interface ControlPlaneIntakeResolution {
  gate: ControlPlaneIntakeGateResult | null
  profileInput: ControlPlaneResolvedProfileInput
}
