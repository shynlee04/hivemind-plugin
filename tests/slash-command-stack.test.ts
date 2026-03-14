import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  discoverSlashCommandBundles,
  findSlashCommandBundle,
  previewSlashCommandBundle,
} from '../src/tools/slash-command/index.js'
import { createAutoSlashCommandPlan, resolveStartWork } from '../src/index.js'

describe('slash-command stack', () => {
  it('discovers composite command bundles', () => {
    const bundles = discoverSlashCommandBundles()
    assert.ok(bundles.some((bundle) => bundle.id === 'hm-plan'))
    assert.ok(bundles.some((bundle) => bundle.id === 'hm-doctor'))
  })

  it('loads same-name command instruction text', async () => {
    const bundle = findSlashCommandBundle('hm-implement')
    assert.ok(bundle)

    const preview = await previewSlashCommandBundle(bundle!)
    assert.equal(preview.frontmatter.agent, 'hivefiver')
    assert.match(preview.body, /## Process/)
    assert.equal(preview.workflowChain.length, 3)
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
})
