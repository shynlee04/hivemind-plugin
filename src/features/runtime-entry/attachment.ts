import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import type { KernelLineage } from '../../context/prompt-packet/prompt-packet-types.js'
import type { PurposeClass } from '../../features/session-entry/start-work-types.js'
import { inspectTrajectoryLedger, loadTrajectoryLedger } from '../../core/trajectory/index.js'
import { inspectWorkflowAuthority } from '../../core/workflow-management/index.js'
import { detectEntryKernelState, type EntryKernelQaState, type EntryKernelStateKind } from '../../shared/entry-kernel-state.js'
import { getConfigPath } from '../../shared/paths.js'
import {
  createBootstrapProfile,
  normalizePreferredUserName,
  type BootstrapProfile,
} from '../../shared/bootstrap-profile.js'
import { CONTROL_PLANE_PROFILE_FIELDS } from '../../control-plane/control-plane-intake.js'
import type { ControlPlaneProfileFieldId } from '../../control-plane/index.js'

/** Core attachment identity */
export interface AttachmentCore {
  attachmentMode: 'local-worktree' | 'npm-package'
  defaultLineage: KernelLineage
  defaultPurposeClass: PurposeClass
}

export type RuntimeAuthority = 'managed-sdk' | 'attached-sdk' | 'none'

/** Persisted runtime authority identity */
export interface AttachmentRuntimeAuthority {
  runtimeAuthority: RuntimeAuthority
  runtimeInstanceId?: string
  serverBaseUrl?: string
}

/** User profile within attachment */
export interface AttachmentProfile {
  preferredUserName?: string
  governanceMode: string
  automationLevel: string
  language: string
  artifactLanguage: string
  outputStyle: string
  expertLevel: string
}

/** Feature arrays and contracts */
export interface AttachmentFeatures {
  branchFocus: string
  guardrails: string[]
  facilitators: string[]
  mcpReadiness: string[]
  hivebrainDigest: string[]
  verificationContract?: string
  returnContract?: string
}

/** Full runtime attachment settings — composed via intersection for backward compatibility */
export type RuntimeAttachmentSettings = AttachmentCore
  & AttachmentRuntimeAuthority
  & AttachmentProfile
  & AttachmentFeatures

export interface RuntimeBindingsSnapshot extends RuntimeAttachmentSettings {
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: 'blocked' | 'released'
  hasRuntimeAttachment: boolean
  hasHivemind: boolean
  hivemindHealthy: boolean
  hasWorkflow: boolean
  profileComplete: boolean
  missingProfileFields: ControlPlaneProfileFieldId[]
  interactiveBootstrapRequired: boolean
  bootstrapProfile: BootstrapProfile
  trajectoryId?: string
  workflowId?: string
  taskIds: string[]
  subtaskIds: string[]
  checkpointId?: string
}

export interface RuntimeAttachmentEntryDefaults {
  attachmentMode: 'local-worktree' | 'npm-package'
  defaultLineage: KernelLineage
  defaultPurposeClass: PurposeClass
  branchFocus: string
  guardrails: string[]
  facilitators: string[]
  mcpReadiness: string[]
  hivebrainDigest: string[]
  verificationContract?: string
  returnContract?: string
}

export interface RuntimeAttachmentEntryAuthority {
  runtimeAuthority: RuntimeAuthority
  runtimeInstanceId?: string
  serverBaseUrl?: string
}

export interface RuntimeAttachmentEntryProfile {
  preferredUserName?: string
  governanceMode: string
  automationLevel: string
  language: string
  artifactLanguage: string
  outputStyle: string
  expertLevel: string
}

export interface RuntimeAttachmentEntryBindings {
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: 'blocked' | 'released'
  hasRuntimeAttachment: boolean
  hasHivemind: boolean
  hivemindHealthy: boolean
  hasWorkflow: boolean
  profileComplete: boolean
  missingProfileFields: ControlPlaneProfileFieldId[]
  interactiveBootstrapRequired: boolean
  trajectoryId?: string
  workflowId?: string
  taskIds: string[]
  subtaskIds: string[]
  checkpointId?: string
}

export interface RuntimeAttachmentEntryKernel {
  defaults: RuntimeAttachmentEntryDefaults
  authority: RuntimeAttachmentEntryAuthority
  profile: RuntimeAttachmentEntryProfile
  bindings: RuntimeAttachmentEntryBindings
}

export interface RuntimeAttachmentEntryKernelSource extends Partial<RuntimeBindingsSnapshot> {
  taskIds?: string[]
  subtaskIds?: string[]
}

function getRuntimeAttachmentSettingsPath(projectRoot: string): string {
  return getConfigPath(projectRoot, 'runtime-attachment.json')
}

function defaultRuntimeAttachmentSettings(): RuntimeAttachmentSettings {
  const profile = createBootstrapProfile({})

  return {
    attachmentMode: 'local-worktree',
    defaultLineage: 'hivefiver',
    defaultPurposeClass: 'planning',
    runtimeAuthority: 'none',
    runtimeInstanceId: undefined,
    serverBaseUrl: undefined,
    preferredUserName: undefined,
    governanceMode: profile.governanceMode,
    automationLevel: profile.automationLevel,
    language: profile.chatLanguage,
    artifactLanguage: profile.artifactLanguage,
    outputStyle: profile.outputStyle,
    expertLevel: profile.expertiseLevel,
    branchFocus: 'runtime-entry-attachment',
    guardrails: ['workflow-first', 'trajectory-aware', 'bounded-delegation'],
    facilitators: ['hm-init', 'hm-doctor', 'hm-harness'],
    mcpReadiness: ['context7', 'deepwiki', 'tavily', 'repomix'],
    hivebrainDigest: ['runtime-attachment-active'],
  }
}

function normalizeRuntimeAuthority(candidate: unknown): RuntimeAuthority {
  return candidate === 'managed-sdk' || candidate === 'attached-sdk'
    ? candidate
    : 'none'
}

function normalizeOptionalString(candidate: unknown): string | undefined {
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined
}

function mergeStringArray(candidate: unknown, fallback: string[]): string[] {
  return Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === 'string')
    : fallback
}

export function buildRuntimeAttachmentEntryKernel(
  source: RuntimeAttachmentEntryKernelSource = {},
): RuntimeAttachmentEntryKernel {
  const defaults = defaultRuntimeAttachmentSettings()
  const profile = createBootstrapProfile({
    preferredUserName: source.preferredUserName,
    language: source.language ?? defaults.language,
    artifactLanguage: source.artifactLanguage ?? defaults.artifactLanguage,
    expertLevel: source.expertLevel ?? defaults.expertLevel,
    governanceMode: source.governanceMode ?? defaults.governanceMode,
    automationLevel: source.automationLevel ?? defaults.automationLevel,
    outputStyle: source.outputStyle ?? defaults.outputStyle,
  })
  const profileComplete = source.profileComplete ?? false

  return {
    defaults: {
      attachmentMode: source.attachmentMode === 'npm-package' ? 'npm-package' : defaults.attachmentMode,
      defaultLineage: source.defaultLineage === 'hiveminder' ? 'hiveminder' : defaults.defaultLineage,
      defaultPurposeClass: source.defaultPurposeClass ?? defaults.defaultPurposeClass,
      branchFocus: source.branchFocus ?? defaults.branchFocus,
      guardrails: mergeStringArray(source.guardrails, defaults.guardrails),
      facilitators: mergeStringArray(source.facilitators, defaults.facilitators),
      mcpReadiness: mergeStringArray(source.mcpReadiness, defaults.mcpReadiness),
      hivebrainDigest: mergeStringArray(source.hivebrainDigest, defaults.hivebrainDigest),
      verificationContract: source.verificationContract,
      returnContract: source.returnContract,
    },
    profile: {
      preferredUserName: profile.preferredUserName,
      governanceMode: profile.governanceMode,
      automationLevel: profile.automationLevel,
      language: profile.chatLanguage,
      artifactLanguage: profile.artifactLanguage,
      outputStyle: profile.outputStyle,
      expertLevel: profile.expertiseLevel,
    },
    authority: {
      runtimeAuthority: normalizeRuntimeAuthority(source.runtimeAuthority),
      runtimeInstanceId: normalizeOptionalString(source.runtimeInstanceId),
      serverBaseUrl: normalizeOptionalString(source.serverBaseUrl),
    },
    bindings: {
      entryState: source.entryState ?? 'uninitialized',
      qaState: source.qaState ?? 'blocked',
      releaseState: source.releaseState ?? 'blocked',
      hasRuntimeAttachment: source.hasRuntimeAttachment ?? false,
      hasHivemind: source.hasHivemind ?? false,
      hivemindHealthy: source.hivemindHealthy ?? false,
      hasWorkflow: source.hasWorkflow ?? false,
      profileComplete,
      missingProfileFields: profileComplete ? [] : [...CONTROL_PLANE_PROFILE_FIELDS],
      interactiveBootstrapRequired: source.interactiveBootstrapRequired ?? !profileComplete,
      trajectoryId: source.trajectoryId,
      workflowId: source.workflowId,
      taskIds: source.taskIds ?? [],
      subtaskIds: source.subtaskIds ?? [],
      checkpointId: source.checkpointId,
    },
  }
}

export async function loadRuntimeAttachmentSettings(projectRoot: string): Promise<RuntimeAttachmentSettings> {
  const filePath = getRuntimeAttachmentSettingsPath(projectRoot)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<RuntimeAttachmentSettings>
    const defaults = defaultRuntimeAttachmentSettings()
    const profile = createBootstrapProfile({
      preferredUserName: parsed.preferredUserName,
      language: parsed.language ?? defaults.language,
      artifactLanguage: parsed.artifactLanguage ?? defaults.artifactLanguage,
      expertLevel: parsed.expertLevel ?? defaults.expertLevel,
      governanceMode: parsed.governanceMode ?? defaults.governanceMode,
      automationLevel: parsed.automationLevel ?? defaults.automationLevel,
      outputStyle: parsed.outputStyle ?? defaults.outputStyle,
    })

    return {
      attachmentMode: parsed.attachmentMode === 'npm-package' ? 'npm-package' : defaults.attachmentMode,
      defaultLineage: parsed.defaultLineage === 'hiveminder' ? 'hiveminder' : defaults.defaultLineage,
      defaultPurposeClass: parsed.defaultPurposeClass ?? defaults.defaultPurposeClass,
      runtimeAuthority: normalizeRuntimeAuthority(parsed.runtimeAuthority),
      runtimeInstanceId: normalizeOptionalString(parsed.runtimeInstanceId),
      serverBaseUrl: normalizeOptionalString(parsed.serverBaseUrl),
      preferredUserName: normalizePreferredUserName(parsed.preferredUserName),
      governanceMode: profile.governanceMode,
      automationLevel: profile.automationLevel,
      language: profile.chatLanguage,
      artifactLanguage: profile.artifactLanguage,
      outputStyle: profile.outputStyle,
      expertLevel: profile.expertiseLevel,
      branchFocus: parsed.branchFocus ?? defaults.branchFocus,
      guardrails: mergeStringArray(parsed.guardrails, defaults.guardrails),
      facilitators: mergeStringArray(parsed.facilitators, defaults.facilitators),
      mcpReadiness: mergeStringArray(parsed.mcpReadiness, defaults.mcpReadiness),
      hivebrainDigest: mergeStringArray(parsed.hivebrainDigest, defaults.hivebrainDigest),
      verificationContract: parsed.verificationContract,
      returnContract: parsed.returnContract,
    }
  } catch {
    return defaultRuntimeAttachmentSettings()
  }
}

export async function saveRuntimeAttachmentSettings(
  projectRoot: string,
  partial: Partial<RuntimeAttachmentSettings>,
): Promise<RuntimeAttachmentSettings> {
  const merged = {
    ...(await loadRuntimeAttachmentSettings(projectRoot)),
    ...partial,
  }
  const normalizedProfile = createBootstrapProfile({
    preferredUserName: merged.preferredUserName,
    language: merged.language,
    artifactLanguage: merged.artifactLanguage,
    expertLevel: merged.expertLevel,
    governanceMode: merged.governanceMode,
    automationLevel: merged.automationLevel,
    outputStyle: merged.outputStyle,
  })
  const filePath = getRuntimeAttachmentSettingsPath(projectRoot)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const normalizedSettings: RuntimeAttachmentSettings = {
    ...merged,
    runtimeAuthority: normalizeRuntimeAuthority(merged.runtimeAuthority),
    runtimeInstanceId: normalizeOptionalString(merged.runtimeInstanceId),
    serverBaseUrl: normalizeOptionalString(merged.serverBaseUrl),
    preferredUserName: normalizedProfile.preferredUserName,
    governanceMode: normalizedProfile.governanceMode,
    automationLevel: normalizedProfile.automationLevel,
    language: normalizedProfile.chatLanguage,
    artifactLanguage: normalizedProfile.artifactLanguage,
    outputStyle: normalizedProfile.outputStyle,
    expertLevel: normalizedProfile.expertiseLevel,
  }
  await fs.writeFile(filePath, JSON.stringify(normalizedSettings, null, 2))
  return normalizedSettings
}

export async function runtimeAttachmentSettingsExist(projectRoot: string): Promise<boolean> {
  try {
    await fs.access(getRuntimeAttachmentSettingsPath(projectRoot))
    return true
  } catch {
    return false
  }
}

export async function saveBootstrapRuntimeAttachmentSettings(
  projectRoot: string,
  partial: Partial<RuntimeAttachmentSettings>,
): Promise<RuntimeAttachmentSettings> {
  if (await runtimeAttachmentSettingsExist(projectRoot)) {
    return loadRuntimeAttachmentSettings(projectRoot)
  }

  return saveRuntimeAttachmentSettings(projectRoot, partial)
}

export async function loadRuntimeBindingsSnapshot(projectRoot: string): Promise<RuntimeBindingsSnapshot> {
  const settings = await loadRuntimeAttachmentSettings(projectRoot)
  const hasRuntimeAttachment = await runtimeAttachmentSettingsExist(projectRoot)
  const entryKernelState = await detectEntryKernelState(projectRoot)

  const bootstrapProfile = createBootstrapProfile({
    preferredUserName: settings.preferredUserName,
    language: settings.language,
    artifactLanguage: settings.artifactLanguage,
    expertLevel: settings.expertLevel,
    governanceMode: settings.governanceMode,
    automationLevel: settings.automationLevel,
    outputStyle: settings.outputStyle,
  })
  const ledger = await loadTrajectoryLedger(projectRoot)
  const inspection = inspectTrajectoryLedger(projectRoot)
  const activeTrajectory = ledger.trajectories.find((item) => item.id === ledger.activeTrajectoryId)
    ?? ledger.trajectories.find((item) => item.id === ledger.lastClosedTrajectoryId)
    ?? ledger.trajectories.at(-1)
  const workflowId = activeTrajectory?.workflowIds.at(-1)
  const taskIds = activeTrajectory?.taskIds ?? []
  const workflowAuthority = inspectWorkflowAuthority(projectRoot, {
    workflowId,
    taskIds,
    sessionScope: 'main',
    purposeClass: activeTrajectory?.purposeClass ?? settings.defaultPurposeClass,
    lineage: activeTrajectory?.lineage ?? settings.defaultLineage,
  })
  const checkpointId = activeTrajectory?.checkpointIds.at(-1)
  const profileComplete = hasRuntimeAttachment && entryKernelState.profileValidated
  const missingProfileFields = profileComplete ? [] : [...CONTROL_PLANE_PROFILE_FIELDS]
  const interactiveBootstrapRequired = !profileComplete

  return {
    ...settings,
    entryState: entryKernelState.state,
    qaState: entryKernelState.qaState,
    releaseState: entryKernelState.releaseState,
    hasRuntimeAttachment,
    hasHivemind: inspection.exists || workflowAuthority.exists,
    hivemindHealthy: inspection.healthy && workflowAuthority.healthy,
    hasWorkflow: !!workflowId,
    profileComplete,
    missingProfileFields,
    interactiveBootstrapRequired,
    bootstrapProfile,
    trajectoryId: activeTrajectory?.id,
    workflowId,
    taskIds,
    subtaskIds: activeTrajectory?.subtaskIds ?? [],
    checkpointId,
  }
}
