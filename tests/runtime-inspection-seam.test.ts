import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  bootstrapTrajectoryLedger,
  recordTrajectoryEvent,
} from '../src/core/trajectory/index.js'
import { buildRuntimeStatusSnapshot } from '../src/sdk-supervisor/runtime-status.js'
import type { RuntimeBindingsSnapshot } from '../src/shared/runtime-attachment.js'
import { saveRuntimeAttachmentSettings } from '../src/shared/runtime-attachment.js'
import { createHivemindRuntimeStatusTool } from '../src/tools/runtime/tools.js'

function createSnapshot(overrides: Partial<RuntimeBindingsSnapshot> = {}): RuntimeBindingsSnapshot {
  return {
    attachmentMode: 'local-worktree',
    defaultLineage: 'hivefiver',
    defaultPurposeClass: 'planning',
    runtimeAuthority: 'managed-sdk',
    runtimeInstanceId: 'runtime-123',
    serverBaseUrl: 'http://127.0.0.1:4096',
    preferredUserName: 'Operator',
    governanceMode: 'strict',
    automationLevel: 'guided',
    language: 'en',
    artifactLanguage: 'en',
    outputStyle: 'concise',
    expertLevel: 'advanced',
    branchFocus: 'runtime-inspection',
    guardrails: ['workflow-first'],
    facilitators: ['hm-status'],
    mcpReadiness: ['context7'],
    hivebrainDigest: ['runtime-status'],
    entryState: 'ready',
    qaState: 'passed',
    releaseState: 'released',
    hasRuntimeAttachment: true,
    hasHivemind: true,
    hivemindHealthy: true,
    hasWorkflow: true,
    profileComplete: true,
    missingProfileFields: [],
    interactiveBootstrapRequired: false,
    bootstrapProfile: {
      preferredUserName: 'Operator',
      chatLanguage: 'en',
      artifactLanguage: 'en',
      expertiseLevel: 'advanced',
      governanceMode: 'strict',
      automationLevel: 'guided',
      outputStyle: 'concise',
    },
    trajectoryId: 'traj-1',
    workflowId: 'wf-1',
    taskIds: ['task-1'],
    subtaskIds: ['subtask-1'],
    checkpointId: 'chk-1',
    ...overrides,
  }
}

function createToolContext(directory: string) {
  return {
    sessionID: 'ses-runtime-inspection',
    messageID: 'msg-runtime-inspection',
    agent: 'hivefiver',
    directory,
    worktree: directory,
    abort: new AbortController().signal,
    metadata() {
      return undefined
    },
    ask: async () => undefined,
  }
}

describe('runtime inspection seam', () => {
  it('exposes current runtime authority with a reduced workflow summary', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-inspection-'))

    try {
      await bootstrapTrajectoryLedger(projectRoot, {
        trajectoryId: 'traj-1',
        workflowId: 'wf-1',
        sessionId: 'ses-runtime-inspection',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        taskIds: ['task-1'],
        subtaskIds: ['subtask-1'],
      })

      const status = await buildRuntimeStatusSnapshot({
        projectRoot,
        sessionId: 'ses-runtime-inspection',
        agentId: 'hivefiver',
        snapshot: createSnapshot(),
      })

      assert.equal(status.runtimeAuthority, 'managed-sdk')
      assert.deepEqual(status.workflowSummary, {
        workflowId: 'wf-1',
        gateState: 'ready',
        currentTaskIds: ['task-1'],
        currentSubtaskIds: ['subtask-1'],
      })
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('exposes reduced recentEvents records instead of raw event payloads', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-events-'))

    try {
      await saveRuntimeAttachmentSettings(projectRoot, {
        runtimeAuthority: 'managed-sdk',
        runtimeInstanceId: 'runtime-123',
        serverBaseUrl: 'http://127.0.0.1:4096',
        preferredUserName: 'Operator',
      })
      await bootstrapTrajectoryLedger(projectRoot, {
        trajectoryId: 'traj-1',
        workflowId: 'wf-1',
        sessionId: 'ses-runtime-inspection',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        taskIds: ['task-1'],
        subtaskIds: ['subtask-1'],
      })
      await recordTrajectoryEvent(projectRoot, 'traj-1', {
        kind: 'summary',
        summary: 'Runtime status tool inspected active workflow.',
        createdAt: '2026-03-18T00:00:00.000Z',
      })

      const runtimeStatus = createHivemindRuntimeStatusTool(projectRoot)
      const payload = JSON.parse(await runtimeStatus.execute({}, createToolContext(projectRoot))) as {
        recentEvents: Array<Record<string, unknown>>
        workflowSummary: { workflowId: string }
      }

      assert.equal(payload.workflowSummary.workflowId, 'wf-1')
      assert.equal(payload.recentEvents.length > 0, true)
      assert.deepEqual(Object.keys(payload.recentEvents[0] ?? {}).sort(), [
        'eventKind',
        'recordedAt',
        'source',
        'summary',
      ])
      assert.equal(payload.recentEvents[0]?.summary, 'Runtime status tool inspected active workflow.')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
