import { findControlPlanePrimitive } from '../../control-plane/index.js'
import { findSlashCommandBundle } from '../../commands/slash-command/index.js'
import type { StartWorkDecision } from '../session-entry/start-work-types.js'
import type { RuntimeBindingsSnapshot } from './attachment.js'

export interface NlFirstRuntimeDispatchContext {
  sessionID: string
  agent: string
}

export interface NlFirstRuntimeDispatchInput {
  projectRoot: string
  startWork: StartWorkDecision
  snapshot: RuntimeBindingsSnapshot
  userMessage: string
  context: NlFirstRuntimeDispatchContext
}

export interface NlFirstRuntimeDispatchPlan {
  shouldDispatch: boolean
  routeKind: 'none' | 'workflow-command' | 'control-plane'
  commandId?: string
  reason: string
}

export interface NlFirstRuntimeDispatchResult {
  plan: NlFirstRuntimeDispatchPlan
}

const DISPATCH_UNAVAILABLE_REASON = 'NL-first runtime dispatch execution is not available in the messages transform flow; preserving the route hint.'

export async function maybeExecuteNlFirstRuntimeDispatch(
  input: NlFirstRuntimeDispatchInput,
): Promise<NlFirstRuntimeDispatchResult> {
  void input.projectRoot
  void input.snapshot
  void input.userMessage
  void input.context.sessionID
  void input.context.agent

  const controlPlanePrimitive = findControlPlanePrimitive(
    input.startWork.requiredControlPlaneId ?? input.startWork.recommendedControlPlaneId,
  )
  if (controlPlanePrimitive) {
    return {
      plan: {
        shouldDispatch: false,
        routeKind: 'control-plane',
        commandId: controlPlanePrimitive.adapterCommandId,
        reason: DISPATCH_UNAVAILABLE_REASON,
      },
    }
  }

  const commandId = input.startWork.requiredCommandId ?? input.startWork.recommendedCommandId
  if (!commandId) {
    return {
      plan: {
        shouldDispatch: false,
        routeKind: 'none',
        reason: 'No routable command is available for this turn.',
      },
    }
  }

  const bundle = findSlashCommandBundle(commandId)
  if (!bundle) {
    return {
      plan: {
        shouldDispatch: false,
        routeKind: 'none',
        commandId,
        reason: `Command bundle ${commandId} is not registered.`,
      },
    }
  }

  return {
    plan: {
      shouldDispatch: false,
      routeKind: 'workflow-command',
      commandId: bundle.id,
      reason: DISPATCH_UNAVAILABLE_REASON,
    },
  }
}
