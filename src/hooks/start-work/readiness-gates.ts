import type { PurposeClass, ReadinessGate, StartWorkInput } from './start-work-types.js'

export function resolveReadinessGates(
  input: StartWorkInput,
  purposeClass: PurposeClass,
): ReadinessGate[] {
  if (!input.hasHivemind) {
    return [{
      blocking: true,
      commandId: 'hm-init',
      reason: 'No .hivemind bootstrap state is available.',
    }]
  }

  if (!input.hivemindHealthy) {
    return [{
      blocking: true,
      commandId: 'hm-doctor',
      reason: 'The .hivemind control plane is unhealthy and must be repaired first.',
    }]
  }

  if (!input.hasWorkflow && ['planning', 'implementation', 'gatekeeping', 'tdd', 'course-correction'].includes(purposeClass)) {
    return [{
      blocking: false,
      commandId: 'hm-harness',
      reason: 'High-control work needs workflow readiness and harness validation.',
    }]
  }

  return []
}
