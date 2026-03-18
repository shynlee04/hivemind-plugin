/**
 * Runtime tools — extracted from inline definitions in opencode-plugin.ts (L4 cutover).
 *
 * These tools provide runtime status inspection and command execution
 * against the HiveMind revamp runtime.
 */

import { tool } from '@opencode-ai/plugin/tool'

import {
  buildHivemindRuntimeStatus,
  executeHivemindRuntimeCommand,
} from '../../features/runtime-observability/status.js'
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
      const result = await buildHivemindRuntimeStatus(projectRoot, {
        sessionID: context.sessionID,
        agent: context.agent,
      })
      context.metadata(result.metadata)
      const payload: HivemindRuntimeStatusPayload = result.payload
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
      const result = await executeHivemindRuntimeCommand(projectRoot, args, {
        sessionID: context.sessionID,
        agent: context.agent,
      })
      context.metadata(result.metadata)
      return renderToolResult(result.payload)
    },
  })
}
