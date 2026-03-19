import { findControlPlanePrimitive } from '../control-plane/index.js'
import type { CommandBinding } from './handler-types.js'
import type { StartWorkDecision } from '../features/session-entry/start-work-types.js'
import { findSlashCommandBundle } from '../commands/slash-command/index.js'

export function resolveCommandBinding(startWork: StartWorkDecision): CommandBinding {
  const controlPlaneId = startWork.requiredControlPlaneId ?? startWork.recommendedControlPlaneId
  if (controlPlaneId) {
    const controlPlanePrimitive = findControlPlanePrimitive(controlPlaneId)
    const bundle = controlPlanePrimitive
      ? findSlashCommandBundle(controlPlanePrimitive.adapterCommandId)
      : undefined

    return {
      bindingKind: 'control-plane',
      initiationMode: 'programmatic-required',
      controlPlanePrimitive,
      bundle,
      autoRoute: true,
      reason: controlPlanePrimitive
        ? `Control-plane primitive ${controlPlanePrimitive.id} must be initiated through the runtime bridge.`
        : `Control-plane primitive ${controlPlaneId} is required but its adapter bundle is missing.`,
    }
  }

  const commandId = startWork.requiredCommandId ?? startWork.recommendedCommandId

  if (!commandId) {
    return {
      bindingKind: 'none',
      initiationMode: 'advisory',
      autoRoute: false,
      reason: 'No command bundle is required for this purpose class.',
    }
  }

  const bundle = findSlashCommandBundle(commandId)
  if (!bundle) {
    return {
      bindingKind: 'none',
      initiationMode: 'advisory',
      autoRoute: false,
      reason: `Command bundle ${commandId} is not registered.`,
    }
  }

  const autoRoute = startWork.autoRoute && bundle.autoRouteAllowed && startWork.riskLevel !== 'gated'

  return {
    bindingKind: 'workflow-command',
    initiationMode: autoRoute ? 'explicit' : 'advisory',
    bundle,
    autoRoute,
    reason: autoRoute
      ? 'The command bundle may be auto-routed under the current risk gates.'
      : 'The command bundle requires explicit confirmation or is gated by risk policy.',
  }
}
