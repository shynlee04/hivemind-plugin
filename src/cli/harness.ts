import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { getHivemindPath } from '../shared/paths.js'
import { loadRuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../tools/slash-command/index.js'
import { syncRuntimeSurface } from './runtime-assets.js'

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
  ].join('\n'))

  return {
    healthStatus,
    diagnosisTracking,
    metaState,
  }
}

/**
 * Validate runtime entry readiness for both the revamp control plane and OpenCode server.
 *
 * @param directory Project root containing the revamp runtime state.
 * @param options Optional server health overrides.
 * @returns Harness report and dated artifact locations.
 */
export async function runHarnessCommand(directory: string, options: HarnessOptions = {}): Promise<HarnessResult> {
  await syncRuntimeSurface(directory)
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
  })

  return {
    serverUrl,
    healthy: health.healthy,
    statusCode: health.statusCode,
    version: health.version,
    currentPhase: '00-control-plane',
    currentGate: 'Runtime entry attachment and CLI recovery',
    metaArtifacts,
    recommendedCommands: health.healthy
      ? ['opencode attach', 'hm-harness', 'hm-plan']
      : ['opencode serve', 'hm-doctor', 'hm-init'],
    commandResult,
  }
}
