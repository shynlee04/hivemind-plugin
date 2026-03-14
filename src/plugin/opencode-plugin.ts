import type { Part } from '@opencode-ai/sdk'
import { tool, type Plugin } from '@opencode-ai/plugin'

import { recordTrajectoryEvent } from '../core/trajectory/index.js'
import { executeSlashCommandBundle, findSlashCommandBundle, discoverSlashCommandBundles } from '../commands/slash-command/index.js'
import { initSdkContext, resetSdkContext } from '../hooks/sdk-context.js'
import { createEventHandler } from '../hooks/event-handler.js'
import {
  createHivemindHandoffTool,
  createHivemindTaskTool,
  createHivemindTrajectoryTool,
} from '../tools/index.js'
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

/**
 * Real OpenCode plugin entry for the revamp lane.
 *
 * This adapter turns the internal trajectory/workflow/task runtime into an actual
 * OpenCode-loadable plugin with live hooks, tool exposure, and command/runtime bridging.
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
      hivemind_runtime_status: tool({
        description: 'Inspect active HiveMind runtime attachment, trajectory, workflow, and command availability.',
        args: {},
        async execute(_args, context) {
          const snapshot = await loadRuntimeBindingsSnapshot(directory)
          context.metadata({
            title: 'HiveMind runtime status',
            metadata: {
              trajectoryId: snapshot.trajectoryId,
              workflowId: snapshot.workflowId,
            },
          })
          return JSON.stringify({
            attached: true,
            sessionID: context.sessionID,
            attachmentMode: snapshot.attachmentMode,
            trajectoryId: snapshot.trajectoryId,
            workflowId: snapshot.workflowId,
            taskIds: snapshot.taskIds,
            availableCommands: discoverSlashCommandBundles().map((bundle) => bundle.id),
          }, null, 2)
        },
      }),
      hivemind_runtime_command: tool({
        description: 'Execute a HiveMind hm-* command bundle against the active revamp runtime.',
        args: {
          command: tool.schema.string(),
          arguments: tool.schema.string().optional(),
          userMessage: tool.schema.string().optional(),
        },
        async execute(args, context) {
          const snapshot = await loadRuntimeBindingsSnapshot(directory)
          const bundle = findSlashCommandBundle(args.command)
          if (!bundle) {
            throw new Error(`Unknown HiveMind command: ${args.command}`)
          }

          const result = await executeSlashCommandBundle(bundle, {
            projectRoot: directory,
            sessionId: context.sessionID,
            sessionScope: 'main',
            trajectoryId: snapshot.trajectoryId,
            workflowId: snapshot.workflowId,
            taskIds: snapshot.taskIds,
            subtaskIds: snapshot.subtaskIds,
            lineage: snapshot.defaultLineage,
            purposeClass: snapshot.defaultPurposeClass,
            arguments: args.arguments,
            userMessage: args.userMessage ?? `execute ${args.command}`,
            activeAgent: context.agent,
          })

          context.metadata({
            title: `HiveMind command ${args.command}`,
            metadata: {
              command: args.command,
              closeoutStatus: result.closeoutStatus,
            },
          })
          return JSON.stringify(result, null, 2)
        },
      }),
      hivemind_task: createHivemindTaskTool(directory),
      hivemind_trajectory: createHivemindTrajectoryTool(directory),
      hivemind_handoff: createHivemindHandoffTool(directory),
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
