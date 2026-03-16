import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { inspectTrajectoryLedger } from '../core/trajectory/index.js'
import { inspectWorkflowAuthority } from '../core/workflow-management/index.js'
import { getConfigPath } from './paths.js'

export type EntryKernelStateKind = 'uninitialized' | 'repair-required' | 'qa-pending' | 'ready' | 'blocked'
export type EntryKernelQaState = 'not-required' | 'pending' | 'passed' | 'failed' | 'blocked'
export type EntryKernelReleaseState = 'blocked' | 'released'
export type EntryKernelRecoveryAction = 'hm-init' | 'hm-doctor'

export interface EntryKernelStateV1 {
  version: 'v1'
  state: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: EntryKernelReleaseState
  reason: string
  profileValidated: boolean
  lastRecoveryAction?: EntryKernelRecoveryAction
  lastUpdatedAt: string
}

function createTimestamp(): string {
  return new Date().toISOString()
}

function getEntryKernelStatePath(projectRoot: string): string {
  return getConfigPath(projectRoot, 'entry-kernel-state.json')
}

function getRuntimeAttachmentPath(projectRoot: string): string {
  return getConfigPath(projectRoot, 'runtime-attachment.json')
}

function defaultEntryKernelState(): EntryKernelStateV1 {
  return {
    version: 'v1',
    state: 'uninitialized',
    qaState: 'blocked',
    releaseState: 'blocked',
    reason: 'runtime-uninitialized',
    profileValidated: false,
    lastUpdatedAt: createTimestamp(),
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function loadStoredEntryKernelState(projectRoot: string): Promise<EntryKernelStateV1> {
  const filePath = getEntryKernelStatePath(projectRoot)
  if (!(await fileExists(filePath))) {
    return defaultEntryKernelState()
  }

  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<EntryKernelStateV1>
    return {
      ...defaultEntryKernelState(),
      ...parsed,
      version: 'v1',
      lastUpdatedAt: parsed.lastUpdatedAt ?? createTimestamp(),
      profileValidated: parsed.profileValidated ?? false,
    }
  } catch {
    return {
      ...defaultEntryKernelState(),
      state: 'repair-required',
      reason: 'entry-kernel-state-corrupt',
    }
  }
}

export async function saveEntryKernelState(
  projectRoot: string,
  partial: Partial<EntryKernelStateV1>,
): Promise<EntryKernelStateV1> {
  const filePath = getEntryKernelStatePath(projectRoot)
  const next: EntryKernelStateV1 = {
    ...(await loadStoredEntryKernelState(projectRoot)),
    ...partial,
    version: 'v1',
    lastUpdatedAt: createTimestamp(),
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(next, null, 2))
  return next
}

export async function detectEntryKernelState(
  projectRoot: string,
  input: { workflowId?: string; taskIds?: string[] } = {},
): Promise<EntryKernelStateV1> {
  const stored = await loadStoredEntryKernelState(projectRoot)
  const hasRuntimeAttachment = await fileExists(getRuntimeAttachmentPath(projectRoot))
  const workflowAuthority = inspectWorkflowAuthority(projectRoot, {
    workflowId: input.workflowId,
    taskIds: input.taskIds,
    sessionScope: 'main',
  })
  const trajectoryInspection = inspectTrajectoryLedger(projectRoot)
  const runtimeHealthy = hasRuntimeAttachment && workflowAuthority.healthy && trajectoryInspection.healthy

  if (!hasRuntimeAttachment) {
    return {
      ...stored,
      state: 'uninitialized',
      qaState: 'blocked',
      releaseState: 'blocked',
      reason: 'runtime-uninitialized',
      profileValidated: false,
    }
  }

  if (!runtimeHealthy) {
    return {
      ...stored,
      state: 'repair-required',
      qaState: 'blocked',
      releaseState: 'blocked',
      reason: 'runtime-repair-required',
    }
  }

  if (stored.qaState === 'pending' || stored.state === 'qa-pending') {
    return {
      ...stored,
      state: 'qa-pending',
      releaseState: 'blocked',
      reason: stored.reason || 'qa-validation-required',
    }
  }

  if (stored.qaState === 'passed' && stored.releaseState === 'released') {
    return {
      ...stored,
      state: 'ready',
      reason: stored.reason || 'runtime-ready',
    }
  }

  return {
    ...stored,
    state: 'ready',
    qaState: stored.qaState === 'failed' ? 'failed' : 'passed',
    releaseState: 'released',
    reason: stored.reason || 'runtime-ready',
  }
}

export async function markEntryKernelQaPending(
  projectRoot: string,
  input: {
    reason: string
    recoveryAction?: EntryKernelRecoveryAction
    profileValidated: boolean
  },
): Promise<EntryKernelStateV1> {
  return saveEntryKernelState(projectRoot, {
    state: 'qa-pending',
    qaState: 'pending',
    releaseState: 'blocked',
    reason: input.reason,
    profileValidated: input.profileValidated,
    lastRecoveryAction: input.recoveryAction,
  })
}

export async function markEntryKernelReady(
  projectRoot: string,
  reason = 'runtime-ready',
): Promise<EntryKernelStateV1> {
  return saveEntryKernelState(projectRoot, {
    state: 'ready',
    qaState: 'passed',
    releaseState: 'released',
    reason,
  })
}
