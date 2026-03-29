import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { findSlashCommandBundle } from '../src/commands/slash-command/index.js'
import { bootstrapTrajectoryLedger } from '../src/core/index.js'
import { saveRuntimeAttachmentSettings } from '../src/features/runtime-entry/attachment.js'
import { loadCommandAsset } from '../src/features/runtime-entry/instruction-loader.js'
import { runSettingsHandler } from '../src/features/runtime-entry/settings.js'
import { saveEntryKernelState } from '../src/shared/entry-kernel-state.js'

async function bootstrapReadyRuntime(projectRoot: string): Promise<void> {
  await saveRuntimeAttachmentSettings(projectRoot, {
    runtimeAuthority: 'attached-sdk',
    runtimeInstanceId: 'rt_settings_dashboard',
    serverBaseUrl: 'http://localhost:4096',
    preferredUserName: 'Taylor',
    language: 'en',
    artifactLanguage: 'en',
    expertLevel: 'expert',
    governanceMode: 'strict',
    automationLevel: 'suggest',
    outputStyle: 'concise',
  })
  await bootstrapTrajectoryLedger(projectRoot, {
    trajectoryId: 'trj_settings_dashboard',
    workflowId: 'wf_settings_dashboard',
    sessionId: 'ses_settings_dashboard',
    lineage: 'hivefiver',
    purposeClass: 'planning',
    taskIds: ['task-settings-dashboard'],
  })
  await saveEntryKernelState(projectRoot, {
    state: 'ready',
    qaState: 'passed',
    releaseState: 'released',
    reason: 'runtime-ready',
    profileValidated: true,
  })
}

test('hm-settings question gate exposes a dashboard proof payload', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-settings-dashboard-gate-'))

  try {
    const bundle = findSlashCommandBundle('hm-settings')

    assert.ok(bundle)

    const asset = await loadCommandAsset('hm-settings')
    const result = await runSettingsHandler(bundle, asset, {
      projectRoot,
      sessionId: 'ses_gate_dashboard',
      sessionScope: 'main',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      activeAgent: bundle.agent,
      userMessage: 'Show hm-settings dashboard proof.',
    })

    const report = result.report as {
      dashboard?: {
        mode?: string
        pane40?: { gateSummary?: string }
        pane60?: { nextAction?: string, guidance?: string[] }
        rendered?: string
      }
    }

    assert.equal(result.executionMode, 'question-gate')
    assert.equal(result.closeoutStatus, 'blocked')
    assert.equal(report.dashboard?.mode, 'question-gate')
    assert.equal(report.dashboard?.pane40?.gateSummary, 'intake-required')
    assert.equal(report.dashboard?.pane60?.nextAction, 'answer-intake-gate')
    assert.match(report.dashboard?.rendered ?? '', /Hivefiver settings dashboard proof/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hm-settings ready path exposes runtime mirror plus changed settings proof', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-settings-dashboard-ready-'))

  try {
    await bootstrapReadyRuntime(projectRoot)
    const bundle = findSlashCommandBundle('hm-settings')

    assert.ok(bundle)

    const asset = await loadCommandAsset('hm-settings')
    const result = await runSettingsHandler(bundle, asset, {
      projectRoot,
      sessionId: 'ses_ready_dashboard',
      sessionScope: 'main',
      trajectoryId: 'trj_settings_dashboard',
      workflowId: 'wf_settings_dashboard',
      taskIds: ['task-settings-dashboard'],
      lineage: 'hivefiver',
      purposeClass: 'planning',
      activeAgent: bundle.agent,
      language: 'vi',
      intakeEvidence: {
        source: 'cli-flags',
        questionnaireId: 'settings-profile-v1',
        displayLanguage: 'vi',
        completedGroups: ['identity-language'],
      },
      requestedSettingsGroups: ['identity-language'],
      userMessage: 'Update language through hm-settings dashboard proof.',
    })

    const report = result.report as {
      changed_fields?: string[]
      dashboard?: {
        mode?: string
        pane40?: { gateSummary?: string, workflowId?: string }
        pane60?: { changedFields?: string[], nextAction?: string, currentSettings?: Record<string, unknown> }
        rendered?: string
      }
    }

    assert.equal(result.executionMode, 'handler')
    assert.equal(result.closeoutStatus, 'ready')
    assert.deepEqual(report.changed_fields, ['chatLanguage'])
    assert.equal(report.dashboard?.mode, 'settings')
    assert.equal(report.dashboard?.pane40?.gateSummary, 'ready')
    assert.equal(report.dashboard?.pane40?.workflowId, 'wf_settings_dashboard')
    assert.deepEqual(report.dashboard?.pane60?.changedFields, ['chatLanguage'])
    assert.equal(report.dashboard?.pane60?.nextAction, 'refresh-session-guidance')
    assert.equal(report.dashboard?.pane60?.currentSettings?.chatLanguage, 'vi')
    assert.match(report.dashboard?.rendered ?? '', /40 pane · runtime\/session mirror/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
