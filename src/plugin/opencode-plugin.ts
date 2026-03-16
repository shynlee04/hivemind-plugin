import type { Part } from '@opencode-ai/sdk'
import { type Plugin } from '@opencode-ai/plugin'

import { findSlashCommandBundle } from '../commands/slash-command/index.js'
import { initSdkContext, resetSdkContext } from '../hooks/sdk-context.js'
import { createEventHandler } from '../hooks/event-handler.js'
import { showGovernanceToast } from '../hooks/soft-governance.js'
import {
  createSyntheticPart,
  findLastUserMessage,
  getMessageText,
  type MessageLike,
} from '../hooks/prompt-transformation/index.js'
import { isHivemindManagedTool, recordToolEvent } from '../hooks/runtime-loader/index.js'
import {
  createHivemindDocTool,
  createHivemindHandoffTool,
  createHivemindTaskTool,
  createHivemindTrajectoryTool,
} from '../tools/index.js'
import {
  createHivemindRuntimeStatusTool,
  createHivemindRuntimeCommandTool,
} from '../tools/runtime/index.js'
import { createMessagesTransform } from './messages-transform.js'
import { buildRouteReminder, createPluginRuntimePlan } from './runtime-plan.js'
import { createSystemTransform } from './system-transform.js'
import { loadRuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import {
  renderOpencodeKnowledgePacket,
  resolveBaselineOpencodeKnowledgeSurfaces,
} from '../shared/opencode-knowledge.js'

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
  const baselineOpencodeKnowledge = renderOpencodeKnowledgePacket(
    resolveBaselineOpencodeKnowledgeSurfaces(),
  )

  return {
    event: async (eventInput) => {
      await eventHandler(eventInput)
    },
    tool: {
      hivemind_runtime_status: createHivemindRuntimeStatusTool(directory),
      hivemind_runtime_command: createHivemindRuntimeCommandTool(directory),
      hivemind_doc: createHivemindDocTool(directory),
      hivemind_task: createHivemindTaskTool(directory),
      hivemind_trajectory: createHivemindTrajectoryTool(directory),
      hivemind_handoff: createHivemindHandoffTool(directory),
    },
    'chat.message': async (messageInput, output) => {
      const snapshot = await loadRuntimeBindingsSnapshot(directory)
      const sessionID = messageInput.sessionID

      // Inject baseline OpenCode knowledge
      output.parts.push({
        id: `prt_hm_knowledge_${Date.now()}`,
        sessionID,
        messageID: messageInput.messageID ?? sessionID,
        type: 'text',
        text: baselineOpencodeKnowledge,
        synthetic: true,
      } as Part)

      // Inject runtime context summary
      const contextSummary = [
        '<hivemind-session-context>',
        `trajectory=${snapshot.trajectoryId ?? 'none'}`,
        `workflow=${snapshot.workflowId ?? 'none'}`,
        `lineage=${snapshot.defaultLineage}`,
        `profile_complete=${snapshot.profileComplete}`,
        `task_count=${snapshot.taskIds.length}`,
        '</hivemind-session-context>',
      ].join('\n')

      output.parts.push({
        id: `prt_hm_context_${Date.now()}`,
        sessionID,
        messageID: messageInput.messageID ?? sessionID,
        type: 'text',
        text: contextSummary,
        synthetic: true,
      } as Part)
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
      const snapshot = await loadRuntimeBindingsSnapshot(directory)
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

      const snapshot = await loadRuntimeBindingsSnapshot(directory)
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
    'experimental.chat.system.transform': async (systemInput, output) => {
      const snapshot = await loadRuntimeBindingsSnapshot(directory)
      output.system.push(baselineOpencodeKnowledge)
      output.system.push(createSystemTransform({
        sessionId: systemInput.sessionID ?? 'unknown-session',
        sessionScope: 'main',
        parentSessionId: undefined,
        lineage: snapshot.defaultLineage,
        trajectoryId: snapshot.trajectoryId,
        workflowId: snapshot.workflowId,
        taskIds: snapshot.taskIds,
        subtaskIds: snapshot.subtaskIds,
        checkpointId: snapshot.checkpointId,
        preferredUserName: snapshot.preferredUserName,
        governanceMode: snapshot.governanceMode,
        automationLevel: snapshot.automationLevel,
        language: snapshot.language,
        artifactLanguage: snapshot.artifactLanguage,
        expertLevel: snapshot.expertLevel,
        outputStyle: snapshot.outputStyle,
        branchFocus: snapshot.branchFocus,
        verificationContract: snapshot.verificationContract,
        returnContract: snapshot.returnContract,
        guardrails: snapshot.guardrails,
        facilitators: snapshot.facilitators,
        mcpReadiness: snapshot.mcpReadiness,
        hivebrainDigest: snapshot.hivebrainDigest,
      }))
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

      const snapshot = await loadRuntimeBindingsSnapshot(directory)
      const userMessage = getMessageText(lastUserMessage)
      const runtimePlan = await createPluginRuntimePlan({
        startWork: {
          userMessage,
          sessionId: sessionID,
          sessionScope: 'main',
          projectRoot: directory,
          workflowId: snapshot.workflowId,
          taskIds: snapshot.taskIds,
          hasRuntimeAttachment: snapshot.hasRuntimeAttachment,
          profileComplete: snapshot.profileComplete,
          activeLineage: snapshot.defaultLineage,
          hasHivemind: snapshot.hasHivemind,
          hivemindHealthy: snapshot.hivemindHealthy,
          hasWorkflow: snapshot.hasWorkflow,
          hasHandoff: false,
        },
        promptState: {
          sessionId: sessionID,
          sessionScope: 'main',
          lineage: snapshot.defaultLineage,
          trajectoryId: snapshot.trajectoryId,
          workflowId: snapshot.workflowId,
          taskIds: snapshot.taskIds,
          subtaskIds: snapshot.subtaskIds,
          checkpointId: snapshot.checkpointId,
          preferredUserName: snapshot.preferredUserName,
          governanceMode: snapshot.governanceMode,
          automationLevel: snapshot.automationLevel,
          language: snapshot.language,
          artifactLanguage: snapshot.artifactLanguage,
          expertLevel: snapshot.expertLevel,
          outputStyle: snapshot.outputStyle,
          branchFocus: snapshot.branchFocus,
          verificationContract: snapshot.verificationContract,
          returnContract: snapshot.returnContract,
          guardrails: snapshot.guardrails,
          facilitators: snapshot.facilitators,
          mcpReadiness: snapshot.mcpReadiness,
          hivebrainDigest: snapshot.hivebrainDigest,
        },
      })

      const messagePacket = runtimePlan.data?.messageTransform ?? createMessagesTransform({
        sessionId: sessionID,
        sessionScope: 'main',
        lineage: snapshot.defaultLineage,
        trajectoryId: snapshot.trajectoryId,
        workflowId: snapshot.workflowId,
        taskIds: snapshot.taskIds,
        subtaskIds: snapshot.subtaskIds,
        checkpointId: snapshot.checkpointId,
        branchFocus: snapshot.branchFocus,
      })
      const injectedParts: Part[] = []
      if (runtimePlan.data?.opencodeKnowledgePacket) {
        injectedParts.push(createSyntheticPart(sessionID, messageID, runtimePlan.data.opencodeKnowledgePacket))
      }
      injectedParts.push(createSyntheticPart(sessionID, messageID, messagePacket))
      lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]

      const routeReminder = buildRouteReminder(runtimePlan.data)
      if (routeReminder) {
        lastUserMessage.parts = [
          ...(lastUserMessage.parts ?? []),
          createSyntheticPart(sessionID, messageID, routeReminder),
        ]
      }
    },
    'experimental.session.compacting': async (compactionInput, output) => {
      const snapshot = await loadRuntimeBindingsSnapshot(directory)
      output.context.push(baselineOpencodeKnowledge)
      output.context.push(createSystemTransform({
        sessionId: compactionInput.sessionID,
        sessionScope: 'main',
        lineage: snapshot.defaultLineage,
        trajectoryId: snapshot.trajectoryId,
        workflowId: snapshot.workflowId,
        taskIds: snapshot.taskIds,
        subtaskIds: snapshot.subtaskIds,
        checkpointId: snapshot.checkpointId,
        preferredUserName: snapshot.preferredUserName,
        governanceMode: snapshot.governanceMode,
        automationLevel: snapshot.automationLevel,
        language: snapshot.language,
        artifactLanguage: snapshot.artifactLanguage,
        expertLevel: snapshot.expertLevel,
        outputStyle: snapshot.outputStyle,
        branchFocus: snapshot.branchFocus,
        verificationContract: snapshot.verificationContract,
        returnContract: snapshot.returnContract,
        guardrails: snapshot.guardrails,
        facilitators: snapshot.facilitators,
        mcpReadiness: snapshot.mcpReadiness,
        hivebrainDigest: snapshot.hivebrainDigest,
      }))
    },
  }
}

export default HiveMindPlugin

process.on('exit', () => {
  resetSdkContext()
})
