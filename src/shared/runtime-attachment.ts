import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import type { KernelLineage } from '../context/prompt-packet/prompt-packet-types.js'
import type { PurposeClass } from '../hooks/start-work/start-work-types.js'
import { inspectTrajectoryLedger, loadTrajectoryLedger } from '../core/trajectory/index.js'
import { inspectWorkflowAuthority } from '../core/workflow-management/index.js'
import { getConfigPath } from './paths.js'

export interface RuntimeAttachmentSettings {
  attachmentMode: 'local-worktree' | 'npm-package'
  defaultLineage: KernelLineage
  defaultPurposeClass: PurposeClass
  governanceMode: string
  automationLevel: string
  language: string
  artifactLanguage: string
  outputStyle: string
  expertLevel: string
  branchFocus: string
  guardrails: string[]
  facilitators: string[]
  mcpReadiness: string[]
  hivebrainDigest: string[]
  verificationContract?: string
  returnContract?: string
}

export interface RuntimeBindingsSnapshot extends RuntimeAttachmentSettings {
  hasHivemind: boolean
  hivemindHealthy: boolean
  hasWorkflow: boolean
  trajectoryId?: string
  workflowId?: string
  taskIds: string[]
  subtaskIds: string[]
  checkpointId?: string
}

function getRuntimeAttachmentSettingsPath(projectRoot: string): string {
  return getConfigPath(projectRoot, 'runtime-attachment.json')
}

function defaultRuntimeAttachmentSettings(): RuntimeAttachmentSettings {
  return {
    attachmentMode: 'local-worktree',
    defaultLineage: 'hivefiver',
    defaultPurposeClass: 'planning',
    governanceMode: 'assisted',
    automationLevel: 'assisted',
    language: 'en',
    artifactLanguage: 'en',
    outputStyle: 'concise',
    expertLevel: 'advanced',
    branchFocus: 'runtime-entry-attachment',
    guardrails: ['workflow-first', 'trajectory-aware', 'bounded-delegation'],
    facilitators: ['hm-init', 'hm-doctor', 'hm-harness'],
    mcpReadiness: ['context7', 'deepwiki', 'tavily', 'repomix'],
    hivebrainDigest: ['runtime-attachment-active'],
  }
}

function mergeStringArray(candidate: unknown, fallback: string[]): string[] {
  return Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === 'string')
    : fallback
}

export async function loadRuntimeAttachmentSettings(projectRoot: string): Promise<RuntimeAttachmentSettings> {
  const filePath = getRuntimeAttachmentSettingsPath(projectRoot)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<RuntimeAttachmentSettings>
    const defaults = defaultRuntimeAttachmentSettings()

    return {
      attachmentMode: parsed.attachmentMode === 'npm-package' ? 'npm-package' : defaults.attachmentMode,
      defaultLineage: parsed.defaultLineage === 'hiveminder' ? 'hiveminder' : defaults.defaultLineage,
      defaultPurposeClass: parsed.defaultPurposeClass ?? defaults.defaultPurposeClass,
      governanceMode: parsed.governanceMode ?? defaults.governanceMode,
      automationLevel: parsed.automationLevel ?? defaults.automationLevel,
      language: parsed.language ?? defaults.language,
      artifactLanguage: parsed.artifactLanguage ?? defaults.artifactLanguage,
      outputStyle: parsed.outputStyle ?? defaults.outputStyle,
      expertLevel: parsed.expertLevel ?? defaults.expertLevel,
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
  const filePath = getRuntimeAttachmentSettingsPath(projectRoot)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2))
  return merged
}

export async function loadRuntimeBindingsSnapshot(projectRoot: string): Promise<RuntimeBindingsSnapshot> {
  const settings = await loadRuntimeAttachmentSettings(projectRoot)
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

  return {
    ...settings,
    hasHivemind: inspection.exists || workflowAuthority.exists,
    hivemindHealthy: inspection.healthy && workflowAuthority.healthy,
    hasWorkflow: !!workflowId,
    trajectoryId: activeTrajectory?.id,
    workflowId,
    taskIds,
    subtaskIds: activeTrajectory?.subtaskIds ?? [],
    checkpointId,
  }
}
