import { findControlPlanePrimitive, resolveControlPlaneGate } from '../../control-plane/index.js'
import type { PurposeClass, ReadinessGate, StartWorkInput } from './start-work-types.js'

export function resolveReadinessGates(
  input: StartWorkInput,
  purposeClass: PurposeClass,
): ReadinessGate[] {
  const gate = resolveControlPlaneGate(input, purposeClass)
  if (gate.status === 'matched') {
    const primitive = findControlPlanePrimitive(gate.decision.primitiveId)
    return [{
      blocking: gate.decision.blocking,
      primitiveId: gate.decision.primitiveId,
      commandId: primitive?.adapterCommandId ?? gate.decision.primitiveId,
      reason: gate.decision.reason,
      pressureId: primitive?.pressureContract.id,
    }]
  }

  return []
}
