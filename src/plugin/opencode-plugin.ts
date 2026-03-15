import type { Part } from '@opencode-ai/sdk'
import { type Plugin } from '@opencode-ai/plugin'

import { recordTrajectoryEvent } from '../core/trajectory/index.js'
import { findSlashCommandBundle } from '../commands/slash-command/index.js'
import { initSdkContext, resetSdkContext } from '../hooks/sdk-context.js'
import { createEventHandler } from '../hooks/event-handler.js'
import { showGovernanceToast } from '../hooks/soft-governance.js'
import {
  createHivemindHandoffTool,
  createHivemindTaskTool,
  createHivemindTrajectoryTool,
} from '../tools/index.js'
import {
  createHivemindRuntimeStatusTool,
  createHivemindRuntimeCommandTool,
} from '../tools/runtime/index.js'
import { createMessagesTransform } from './messages-transform.js'
import { createPluginRuntimePlan } from './runtime-plan.js'
import { createSystemTransform } from './system-transform.js'
import { loadRuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import {
  renderOpencodeKnowledgePacket,
  resolveBaselineOpencodeKnowledgeSurfaces,
} from '../shared/opencode-knowledge.js'

type MessageLike = {
  info?: {
    id?: string
    role?: string
    sessionID?: string
  }
  parts?: Part[]
}

function createSyntheticPart(sessionID: string, messageID: string, text: string): Part {
  return {
    id: `hm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionID,
    messageID,
    type: 'text',
    text,
    synthetic: true,
    experimental_providerMetadata: {
      opencode: {
        ui_hidden: true,
      },
    },
  } as Part
}

function getMessageText(message: MessageLike): string {
  return (message.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join(' ')
}

function findLastUserMessage(messages: MessageLike[]): MessageLike | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.info?.role === 'user') {
      return message
    }
  }

  return undefined
}

function buildRouteReminder(plan: Awaited<ReturnType<typeof createPluginRuntimePlan>>): string | null {
  const decision = plan.data?.startWork
  if (!decision) {
    return null
  }

  const commandId = decision.requiredCommandId ?? decision.recommendedCommandId
  if (!commandId) {
    return null
  }

  return [
    '<hivemind-route-bridge>',
    `command=${commandId}`,
    `outcome=${decision.traversalOutcome}`,
    `route_disposition=${decision.routeDisposition ?? 'create'}`,
    `risk=${decision.riskLevel}`,
    `next_transition=${decision.nextTransition ?? 'none'}`,
    'execution_rule=use-hivemind-runtime-command-for-hm-bundles',
    'mutation_rule=never-bootstrap-hivemind-by-manual-file-writes',
    'intake_rule=if-bootstrap-profile-is-missing-run-the-question-tool-wizard-before-hm-init',
    'intake_rule=hm-settings-must-use-question-tool-group-selection-before-runtime-mutation',
    'question_rule=do-not-ask-free-text-permission-questions-when-a-control-plane-wizard-is-required',
    '</hivemind-route-bridge>',
  ].join('\n')
}

async function recordToolEvent(directory: string, sessionID: string, toolName: string): Promise<void> {
  const snapshot = await loadRuntimeBindingsSnapshot(directory)
  if (!snapshot.trajectoryId) {
    return
  }

  await recordTrajectoryEvent(directory, snapshot.trajectoryId, {
    kind: 'transition',
    summary: `tool:${toolName}:${sessionID}`,
    evidenceRefs: snapshot.taskIds,
  })
}

/** Tools that are managed by HiveMind and should not require separate permission prompts */
const HIVEMIND_MANAGED_TOOLS = new Set([
  'hivemind_runtime_status',
  'hivemind_runtime_command',
  'hivemind_task',
  'hivemind_trajectory',
  'hivemind_handoff',
])

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
      hivemind_task: createHivemindTaskTool(directory),
      hivemind_trajectory: createHivemindTrajectoryTool(directory),
      hivemind_handoff: createHivemindHandoffTool(directory),
    },
    'chat.message': async (messageInput, output) => {
      const snapshot = await loadRuntimeBindingsSnapshot(directory)
      const sessionID = messageInput.sessionID

      // Inject baseline OpenCode knowledge
      output.parts.push({
        id: `hm_knowledge_${Date.now()}`,
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
        id: `hm_context_${Date.now()}`,
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
        if (toolName && HIVEMIND_MANAGED_TOOLS.has(toolName)) {
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
      if (HIVEMIND_MANAGED_TOOLS.has(toolInput.tool)) {
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

      const routeReminder = buildRouteReminder(runtimePlan)
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
