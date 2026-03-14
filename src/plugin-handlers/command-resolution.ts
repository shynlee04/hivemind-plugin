import type { CommandBinding } from './handler-types.js'
import type { StartWorkDecision } from '../hooks/start-work/index.js'
import { findSlashCommandBundle } from '../tools/slash-command/index.js'

export function resolveCommandBinding(startWork: StartWorkDecision): CommandBinding {
  const commandId = startWork.requiredCommandId ?? startWork.recommendedCommandId

  if (!commandId) {
    return {
      autoRoute: false,
      reason: 'No command bundle is required for this purpose class.',
    }
  }

  const bundle = findSlashCommandBundle(commandId)
  if (!bundle) {
    return {
      autoRoute: false,
      reason: `Command bundle ${commandId} is not registered.`,
    }
  }

  const autoRoute = startWork.autoRoute && bundle.autoRouteAllowed && startWork.riskLevel !== 'gated'

  return {
    bundle,
    autoRoute,
    reason: autoRoute
      ? 'The command bundle may be auto-routed under the current risk gates.'
      : 'The command bundle requires explicit confirmation or is gated by risk policy.',
  }
}
