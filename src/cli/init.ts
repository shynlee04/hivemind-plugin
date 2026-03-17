import { randomUUID } from 'node:crypto'

import type { KernelLineage, SessionScope } from '../context/prompt-packet/index.js'
import {
  buildNonInteractiveIntakeError,
  findControlPlanePrimitive,
  resolveControlPlaneIntakeGate,
  type ControlPlaneRecommendedPresetId,
} from '../control-plane/index.js'
import type { PurposeClass } from '../hooks/start-work/index.js'
import type { RuntimeAttachmentSettings } from '../shared/runtime-attachment.js'
import { buildRuntimeEntryDecision } from '../shared/contracts/runtime-status.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../commands/slash-command/index.js'
import { syncRuntimeSurface, type RuntimeSurfaceSyncResult } from './runtime-assets.js'

export interface InitOptions extends Partial<RuntimeAttachmentSettings> {
  presetId?: ControlPlaneRecommendedPresetId
  sessionId?: string
  sessionScope?: SessionScope
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  lineage?: KernelLineage
  purposeClass?: PurposeClass
  silent?: boolean
}

export interface InitProjectResult {
  sessionId: string
  trajectoryId: string
  workflowId: string
  sync: RuntimeSurfaceSyncResult
  closeoutStatus: 'open' | 'ready' | 'blocked' | 'qa-pending'
  nextCommand?: string
  recommendedCommands: string[]
  commandResult: Awaited<ReturnType<typeof executeSlashCommandBundle>>
}

function createRuntimeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

/**
 * Initialize the revamp runtime entry surfaces and bootstrap the trajectory control plane.
 *
 * @param directory Project root to initialize.
 * @param options Runtime defaults, bootstrap bindings, and non-interactive preset choices.
 * @returns Structured init result.
 */
export async function initProject(directory: string, options: InitOptions = {}): Promise<InitProjectResult> {
  const sessionId = options.sessionId ?? createRuntimeId('ses')
  const workflowId = options.workflowId ?? createRuntimeId('wf')
  const trajectoryId = options.trajectoryId ?? createRuntimeId('trj')
  const lineage = options.lineage ?? options.defaultLineage ?? 'hivefiver'
  const purposeClass = options.purposeClass ?? options.defaultPurposeClass ?? 'planning'
  const primitive = findControlPlanePrimitive('hm-init')
  if (!primitive) {
    throw new Error('Missing hm-init control-plane primitive.')
  }
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

  const bundle = findSlashCommandBundle('hm-init')
  if (!bundle) {
    throw new Error('Missing hm-init command bundle.')
  }
  const sync = await syncRuntimeSurface(directory)

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
      usedRecommendedPresetGroups: options.presetId ? ['identity-language', 'expertise-style', 'governance-automation'] : [],
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
  const entryDecision = buildRuntimeEntryDecision({
    closeoutStatus: commandResult.closeoutStatus,
    report: commandResult.report,
  })

  return {
    sessionId,
    trajectoryId,
    workflowId,
    sync,
    closeoutStatus: entryDecision.closeoutStatus,
    nextCommand: entryDecision.nextCommand,
    recommendedCommands: entryDecision.recommendedCommands,
    commandResult,
  }
}
