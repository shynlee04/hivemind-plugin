import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  discoverSlashCommandBundles,
  executeSlashCommandBundle,
  findSlashCommandBundle,
  previewSlashCommandBundle,
} from '../src/commands/slash-command/index.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAutoSlashCommandPlan, resolveStartWork } from '../src/index.js'

describe('slash-command stack', () => {
  it('discovers composite command bundles', () => {
    const bundles = discoverSlashCommandBundles()
    assert.ok(bundles.some((bundle) => bundle.id === 'hm-plan'))
    assert.ok(bundles.some((bundle) => bundle.id === 'hm-doctor'))
  })

  it('loads same-name command instruction text', async () => {
    const bundle = findSlashCommandBundle('hm-plan')
    assert.ok(bundle)

    const preview = await previewSlashCommandBundle(bundle!)
    assert.equal(preview.frontmatter.agent, 'hivefiver')
    assert.match(preview.body, /## Process/)
    assert.equal(preview.contract.usesArguments, true)
    assert.equal(preview.contract.producesState.includes('planning-projection'), true)
    assert.equal(preview.contract.verificationContract, 'planning-traceability')
    assert.equal(preview.workflowChain.length, 3)
    assert.equal(preview.pressureContract.id, 'workflow-readiness')
  })

  it('loads hm-init as an explicit runtime-command bridge instead of ad hoc bootstrap instructions', async () => {
    const bundle = findSlashCommandBundle('hm-init')
    assert.ok(bundle)

    const preview = await previewSlashCommandBundle(bundle!)
    assert.match(preview.body, /hivemind_runtime_command/)
    assert.match(preview.body, /Never hand-write `.hivemind\/\*\*` files/)
    assert.equal(preview.contract.verificationContract, 'bootstrap-readiness')
  })

  it('uses readiness gates to prefer doctor/init commands', () => {
    const decision = resolveStartWork({
      userMessage: 'review the broken session runtime state',
      sessionId: 'ses_doctor',
      sessionScope: 'main',
      activeLineage: 'hivefiver',
      hasHivemind: true,
      hivemindHealthy: false,
      hasWorkflow: true,
      hasHandoff: true,
    })

    const plan = createAutoSlashCommandPlan(decision)
    assert.equal(plan.commandBinding.bundle?.id, 'hm-doctor')
    assert.equal(plan.commandBinding.autoRoute, false)
  })

  it('executes hm-init against workflow authority instead of previewing only', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-command-init-'))

    try {
      const bundle = findSlashCommandBundle('hm-init')
      assert.ok(bundle)

      const result = await executeSlashCommandBundle(bundle!, {
        projectRoot: dir,
        sessionId: 'wf_init',
        sessionScope: 'main',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        trajectoryId: 'trj_init',
        workflowId: 'wf_init',
        taskIds: ['task_init'],
      })

      assert.equal(result.executionMode, 'handler')
      assert.equal(result.report.status, 'initialized')
      assert.equal(Array.isArray(result.entityBindings?.taskIds), true)
      assert.equal(result.stateTransitions?.includes('recovery-checkpoint-created'), true)
      assert.equal(result.artifactRefs?.length, 1)
      assert.equal(result.verificationContractId, 'bootstrap-readiness')
      assert.equal(result.pressureContract.id, 'fresh-bootstrap')
      assert.deepEqual(result.report.expectedEvidence, ['readiness-gate', 'checkpoint', 'planning-projection'])
      assert.deepEqual(result.report.profile, {
        preferredUserName: null,
        chatLanguage: 'en',
        artifactLanguage: 'en',
        expertiseLevel: 'advanced',
        governanceMode: 'assisted',
        automationLevel: 'assisted',
        outputStyle: 'concise',
      })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('carries bootstrap profile choices through hm-init execution', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-command-init-profile-'))

    try {
      const bundle = findSlashCommandBundle('hm-init')
      assert.ok(bundle)

      const result = await executeSlashCommandBundle(bundle!, {
        projectRoot: dir,
        sessionId: 'wf_init_profile',
        sessionScope: 'main',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        trajectoryId: 'trj_init_profile',
        workflowId: 'wf_init_profile',
        preferredUserName: 'Apple',
        language: 'Vietnamese',
        artifactLanguage: 'en',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'beginner',
        outputStyle: 'explanatory',
      })

      assert.equal(result.executionMode, 'handler')
      assert.deepEqual(result.report.profile, {
        preferredUserName: 'Apple',
        chatLanguage: 'vi',
        artifactLanguage: 'en',
        expertiseLevel: 'beginner',
        governanceMode: 'strict',
        automationLevel: 'guided',
        outputStyle: 'explanatory',
      })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
