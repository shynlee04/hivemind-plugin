import { findControlPlanePrimitive, resolveControlPlaneGate } from '../../control-plane/index.js'
import type { PurposeClass, ReadinessGate, StartWorkInput } from './start-work-types.js'

export function resolveReadinessGates(
  input: StartWorkInput,
  purposeClass: PurposeClass,
): ReadinessGate[] {
  const gate = resolveControlPlaneGate(input, purposeClass)
  if (gate) {
    const primitive = findControlPlanePrimitive(gate.primitiveId)
    return [{
      blocking: gate.blocking,
      primitiveId: gate.primitiveId,
      commandId: primitive?.adapterCommandId ?? gate.primitiveId,
      reason: gate.reason,
      pressureId: primitive?.pressureContract.id,
    }]
  }

  return []
}
