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
import { resolveSkillBundle, resolveSessionRole } from './skill-exposure-map.js'
import { renderSkillFocusBlock } from './skill-focus-renderer.js'
import { setInjectionPayload } from './injection-store.js'

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

    // Only inject on genuine user turns and subagent handoffs — skip tool results and thinking turns
    const lastMsg = lastUserMessage as { info?: { variant?: string } }
    if (!lastMsg.info?.variant || (lastMsg.info.variant !== 'new' && lastMsg.info.variant !== 'continue')) {
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

    // Resolve skill bundle and session role for this turn
    const skillBundle = resolveSkillBundle(
      activeAgent,
      startWork.purposeClass,
      startWork.sessionState,
    )
    const sessionRole = resolveSessionRole(startWork.sessionState, activeAgent)

    // Render all injection blocks
    const packet = renderHivemindContext(createHivemindContextPacket({
      sessionId: sessionID,
      snapshot: renderSnapshot,
      startWork,
    }))
    const turnHierarchyPacket = renderTurnHierarchy(turnHierarchyContext)
    const skillFocusPacket = renderSkillFocusBlock(skillBundle, sessionRole)

    // Build injected parts: turn-hierarchy → context → skill-focus (all before user parts)
    const injectedParts: ReturnType<typeof createSyntheticPart>[] = [
      createSyntheticPart(sessionID, messageID, turnHierarchyPacket),
      createSyntheticPart(sessionID, messageID, packet),
    ]

    // Add skill focus block only when there are skills to expose
    if (skillFocusPacket.length > 0) {
      injectedParts.push(createSyntheticPart(sessionID, messageID, skillFocusPacket))
    }

    // Route hint appended after user parts (conditional on not already dispatched)
    const routeReminder = alreadyDispatched || dispatchedNow
      ? undefined
      : renderRouteHint({
          routeCommand: routedCommand,
          risk: startWork.riskLevel,
        })

    // Store injection payload for diagnostic log (read by text.complete hook)
    setInjectionPayload({
      sessionId: sessionID,
      timestamp: new Date().toISOString(),
      agent: activeAgent ?? 'hivefiver',
      purposeClass: startWork.purposeClass,
      sessionState: startWork.sessionState,
      skillBundle,
      sessionRole,
      skillFocusBlock: skillFocusPacket,
      turnHierarchyBlock: turnHierarchyPacket,
      contextBlock: packet,
      routeHintBlock: routeReminder,
      variant: lastMsg.info?.variant ?? 'unknown',
    })

    lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]

    if (routeReminder) {
      lastUserMessage.parts = [
        ...(lastUserMessage.parts ?? []),
        createSyntheticPart(sessionID, messageID, routeReminder),
      ]
    }
  }
}
