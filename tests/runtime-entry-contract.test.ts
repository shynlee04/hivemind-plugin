import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { executeSlashCommandBundle, findSlashCommandBundle } from '../src/commands/slash-command/index.js'
import { previewSlashCommandBundle } from '../src/commands/slash-command/command-runner.js'
import { bootstrapTrajectoryLedger } from '../src/core/index.js'
import { createWorkflowTask } from '../src/core/workflow-management/index.js'
import { ContractStore } from '../src/features/agent-work-contract/engine/contract-store.js'
import { executeHivemindHandoffAction } from '../src/features/handoff/index.js'
import { initProject, runDoctorCommand } from '../src/features/runtime-entry/index.js'
import { saveRuntimeAttachmentSettings } from '../src/features/runtime-entry/attachment.js'
import { loadCommandAsset } from '../src/features/runtime-entry/instruction-loader.js'
import { loadWorkflowContinuityTransactionForExecution } from '../src/features/runtime-entry/workflow-continuity.js'
import { markEntryKernelReady } from '../src/shared/entry-kernel-state.js'
import { createOpencodeAgentRegistry } from '../src/shared/opencode-agent-registry.js'

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

  it('resolves slash-command agent bindings from the package root when cwd is a consumer project', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-consumer-cwd-'))
    const originalCwd = process.cwd()

    try {
      const bundle = findSlashCommandBundle('hm-plan')

      assert.ok(bundle)
      assert.throws(() => createOpencodeAgentRegistry(projectRoot), /ENOENT|no such file/i)

      process.chdir(projectRoot)

      const preview = await previewSlashCommandBundle(bundle)

      assert.equal(preview.commandId, 'hm-plan')
      assert.equal(preview.frontmatter.agent, bundle.agent)
    } finally {
      process.chdir(originalCwd)
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('inspection-first runtime commands execute through real handlers', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-inspection-handlers-'))

    try {
      await bootstrapReadyRuntime(projectRoot)
      createWorkflowTask(projectRoot, {
        workflowId: 'wf_123',
        taskId: 'task-2',
        title: 'task-2',
      })

      for (const commandId of ['hm-research', 'hm-verify', 'hm-tdd', 'hm-course-correct'] as const) {
        const bundle = findSlashCommandBundle(commandId)

        assert.ok(bundle)

        const result = await executeSlashCommandBundle(bundle, {
          projectRoot,
          sessionId: `ses_${commandId}`,
          sessionScope: 'main',
          trajectoryId: 'traj_123',
          workflowId: 'wf_123',
          taskIds: ['task-1'],
          lineage: 'hivefiver',
          purposeClass: bundle.purposeClasses[0],
          activeAgent: bundle.agent,
          userMessage: `Inspect ${commandId} runtime readiness.`,
        })

        assert.equal(result.executionMode, 'handler')
        assert.equal(result.closeoutStatus, 'ready')
      }
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('handoff creation persists delegation continuity and preserves the original linked contract', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-delegation-continuity-'))

    try {
      await bootstrapReadyRuntime(projectRoot)
      createWorkflowTask(projectRoot, {
        workflowId: 'wf_123',
        taskId: 'task-2',
        title: 'task-2',
      })
      const planBundle = findSlashCommandBundle('hm-plan')

      assert.ok(planBundle)

      await executeSlashCommandBundle(planBundle, {
        projectRoot,
        sessionId: 'ses_123',
        sessionScope: 'main',
        trajectoryId: 'traj_123',
        workflowId: 'wf_123',
        taskIds: ['task-1'],
        lineage: 'hivefiver',
        purposeClass: 'planning',
        activeAgent: 'runtime-agent',
        userMessage: 'Plan before creating a delegation handoff.',
      })

      const store = new ContractStore(projectRoot)
      const [contract] = await store.list('ses_123')
      const handoffResult = await executeHivemindHandoffAction(projectRoot, {
        action: 'create',
        workflowId: 'wf_123',
        trajectoryId: 'traj_123',
        targetAgent: 'delegate-agent',
        targetSessionId: 'ses_delegate_456',
        scope: 'Implement delegated task slice',
        summary: 'Delegate the implementation slice.',
        taskIds: 'task-1',
        resumeTarget: 'command:hm-implement',
      }, {
        sessionID: 'ses_123',
        agent: 'runtime-agent',
      })
      const continuity = await loadWorkflowContinuityTransactionForExecution(projectRoot, {
        sessionId: 'ses_delegate_456',
      })
      const linkedContract = await store.get(contract?.contractId ?? '')
      const handoffData = handoffResult.kind === 'success'
        ? handoffResult.data as {
            record: { id: string }
            chainAction?: { executed: boolean }
          }
        : null
      const delegationProjection = (linkedContract as typeof linkedContract & {
        delegationProjection?: {
          handoffs: Array<{ delegationId: string; taskRefs: string[]; status: string }>
        }
      })?.delegationProjection
      const delegatedHandoff = delegationProjection?.handoffs[0]

      assert.equal(handoffResult.kind, 'success')
      assert.equal(handoffData?.chainAction?.executed, true)
      assert.equal(continuity?.linkedContractId, contract?.contractId)
      assert.equal(continuity?.delegationId, handoffData?.record.id)
      assert.match(continuity?.handoffRef ?? '', /\.hivemind\/handoffs\//)
      assert.equal(continuity?.targetSessionId, 'ses_delegate_456')
      assert.equal(continuity?.resumeTarget, 'command:hm-implement')
      assert.deepEqual(linkedContract?.workflow.tasks, [
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
      assert.equal(delegationProjection?.handoffs.length, 1)
      assert.equal(delegatedHandoff?.delegationId, handoffData?.record.id)
      assert.deepEqual(delegatedHandoff?.taskRefs, ['task-1'])
      assert.equal(delegatedHandoff?.status, 'open')
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
        }
      }

      assert.equal(result.commandResult.stateTransitions?.includes('runtime-surface-synced'), true)
      assert.equal(result.runtime_identity.cardId, 'hivemind-runtime-identity-v1')
      assert.equal(result.runtime_identity.activeRuntimeAuthority, 'managed-sdk')
      assert.equal(result.runtime_identity.runtimePosture, 'singular-runtime-authority')
      assert.equal(result.readiness_signal.cardId, 'hivemind-readiness-signal-v1')
      assert.equal(result.readiness_signal.readinessState, 'qa-pending')
      assert.equal(result.readiness_signal.exactNextCommand, 'hm-harness')
      assert.ok(report.runtime_surface_sync)
      assert.equal((result.commandResult.report as { runtime_identity?: { cardId?: string } }).runtime_identity?.cardId, 'hivemind-runtime-identity-v1')
      assert.equal((result.commandResult.report as { readiness_signal?: { exactNextCommand?: string } }).readiness_signal?.exactNextCommand, 'hm-harness')
      assert.equal(report.runtime_surface_sync?.plugin_file.endsWith('.opencode/plugins/hivemind-context-governance.ts'), true)
      assert.match(
        await readFile(join(projectRoot, '.opencode', 'plugins', 'hivemind-context-governance.ts'), 'utf8'),
        /hivemind-context-governance\/plugin/,
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('init redirect on attached runtime preserves the identity and readiness contract', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-init-attach-redirect-'))

    try {
      await bootstrapReadyRuntime(projectRoot)

      const result = await initProject(projectRoot, {
        presetId: 'guided-onboarding',
      })

      assert.equal(result.closeoutStatus, 'ready')
      assert.equal(result.runtime_identity.activeRuntimeAuthority, 'attached-sdk')
      assert.equal(result.runtime_identity.routeDisposition, 'attach')
      assert.equal(result.readiness_signal.exactNextCommand, 'hm-harness')
      assert.equal((result.commandResult.report as { runtime_identity?: { activeRuntimeAuthority?: string } }).runtime_identity?.activeRuntimeAuthority, 'attached-sdk')
      assert.equal((result.commandResult.report as { readiness_signal?: { readinessState?: string } }).readiness_signal?.readinessState, 'ready')
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
        }
      }

      assert.equal(result.closeoutStatus, 'qa-pending')
      assert.equal(result.stateTransitions?.includes('runtime-surface-synced'), true)
      assert.ok(report.runtime_surface_sync)
      assert.equal(report.runtime_surface_sync?.plugin_file.endsWith('.opencode/plugins/hivemind-context-governance.ts'), true)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
