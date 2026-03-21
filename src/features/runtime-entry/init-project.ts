import { findControlPlanePrimitive } from '../../control-plane/control-plane-registry.js'
import {
  buildNonInteractiveIntakeError,
  resolveControlPlaneIntakeGate,
} from '../../control-plane/control-plane-intake.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../../commands/slash-command/index.js'

import { buildInitReport, createRuntimeId } from './init.helpers.js'
import { buildRuntimeEntryDecision } from '../../shared/contracts/runtime-status.js'
import type { InitOptions, InitProjectResult } from './init.types.js'

/**
 * Initialize a HiveMind project/runtime session.
 *
 * This is the high-level entry point for starting a new HiveMind runtime.
 * It resolves intake gates, executes the hm-init command bundle, and returns
 * the initialization result with runtime identity and readiness signals.
 *
 * @param directory - Project root directory
 * @param options - Initialization options (sessionId, workflowId, etc.)
 * @returns Promise resolving to InitProjectResult with session details
 * @throws Error if hm-init primitive or command bundle is missing
 *
 * @example
 * const result = await initProject('/path/to/project', {
 *   sessionId: 'my-session',
 *   lineage: 'hiveminder',
 *   purposeClass: 'planning'
 * })
 */
export async function initProject(
  directory: string,
  options: InitOptions = {},
): Promise<InitProjectResult> {
  const sessionId = options.sessionId ?? createRuntimeId('ses')
  const workflowId = options.workflowId ?? createRuntimeId('wf')
  const trajectoryId = options.trajectoryId ?? createRuntimeId('trj')
  const lineage = options.lineage ?? options.defaultLineage ?? 'hivefiver'
  const purposeClass = options.purposeClass ?? options.defaultPurposeClass ?? 'planning'

  // Resolve the hm-init primitive for intake gate checking
  const primitive = findControlPlanePrimitive('hm-init')
  if (!primitive) {
    throw new Error('Missing hm-init control-plane primitive.')
  }

  // Check intake gates - throw if non-interactive mode would fail
  const intakeResolution = resolveControlPlaneIntakeGate(primitive, {
    projectRoot: directory,
    sessionId,
    sessionScope: options.sessionScope ?? 'main',
    presetId: options.presetId,
    preferredUserName: options.preferredUserName,
    language: options.language,
    artifactLanguage: options.artifactLanguage,
    governanceMode: options.governanceMode,
    automationLevel: options.automationLevel,
    expertLevel: options.expertLevel,
    outputStyle: options.outputStyle,
    userMessage: 'initialize hivemind runtime entry surfaces',
  })
  if (intakeResolution.gate) {
    throw new Error(buildNonInteractiveIntakeError(primitive, intakeResolution.gate))
  }

  // Find and execute the hm-init command bundle
  const bundle = findSlashCommandBundle('hm-init')
  if (!bundle) {
    throw new Error('Missing hm-init command bundle.')
  }

  const commandResult = await executeSlashCommandBundle(bundle, {
    projectRoot: directory,
    sessionId,
    sessionScope: options.sessionScope ?? 'main',
    presetId: options.presetId,
    intakeEvidence: {
      source: options.presetId ? 'preset' : 'cli-flags',
      questionnaireId: 'bootstrap-profile-v1',
      displayLanguage: options.language ?? 'en',
      completedGroups: ['identity-language', 'expertise-style', 'governance-automation'],
      usedRecommendedPresetGroups: options.presetId
        ? ['identity-language', 'expertise-style', 'governance-automation']
        : [],
    },
    lineage,
    purposeClass,
    trajectoryId,
    workflowId,
    taskIds: options.taskIds,
    subtaskIds: options.subtaskIds,
    preferredUserName: options.preferredUserName,
    language: options.language,
    artifactLanguage: options.artifactLanguage,
    governanceMode: options.governanceMode,
    automationLevel: options.automationLevel,
    expertLevel: options.expertLevel,
    outputStyle: options.outputStyle,
    userMessage: 'initialize hivemind runtime entry surfaces',
  })

  // Build entry decision and final report
  const entryDecision = buildRuntimeEntryDecision({
    closeoutStatus: commandResult.closeoutStatus,
    report: commandResult.report,
  })
  const report = buildInitReport({
    closeoutStatus: entryDecision.closeoutStatus,
    report: commandResult.report,
  })

  return {
    sessionId,
    trajectoryId,
    workflowId,
    closeoutStatus: entryDecision.closeoutStatus,
    nextCommand: entryDecision.nextCommand,
    recommendedCommands: entryDecision.recommendedCommands,
    runtime_identity: report.runtime_identity,
    readiness_signal: report.readiness_signal,
    commandResult: {
      ...commandResult,
      report,
    },
  }
}
