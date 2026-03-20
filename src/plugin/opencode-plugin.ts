import { type Plugin } from '@opencode-ai/plugin'

import { findSlashCommandBundle } from '../commands/slash-command/index.js'
import { initSdkContext, resetSdkContext } from '../hooks/sdk-context.js'
import { createEventHandler } from '../hooks/event-handler.js'
import { showGovernanceToast } from '../hooks/soft-governance.js'
import { resolveStartWork } from '../hooks/start-work/start-work-router.js'
import { ContractStore } from '../features/agent-work-contract/engine/contract-store.js'
import { createCompactionPreservationPacket } from '../features/agent-work-contract/hooks/index.js'
import {
  createAgentWorkCreateContractTool,
  createAgentWorkExportContractTool,
} from '../features/agent-work-contract/tools/index.js'
import type { StartWorkInput } from '../features/session-entry/start-work-types.js'
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
  renderToolPrecedence,
  renderTurnHierarchy,
  type TurnHierarchyContext,
} from './context-renderer.js'
import { renderRouteHint } from './route-hint.js'
import { createTurnSnapshotLoader } from './runtime-snapshot.js'
import {
  createSyntheticPart,
  findLastUserMessage,
  getMessageText,
  type MessageLike,
} from './synthetic-parts.js'

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

async function resolveCompactionAgentWorkPacket(
  directory: string,
  sessionId: string,
) {
  const contracts = await new ContractStore(directory).list(sessionId)
  const latestContract = contracts
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]

  return latestContract
    ? createCompactionPreservationPacket(latestContract)
    : undefined
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
      hivemind_agent_work_create_contract: createAgentWorkCreateContractTool(directory),
      hivemind_agent_work_export_contract: createAgentWorkExportContractTool(directory),
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

      // Build tool precedence chain for bundle execution
      const toolPrecedenceChain = {
        chain: [
          {
            tool: 'hivemind_runtime_command',
            action: 'execute',
            args: { bundleId: bundle.id },
          },
        ],
        mandatory_reads: [
          { path: '.hivemind/session.json', reason: 'active_session_state' },
          ...(snapshot.trajectoryId ? [{ path: `.hivemind/trajectory/${snapshot.trajectoryId}.json`, reason: 'trajectory_state' }] : []),
          ...(snapshot.workflowId ? [{ path: `.hivemind/workflow/${snapshot.workflowId}.json`, reason: 'workflow_state' }] : []),
        ],
      }

      const toolPrecedenceJson = renderToolPrecedence(toolPrecedenceChain)

      output.parts.unshift(createSyntheticPart(
        commandInput.sessionID,
        commandInput.sessionID,
        [
          '<hivemind-command-context>',
          `command=${bundle.id}`,
          `trajectory=${snapshot.trajectoryId ?? 'none'}`,
          `workflow=${snapshot.workflowId ?? 'none'}`,
          `task_ids=${snapshot.taskIds.join(',')}`,
          `tool_precedence=${toolPrecedenceJson}`,
          'mutation_rule=do-not-hand-write-hivemind-state-files',
          '</hivemind-command-context>',
        ].join('\n'),
      ))
    },
    'tool.execute.after': async (toolInput) => {
      if (isHivemindManagedTool(toolInput.tool)) {
        await recordToolEvent(directory, toolInput.sessionID, toolInput.tool)
      }
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

      // Build turn hierarchy context from snapshot with defaults
      const turnHierarchyContext: TurnHierarchyContext = {
        turn_depth: 0,
        turn_type: 'root',
        sibling_count: 0,
        trajectory_path: [
          snapshot.trajectoryId,
          snapshot.workflowId,
          snapshot.checkpointId,
          ...snapshot.taskIds,
        ].filter((id): id is string => id !== undefined),
      }

      const packet = renderHivemindContext(createHivemindContextPacket({
        sessionId: sessionID,
        snapshot,
        startWork,
      }))
      const turnHierarchyPacket = renderTurnHierarchy(turnHierarchyContext)
      const injectedParts = [
        createSyntheticPart(sessionID, messageID, turnHierarchyPacket),
        createSyntheticPart(sessionID, messageID, packet),
      ]
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
      const agentWorkPacket = await resolveCompactionAgentWorkPacket(
        directory,
        compactionInput.sessionID,
      )
      const packet = createHivemindContextPacket({
        sessionId: compactionInput.sessionID,
        snapshot,
        agentWorkPacket,
      })

      // Always use renderHivemindContext for the authoritative format
      // This correctly includes contract_id and all agent-work fields when a contract exists
      const renderedContext = renderHivemindContext(packet)
      output.context.push(renderedContext)
    },
  }
}

export default HiveMindPlugin

process.on('exit', () => {
  resetSdkContext()
})
