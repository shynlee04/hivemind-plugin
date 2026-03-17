/**
 * Runtime tools — extracted from inline definitions in opencode-plugin.ts (L4 cutover).
 *
 * These tools provide runtime status inspection and command execution
 * against the HiveMind revamp runtime.
 */

import { tool } from '@opencode-ai/plugin'

import {
  executeSlashCommandBundle,
  findSlashCommandBundle,
  discoverSlashCommandBundles,
} from '../../commands/slash-command/index.js'
import { buildRuntimeStatusSnapshot } from '../../sdk-supervisor/index.js'
import { loadRuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import { renderToolResult } from '../../shared/tool-helpers.js'
import type { HivemindRuntimeStatusPayload } from './types.js'

/**
 * Create the hivemind_runtime_status tool.
 * Inspects active HiveMind runtime attachment, trajectory, workflow, and command availability.
 */
export function createHivemindRuntimeStatusTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description: 'Inspect active HiveMind runtime attachment, trajectory, workflow, and command availability.',
    args: {},
    async execute(_args, context) {
      const snapshot = await loadRuntimeBindingsSnapshot(projectRoot)
      const statusSnapshot = await buildRuntimeStatusSnapshot({
        projectRoot,
        sessionId: context.sessionID,
        agentId: context.agent,
        snapshot,
      })
      const payload: HivemindRuntimeStatusPayload = {
        entryState: {
          state: snapshot.entryState,
          interactiveBootstrapRequired: snapshot.interactiveBootstrapRequired,
          recommendedNext: snapshot.entryState === 'uninitialized'
            ? 'hm-init'
            : snapshot.entryState === 'repair-required'
              ? 'hm-doctor'
              : snapshot.qaState === 'pending'
                ? 'hm-harness'
                : 'none',
        },
        qaState: {
          state: snapshot.qaState,
          releaseState: snapshot.releaseState,
        },
        runtimeState: {
          sessionID: context.sessionID,
          attachmentMode: snapshot.attachmentMode,
          hasRuntimeAttachment: snapshot.hasRuntimeAttachment,
          hasHivemind: snapshot.hasHivemind,
          hivemindHealthy: snapshot.hivemindHealthy,
          hasWorkflow: snapshot.hasWorkflow,
          profileComplete: snapshot.profileComplete,
          missingProfileFields: snapshot.missingProfileFields,
          bootstrapProfile: snapshot.bootstrapProfile,
        },
        kernelState: statusSnapshot.kernel,
        supervisorState: statusSnapshot.supervisor,
        lineageSessionState: {
          lineage: snapshot.defaultLineage,
          purposeClass: snapshot.defaultPurposeClass,
          trajectoryId: snapshot.trajectoryId,
          workflowId: snapshot.workflowId,
          taskIds: snapshot.taskIds,
          subtaskIds: snapshot.subtaskIds,
          checkpointId: snapshot.checkpointId,
        },
        workflowGateState: {
          availableCommands: discoverSlashCommandBundles().map((bundle) => bundle.id),
        },
      }
      context.metadata({
        title: 'HiveMind runtime status',
        metadata: {
          trajectoryId: snapshot.trajectoryId,
          workflowId: snapshot.workflowId,
          supervisorStatus: statusSnapshot.supervisor.health.overallStatus,
        },
      })
      return renderToolResult(payload)
    },
  })
}

/**
 * Create the hivemind_runtime_command tool.
 * Executes a HiveMind hm-* command bundle against the active revamp runtime.
 */
export function createHivemindRuntimeCommandTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Execute a HiveMind hm-* command bundle against the active revamp runtime. ' +
      'Use this instead of manually creating .hivemind files or simulating bootstrap with bash.',
    args: {
      command: tool.schema.string().describe('The hm-* command to execute (e.g. hm-init, hm-doctor)'),
      arguments: tool.schema.string().optional().describe('Optional arguments string'),
      userMessage: tool.schema.string().optional().describe('User message context for execution'),
      preferredUserName: tool.schema.string().optional().describe('User display name'),
      language: tool.schema.string().optional().describe('Chat language preference'),
      artifactLanguage: tool.schema.string().optional().describe('Artifact/code language'),
      governanceMode: tool.schema.string().optional().describe('Governance strictness mode'),
      automationLevel: tool.schema.string().optional().describe('Automation level'),
      expertLevel: tool.schema.string().optional().describe('User expertise level'),
      outputStyle: tool.schema.string().optional().describe('Output formatting style'),
      presetId: tool.schema.enum(['guided-onboarding']).optional().describe('Control plane preset'),
      requestedSettingsGroups: tool.schema.array(
        tool.schema.enum(['identity-language', 'expertise-style', 'governance-automation']),
      ).optional().describe('Settings groups to request from the user'),
      intakeEvidence: tool.schema.object({
        source: tool.schema.enum(['question-tool', 'cli-flags', 'runtime-tool', 'preset']),
        questionnaireId: tool.schema.enum(['bootstrap-profile-v1', 'settings-profile-v1']),
        displayLanguage: tool.schema.string(),
        completedGroups: tool.schema.array(
          tool.schema.enum(['identity-language', 'expertise-style', 'governance-automation']),
        ),
        usedRecommendedPresetGroups: tool.schema.array(
          tool.schema.enum(['identity-language', 'expertise-style', 'governance-automation']),
        ).optional(),
      }).optional().describe('Evidence from intake questionnaire completion'),
    },
    async execute(args, context) {
      const snapshot = await loadRuntimeBindingsSnapshot(projectRoot)
      const bundle = findSlashCommandBundle(args.command)
      if (!bundle) {
        throw new Error(`Unknown HiveMind command: ${args.command}`)
      }

      const result = await executeSlashCommandBundle(bundle, {
        projectRoot,
        sessionId: context.sessionID,
        sessionScope: 'main',
        presetId: args.presetId,
        intakeEvidence: args.intakeEvidence,
        requestedSettingsGroups: args.requestedSettingsGroups,
        preferredUserName: args.preferredUserName,
        language: args.language,
        artifactLanguage: args.artifactLanguage,
        governanceMode: args.governanceMode,
        automationLevel: args.automationLevel,
        expertLevel: args.expertLevel,
        outputStyle: args.outputStyle,
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
      return renderToolResult(result)
    },
  })
}
