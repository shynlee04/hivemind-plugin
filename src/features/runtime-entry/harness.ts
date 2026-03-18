import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { loadTrajectoryLedger } from '../../core/index.js'
import { createPlanningGovernanceProjection } from '../../governance/index.js'
import { assessRecoveryState, createRecoveryCheckpoint } from '../../recovery/index.js'
import { markEntryKernelReady } from '../../shared/entry-kernel-state.js'
import { buildRuntimeEntryDecision } from '../../shared/contracts/runtime-status.js'
import { getHivemindPath } from '../../shared/paths.js'
import { loadRuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import type {
  CommandExecutionInput,
  CommandExecutionResult,
  SlashCommandBundle,
} from '../../commands/slash-command/command-types.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../../commands/slash-command/index.js'
import type { LoadedCommandAsset } from '../../hooks/runtime-bridge/instruction-loader.js'

import { resolveEntityBindings, resolveRuntimeIds } from './handler-shared.js'

export interface HarnessOptions {
  serverUrl?: string
  timeoutMs?: number
}

export interface HarnessResult {
  serverUrl: string
  healthy: boolean
  statusCode: number | null
  version: string | null
  currentPhase: string
  currentGate: string
  metaArtifacts: {
    healthStatus: string
    diagnosisTracking: string
    metaState: string
  }
  recommendedCommands: string[]
  commandResult: Awaited<ReturnType<typeof executeSlashCommandBundle>>
}

const runtimeEntryRecoveryCommands = ['hm-init', 'hm-doctor'] as const

function formatDateStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

async function fetchHealth(serverUrl: string, timeoutMs: number): Promise<{
  healthy: boolean
  statusCode: number | null
  version: string | null
}> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(new URL('/global/health', serverUrl), {
      method: 'GET',
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({})) as { healthy?: boolean; version?: string }
    return {
      healthy: response.ok && payload.healthy === true,
      statusCode: response.status,
      version: typeof payload.version === 'string' ? payload.version : null,
    }
  } catch {
    return {
      healthy: false,
      statusCode: null,
      version: null,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function writeHarnessArtifacts(
  directory: string,
  result: {
    serverUrl: string
    health: { healthy: boolean; statusCode: number | null; version: string | null }
    snapshot: Awaited<ReturnType<typeof loadRuntimeBindingsSnapshot>>
    commandResult: Awaited<ReturnType<typeof executeSlashCommandBundle>>
    runtimeEntryRecoveryCommands: readonly string[]
  },
): Promise<HarnessResult['metaArtifacts']> {
  const dateStamp = formatDateStamp()
  const baseDir = path.join(getHivemindPath(directory), 'project', 'planning', 'runtime-entry')
  await fs.mkdir(baseDir, { recursive: true })

  const healthStatus = path.join(baseDir, `health-status-${dateStamp}.md`)
  const diagnosisTracking = path.join(baseDir, `diagnosis-tracking-${dateStamp}.md`)
  const metaState = path.join(baseDir, `meta-state-${dateStamp}.md`)

  await fs.writeFile(healthStatus, [
    '# Health Status',
    '',
    `- Server URL: ${result.serverUrl}`,
    `- Healthy: ${result.health.healthy ? 'yes' : 'no'}`,
    `- Status code: ${result.health.statusCode ?? 'unreachable'}`,
    `- OpenCode version: ${result.health.version ?? 'unknown'}`,
  ].join('\n'))

  await fs.writeFile(diagnosisTracking, [
    '# Diagnosis Tracking',
    '',
    `- Trajectory: ${result.snapshot.trajectoryId ?? '(none)'}`,
    `- Workflow: ${result.snapshot.workflowId ?? '(none)'}`,
    `- Checkpoint: ${result.snapshot.checkpointId ?? '(none)'}`,
    `- Harness closeout: ${result.commandResult.closeoutStatus ?? 'open'}`,
  ].join('\n'))

  await fs.writeFile(metaState, [
    '# Meta State',
    '',
    `- Attachment mode: ${result.snapshot.attachmentMode}`,
    `- Governance mode: ${result.snapshot.governanceMode}`,
    `- Automation level: ${result.snapshot.automationLevel}`,
    `- Output style: ${result.snapshot.outputStyle}`,
    `- Runtime entry recovery commands: ${result.runtimeEntryRecoveryCommands.join(', ')}`,
  ].join('\n'))

  return {
    healthStatus,
    diagnosisTracking,
    metaState,
  }
}

export async function runHarnessCommand(directory: string, options: HarnessOptions = {}): Promise<HarnessResult> {
  const snapshot = await loadRuntimeBindingsSnapshot(directory)
  const bundle = findSlashCommandBundle('hm-harness')
  if (!bundle) {
    throw new Error('Missing hm-harness command bundle.')
  }

  const commandResult = await executeSlashCommandBundle(bundle, {
    projectRoot: directory,
    sessionId: `ses_harness_${Date.now()}`,
    sessionScope: 'main',
    trajectoryId: snapshot.trajectoryId,
    workflowId: snapshot.workflowId,
    taskIds: snapshot.taskIds,
    subtaskIds: snapshot.subtaskIds,
    lineage: snapshot.defaultLineage,
    purposeClass: snapshot.defaultPurposeClass,
    userMessage: 'validate runtime entry attachment and harness readiness',
  })

  const serverUrl = options.serverUrl ?? process.env.OPENCODE_SERVER_URL ?? 'http://127.0.0.1:4096'
  const health = await fetchHealth(serverUrl, options.timeoutMs ?? 2500)
  const metaArtifacts = await writeHarnessArtifacts(directory, {
    serverUrl,
    health,
    snapshot,
    commandResult,
    runtimeEntryRecoveryCommands,
  })
  const entryDecision = buildRuntimeEntryDecision({
    closeoutStatus: commandResult.closeoutStatus,
    report: commandResult.report,
    serverHealthy: health.healthy,
  })

  return {
    serverUrl,
    healthy: health.healthy,
    statusCode: health.statusCode,
    version: health.version,
    currentPhase: '00-control-plane',
    currentGate: 'Runtime entry attachment and CLI recovery',
    metaArtifacts,
    recommendedCommands: entryDecision.recommendedCommands,
    commandResult,
  }
}

export async function runHarnessHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const trajectoryLedger = await loadTrajectoryLedger(input.projectRoot)
  const ids = resolveRuntimeIds(input, trajectoryLedger.activeTrajectoryId)
  const assessment = await assessRecoveryState(input.projectRoot, {
    sessionScope: input.sessionScope,
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    taskIds: input.taskIds ?? [],
    purposeClass: input.purposeClass,
    lineage: input.lineage,
  })
  const checkpoint = await createRecoveryCheckpoint(input.projectRoot, {
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
    source: `command:${bundle.id}`,
    resumeTarget: assessment.status === 'healthy' ? 'command:hm-plan' : 'command:hm-doctor',
  })
  const projection = await createPlanningGovernanceProjection(input.projectRoot, ids)
  if (assessment.status === 'healthy') {
    await markEntryKernelReady(input.projectRoot, 'harness-qa-passed')
  }

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      status: assessment.status === 'healthy' ? 'ready' : 'blocked',
      entry_state: assessment.status === 'healthy' ? 'ready' : 'blocked',
      qa_state: assessment.status === 'healthy' ? 'passed' : 'failed',
      readiness: assessment.status === 'healthy',
      integration_gaps: assessment.failureClasses,
      approved_workflow_chain: assessment.status === 'healthy' ? bundle.workflowChain : [],
      active_trajectory: trajectoryLedger.activeTrajectoryId,
      checkpoint_id: checkpoint.id,
      planning_projection: projection.filePath,
      next_command: assessment.status === 'healthy'
        ? undefined
        : assessment.failureClasses.includes('missing-hivemind')
          ? 'hm-init'
          : 'hm-doctor',
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
    },
    entityBindings: {
      ...resolveEntityBindings(input),
      trajectoryId: ids.trajectoryId,
      workflowId: ids.workflowId,
    },
    stateTransitions: assessment.status === 'healthy'
      ? ['recovery-spine-ready', 'recovery-checkpoint-created', 'planning-projection-created', 'entry-kernel-ready']
      : ['recovery-spine-blocked', 'recovery-checkpoint-created', 'planning-projection-created'],
    artifactRefs: [projection.filePath],
    closeoutStatus: assessment.status === 'healthy' ? 'ready' : 'blocked',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}
