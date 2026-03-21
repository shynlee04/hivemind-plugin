/**
 * Messages Transform Adapter.
 *
 * Isolated hook adapter for `experimental.chat.messages.transform`.
 * Injects HiveMind context and turn hierarchy into the last user message.
 */

import type { TurnHierarchyContext } from './context-renderer.js'
import {
  createHivemindContextPacket,
  renderHivemindContext,
  renderTurnHierarchy,
} from './context-renderer.js'
import { renderRouteHint } from './route-hint.js'
import type { TurnSnapshotLoader } from './runtime-snapshot.js'
import {
  createSyntheticPart,
  findLastUserMessage,
  getMessageText,
  type MessageLike,
} from './synthetic-parts.js'
import { createStartWorkInput } from './input-helpers.js'
import { resolveStartWork } from '../hooks/start-work/start-work-router.js'
import { maybeExecuteNlFirstRuntimeDispatch } from '../features/runtime-entry/nl-first-dispatch.js'

export interface MessagesTransformDeps {
  directory: string
  turnSnapshot: TurnSnapshotLoader
  nlFirstDispatchKeys: Set<string>
}

/**
 * Create the messages transform hook handler.
 *
 * @param deps - Injected dependencies (directory, snapshot loader, dispatch tracking)
 * @returns Async hook handler for messages.transform
 */
export function createMessagesTransformHandler(deps: MessagesTransformDeps) {
  const { directory, turnSnapshot, nlFirstDispatchKeys } = deps

  return async (
    transformInput: { agent?: string },
    output: { messages: MessageLike[] },
  ): Promise<void> => {
    const messages = output.messages as MessageLike[]
    const lastUserMessage = findLastUserMessage(messages)
    if (!lastUserMessage) {
      return
    }

    const sessionID = lastUserMessage.info?.sessionID
    const messageID = lastUserMessage.info?.id
    if (!sessionID || !messageID) {
      return
    }

    const snapshot = await turnSnapshot.getSnapshot()
    const userMessage = getMessageText(lastUserMessage)
    const activeAgent = typeof transformInput.agent === 'string' ? transformInput.agent : undefined
    const startWork = resolveStartWork(createStartWorkInput({
      directory,
      sessionId: sessionID,
      userMessage,
      activeAgent,
      snapshot,
    }))
    const routedCommand = startWork.requiredCommandId ?? startWork.recommendedCommandId
    const dispatchKey = `${sessionID}:${messageID}:${routedCommand ?? 'none'}`
    const alreadyDispatched = nlFirstDispatchKeys.has(dispatchKey)
    let dispatchedNow = false

    if (!alreadyDispatched) {
      const dispatch = await maybeExecuteNlFirstRuntimeDispatch({
        projectRoot: directory,
        startWork,
        snapshot,
        userMessage,
        context: {
          sessionID,
          agent: activeAgent ?? 'hivefiver',
        },
      })

      if (dispatch.plan.shouldDispatch) {
        nlFirstDispatchKeys.add(dispatchKey)
        dispatchedNow = true
        turnSnapshot.resetTurnSnapshot()
      }
    }

    const renderSnapshot = await turnSnapshot.getSnapshot()

    // Build turn hierarchy context from snapshot with defaults
    const turnHierarchyContext: TurnHierarchyContext = {
      turn_depth: 0,
      turn_type: 'root',
      sibling_count: 0,
      trajectory_path: [
        renderSnapshot.trajectoryId,
        renderSnapshot.workflowId,
        renderSnapshot.checkpointId,
        ...renderSnapshot.taskIds,
      ].filter((id): id is string => id !== undefined),
    }

    const packet = renderHivemindContext(createHivemindContextPacket({
      sessionId: sessionID,
      snapshot: renderSnapshot,
      startWork,
    }))
    const turnHierarchyPacket = renderTurnHierarchy(turnHierarchyContext)
    const injectedParts = [
      createSyntheticPart(sessionID, messageID, turnHierarchyPacket),
      createSyntheticPart(sessionID, messageID, packet),
    ]
    lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]

    const routeReminder = alreadyDispatched || dispatchedNow
      ? undefined
      : renderRouteHint({
          routeCommand: routedCommand,
          risk: startWork.riskLevel,
        })
    if (routeReminder) {
      lastUserMessage.parts = [
        ...(lastUserMessage.parts ?? []),
        createSyntheticPart(sessionID, messageID, routeReminder),
      ]
    }
  }
}
