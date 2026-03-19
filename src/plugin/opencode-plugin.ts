import { type Plugin } from '@opencode-ai/plugin'

import { findSlashCommandBundle } from '../commands/slash-command/index.js'
import { initSdkContext, resetSdkContext } from '../hooks/sdk-context.js'
import { createEventHandler } from '../hooks/event-handler.js'
import { showGovernanceToast } from '../hooks/soft-governance.js'
import { resolveStartWork } from '../hooks/start-work/start-work-router.js'
import type { StartWorkInput } from '../hooks/start-work/start-work-types.js'
import {
  createSyntheticPart,
  findLastUserMessage,
  getMessageText,
  type MessageLike,
} from '../hooks/prompt-transformation/index.js'
import { isHivemindManagedTool, recordToolEvent } from '../hooks/runtime-loader/index.js'
import { createHivemindDocTool } from '../tools/doc/index.js'
import { createHivemindHandoffTool } from '../tools/handoff/index.js'
import {
  createHivemindRuntimeStatusTool,
  createHivemindRuntimeCommandTool,
} from '../tools/runtime/index.js'
import { createHivemindTaskTool as createTaskTool } from '../tools/task/index.js'
import { createHivemindTrajectoryTool as createTrajectoryTool } from '../tools/trajectory/index.js'
import {
  createHivemindContextPacket,
  renderHivemindContext,
} from './context-renderer.js'
import { renderRouteHint } from './route-hint.js'
import { createTurnSnapshotLoader } from './runtime-snapshot.js'

function createStartWorkInput(input: {
  directory: string
  sessionId: string
  userMessage: string
  snapshot: Awaited<ReturnType<ReturnType<typeof createTurnSnapshotLoader>['getSnapshot']>>
}): StartWorkInput {
  return {
    userMessage: input.userMessage,
    sessionId: input.sessionId,
    sessionScope: 'main',
    projectRoot: input.directory,
    workflowId: input.snapshot.workflowId,
    taskIds: input.snapshot.taskIds,
    hasRuntimeAttachment: input.snapshot.hasRuntimeAttachment,
    profileComplete: input.snapshot.profileComplete,
    activeLineage: input.snapshot.defaultLineage,
    hasHivemind: input.snapshot.hasHivemind,
    hivemindHealthy: input.snapshot.hivemindHealthy,
    hasWorkflow: input.snapshot.hasWorkflow,
    hasHandoff: false,
  }
}

/**
 * Real OpenCode plugin entry for the revamp lane.
 *
 * Assembly-only: imports hooks and tools, registers them, exports Plugin.
 * No business logic. No tool definitions. No event processing beyond delegation.
 */
export const HiveMindPlugin: Plugin = async (input) => {
  const directory = input.directory
  initSdkContext(input)
  const eventHandler = createEventHandler(directory)
  const turnSnapshot = createTurnSnapshotLoader(directory)

  return {
    event: async (eventInput) => {
      await eventHandler(eventInput)
    },
    tool: {
      hivemind_runtime_status: createHivemindRuntimeStatusTool(directory),
      hivemind_runtime_command: createHivemindRuntimeCommandTool(directory),
      hivemind_doc: createHivemindDocTool(directory),
      hivemind_task: createTaskTool(directory),
      hivemind_trajectory: createTrajectoryTool(directory),
      hivemind_handoff: createHivemindHandoffTool(directory),
    },
    'chat.message': async (_messageInput, _output) => {
      turnSnapshot.resetTurnSnapshot()
      const snapshot = await turnSnapshot.getSnapshot()

      // Show degraded mode warning if HiveMind exists but isn't healthy
      if (snapshot.hasHivemind && !snapshot.hivemindHealthy) {
        await showGovernanceToast(
          'degraded-mode',
          'Running in degraded mode. HiveMind initialized with minimal state. Run `hm-init` for full capabilities and expert-level configuration.',
          'warning'
        )
      }
    },
    'permission.ask': async (permissionInput, output) => {
      // Auto-allow HiveMind managed tool calls (they have their own governance)
      if (permissionInput.metadata) {
        const toolName = (permissionInput.metadata as Record<string, unknown>).tool as string | undefined
        if (isHivemindManagedTool(toolName)) {
          output.status = 'allow'
          return
        }
      }

      // For state mutations, surface a governance toast
      if (permissionInput.type === 'write') {
        await showGovernanceToast(
          'mutation-gate',
          `HiveMind: Permission requested for ${permissionInput.type} operation`,
        )
      }
    },
    'tool.execute.before': async (toolInput, _output) => {
      // Record tool execution intent for trajectory tracking
      if (isHivemindManagedTool(toolInput.tool)) {
        await recordToolEvent(directory, toolInput.sessionID, `${toolInput.tool}:pre`)
      }
    },
    'shell.env': async (_input, output) => {
      const snapshot = await turnSnapshot.getSnapshot()
      output.env.HIVEMIND_RUNTIME_ATTACHED = '1'
      output.env.HIVEMIND_ATTACHMENT_MODE = snapshot.attachmentMode
      if (snapshot.trajectoryId) output.env.HIVEMIND_ACTIVE_TRAJECTORY = snapshot.trajectoryId
      if (snapshot.workflowId) output.env.HIVEMIND_ACTIVE_WORKFLOW = snapshot.workflowId
    },
    'command.execute.before': async (commandInput, output) => {
      const bundle = findSlashCommandBundle(commandInput.command)
      if (!bundle) {
        return
      }

      const snapshot = await turnSnapshot.getSnapshot()
      output.parts.unshift(createSyntheticPart(
        commandInput.sessionID,
        commandInput.sessionID,
        [
          '<hivemind-command-context>',
          `command=${bundle.id}`,
          `trajectory=${snapshot.trajectoryId ?? 'none'}`,
          `workflow=${snapshot.workflowId ?? 'none'}`,
          `task_ids=${snapshot.taskIds.join(',')}`,
          'execution_rule=call-hivemind_runtime_command-to-run-hm-bundle',
          'mutation_rule=do-not-hand-write-hivemind-state-files',
          '</hivemind-command-context>',
        ].join('\n'),
      ))
    },
    'tool.execute.after': async (toolInput) => {
      await recordToolEvent(directory, toolInput.sessionID, toolInput.tool)
    },
    'experimental.chat.messages.transform': async (_input, output) => {
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
      const startWork = resolveStartWork(createStartWorkInput({
        directory,
        sessionId: sessionID,
        userMessage,
        snapshot,
      }))
      const packet = renderHivemindContext(createHivemindContextPacket({
        sessionId: sessionID,
        snapshot,
        startWork,
      }))
      const injectedParts = [createSyntheticPart(sessionID, messageID, packet)]
      lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]

      const routeReminder = renderRouteHint({
        routeCommand: startWork.requiredCommandId ?? startWork.recommendedCommandId,
        risk: startWork.riskLevel,
      })
      if (routeReminder) {
        lastUserMessage.parts = [
          ...(lastUserMessage.parts ?? []),
          createSyntheticPart(sessionID, messageID, routeReminder),
        ]
      }
    },
    'experimental.session.compacting': async (compactionInput, output) => {
      const snapshot = await turnSnapshot.getSnapshot()
      output.context.push(renderHivemindContext(createHivemindContextPacket({
        sessionId: compactionInput.sessionID,
        snapshot,
      })))
    },
  }
}

export default HiveMindPlugin

process.on('exit', () => {
  resetSdkContext()
})
