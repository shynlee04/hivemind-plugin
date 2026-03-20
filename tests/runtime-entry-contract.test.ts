import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { executeSlashCommandBundle, findSlashCommandBundle } from '../src/commands/slash-command/index.js'
import { bootstrapTrajectoryLedger } from '../src/core/index.js'
import { createWorkflowTask } from '../src/core/workflow-management/index.js'
import { ContractStore } from '../src/features/agent-work-contract/engine/contract-store.js'
import { initProject, runDoctorCommand } from '../src/features/runtime-entry/index.js'
import { saveRuntimeAttachmentSettings } from '../src/features/runtime-entry/attachment.js'
import { loadCommandAsset } from '../src/features/runtime-entry/instruction-loader.js'
import { loadWorkflowContinuityTransactionForExecution } from '../src/features/runtime-entry/workflow-continuity.js'
import { markEntryKernelReady } from '../src/shared/entry-kernel-state.js'

const runtimeEntryFiles = [
  'src/features/runtime-entry/settings.ts',
  'src/features/runtime-entry/init.ts',
  'src/features/runtime-entry/harness.ts',
  'src/features/runtime-entry/handler-shared.ts',
  'src/features/runtime-entry/doctor.ts',
  'src/features/runtime-entry/command.ts',
] as const

async function bootstrapReadyRuntime(projectRoot: string): Promise<void> {
  await saveRuntimeAttachmentSettings(projectRoot, {
    runtimeAuthority: 'attached-sdk',
    runtimeInstanceId: 'rt_test',
    serverBaseUrl: 'http://localhost:4096',
    preferredUserName: 'Taylor',
  })
  await bootstrapTrajectoryLedger(projectRoot, {
    trajectoryId: 'traj_123',
    workflowId: 'wf_123',
    sessionId: 'ses_123',
    lineage: 'hivefiver',
    purposeClass: 'planning',
    taskIds: ['task-1'],
  })
  await markEntryKernelReady(projectRoot)
}

describe('runtime entry loader authority', () => {
  it('loads command assets from the feature-owned runtime entry loader', async () => {
    const asset = await loadCommandAsset('hm-init')

    assert.equal(asset.fileName, 'hm-init.md')
    assert.equal(typeof asset.frontmatter, 'object')
    assert.ok(asset.body.length > 0)
    assert.ok(asset.raw.includes('hm-init'))
  })

  it('points runtime-entry consumers at the feature-owned loader path', async () => {
    const contents = await Promise.all(runtimeEntryFiles.map((file) => readFile(file, 'utf8')))

    for (const source of contents) {
      assert.equal(source.includes('hooks/runtime-bridge/instruction-loader'), false)
      assert.equal(source.includes('./instruction-loader.js'), true)
    }
  })

  it('hm-plan creates workflow continuity and hm-implement reuses it across changed session ids', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-contract-'))

    try {
      await bootstrapReadyRuntime(projectRoot)
      createWorkflowTask(projectRoot, {
        workflowId: 'wf_123',
        taskId: 'task-2',
        title: 'task-2',
      })
      const planBundle = findSlashCommandBundle('hm-plan')
      const implementBundle = findSlashCommandBundle('hm-implement')

      assert.ok(planBundle)
      assert.ok(implementBundle)

      const planResult = await executeSlashCommandBundle(planBundle, {
        projectRoot,
        sessionId: 'ses_123',
        sessionScope: 'main',
        trajectoryId: 'traj_123',
        workflowId: 'wf_123',
        taskIds: ['task-1'],
        lineage: 'hivefiver',
        purposeClass: 'planning',
        activeAgent: 'runtime-agent',
        userMessage: 'Create the implementation plan contract linkage.',
      })

      const store = new ContractStore(projectRoot)
      const afterPlan = await store.list('ses_123')
      const continuityAfterPlan = await loadWorkflowContinuityTransactionForExecution(projectRoot, {
        workflowId: 'wf_123',
        trajectoryId: 'traj_123',
        sessionId: 'ses_123',
      })

      assert.equal(planResult.executionMode, 'handler')
      assert.equal(afterPlan.length, 1)
      assert.equal(afterPlan[0]?.workflow.phase, 'planning')
      assert.equal(afterPlan[0]?.workflow.planningPath, planResult.turnOutputProjection?.markdownPath)
      assert.equal(afterPlan[0]?.workflow.outlineRef, planResult.turnOutputProjection?.yamlPath)
      assert.deepEqual(afterPlan[0]?.workflow.tasks, [
        {
          id: 'task-1',
          title: 'task-1',
          status: 'active',
          dependencyIds: [],
          evidenceRefs: [],
        },
        {
          id: 'task-2',
          title: 'task-2',
          status: 'pending',
          dependencyIds: [],
          evidenceRefs: [],
        },
      ])
      assert.equal(afterPlan[0]?.anchors?.length ?? 0, 1)
      assert.equal(afterPlan[0]?.anchors?.[0]?.kind, 'planning-shift')
      assert.equal(continuityAfterPlan?.continuityKey, 'workflow:wf_123')
      assert.equal(continuityAfterPlan?.currentSessionId, 'ses_123')
      assert.equal(continuityAfterPlan?.linkedContractId, afterPlan[0]?.contractId)
      assert.ok(planResult.artifactRefs?.some((ref) => ref.includes('runtime-continuity')))
      assert.equal(
        (planResult.report as { continuity?: { continuityId?: string } }).continuity?.continuityId,
        continuityAfterPlan?.continuityId,
      )

      const implementResult = await executeSlashCommandBundle(implementBundle, {
        projectRoot,
        sessionId: 'ses_456',
        sessionScope: 'main',
        trajectoryId: 'traj_123',
        workflowId: 'wf_123',
        taskIds: ['task-1'],
        lineage: 'hivefiver',
        purposeClass: 'implementation',
        activeAgent: 'runtime-agent',
        userMessage: 'Execute the implementation against the saved plan.',
      })

      const afterImplement = await store.list('ses_123')
      const newSessionContracts = await store.list('ses_456')
      const continuityAfterImplement = await loadWorkflowContinuityTransactionForExecution(projectRoot, {
        workflowId: 'wf_123',
        trajectoryId: 'traj_123',
        sessionId: 'ses_456',
      })

      assert.equal(implementResult.executionMode, 'handler')
      assert.equal(afterImplement.length, 1)
      assert.equal(newSessionContracts.length, 0)
      assert.equal(afterImplement[0]?.contractId, afterPlan[0]?.contractId)
      assert.equal(afterImplement[0]?.workflow.phase, 'implementation')
      assert.equal(afterImplement[0]?.workflow.planningPath, planResult.turnOutputProjection?.markdownPath)
      assert.equal(afterImplement[0]?.workflow.outlineRef, implementResult.turnOutputProjection?.markdownPath)
      assert.deepEqual(afterImplement[0]?.workflow.tasks, afterPlan[0]?.workflow.tasks)
      assert.equal(afterImplement[0]?.anchors?.length ?? 0, 2)
      assert.equal(afterImplement[0]?.anchors?.at(-1)?.kind, 'stage-shift')
      assert.match(afterImplement[0]?.anchors?.at(-1)?.snapshotRef ?? '', /runtime-turns\/ses_456\//)
      assert.equal(continuityAfterImplement?.continuityId, continuityAfterPlan?.continuityId)
      assert.equal(continuityAfterImplement?.currentSessionId, 'ses_456')
      assert.equal(continuityAfterImplement?.priorSessionId, 'ses_123')
      assert.equal(continuityAfterImplement?.linkedContractId, afterPlan[0]?.contractId)
      assert.deepEqual(continuityAfterImplement?.turnOutputRefs, [
        implementResult.turnOutputProjection?.markdownPath,
        implementResult.turnOutputProjection?.yamlPath,
      ])
      assert.ok(implementResult.artifactRefs?.some((ref) => ref.endsWith(`${afterImplement[0]?.contractId}.json`)))
      assert.ok(implementResult.artifactRefs?.some((ref) => ref === `workflow-continuity:${continuityAfterPlan?.continuityId}`))
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('non-target runtime commands do not create continuity transactions', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-no-continuity-'))

    try {
      await bootstrapReadyRuntime(projectRoot)
      const harnessBundle = findSlashCommandBundle('hm-harness')

      assert.ok(harnessBundle)

      await executeSlashCommandBundle(harnessBundle, {
        projectRoot,
        sessionId: 'ses_harness_123',
        sessionScope: 'main',
        trajectoryId: 'traj_123',
        workflowId: 'wf_123',
        taskIds: ['task-1'],
        lineage: 'hivefiver',
        purposeClass: 'planning',
        activeAgent: 'runtime-agent',
        userMessage: 'Validate harness without creating continuity state.',
      })

      const continuity = await loadWorkflowContinuityTransactionForExecution(projectRoot, {
        workflowId: 'wf_123',
        trajectoryId: 'traj_123',
        sessionId: 'ses_harness_123',
      })

      assert.equal(continuity, null)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('init bootstraps the local runtime surface and reports sync evidence', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-init-sync-'))

    try {
      const result = await initProject(projectRoot, {
        presetId: 'guided-onboarding',
      })
      const report = result.commandResult.report as {
        runtime_surface_sync?: {
          plugin_file: string
          mirrored_command_files: string[]
          mirrored_agent_files: string[]
        }
      }
      const mirroredCommands = await readdir(join(projectRoot, '.opencode', 'commands'))

      assert.equal(result.commandResult.stateTransitions?.includes('runtime-surface-synced'), true)
      assert.ok(report.runtime_surface_sync)
      assert.equal(report.runtime_surface_sync?.plugin_file.endsWith('.opencode/plugins/hivemind-context-governance.ts'), true)
      assert.equal(mirroredCommands.includes('hm-plan.md'), true)
      assert.equal(mirroredCommands.includes('hm-implement.md'), true)
      assert.match(
        await readFile(join(projectRoot, '.opencode', 'plugins', 'hivemind-context-governance.ts'), 'utf8'),
        /hivemind-context-governance\/plugin/,
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('doctor re-syncs the local runtime surface only after recovery reaches healthy state', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-doctor-sync-'))

    try {
      const result = await runDoctorCommand(projectRoot, {
        sessionId: 'ses_doctor_123',
        trajectoryId: 'trj_doctor_123',
        workflowId: 'wf_doctor_123',
        taskIds: ['task-1'],
        lineage: 'hivefiver',
        purposeClass: 'course-correction',
      })
      const report = result.report as {
        runtime_surface_sync?: {
          plugin_file: string
          mirrored_command_files: string[]
          mirrored_agent_files: string[]
        }
      }
      const mirroredCommands = await readdir(join(projectRoot, '.opencode', 'commands'))

      assert.equal(result.closeoutStatus, 'qa-pending')
      assert.equal(result.stateTransitions?.includes('runtime-surface-synced'), true)
      assert.ok(report.runtime_surface_sync)
      assert.equal(mirroredCommands.includes('hm-plan.md'), true)
      assert.equal(mirroredCommands.includes('hm-implement.md'), true)
      assert.equal(report.runtime_surface_sync?.mirrored_command_files.some((file) => file.endsWith('hm-plan.md')), true)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
