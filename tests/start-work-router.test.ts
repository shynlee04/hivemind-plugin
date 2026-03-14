import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveStartWork } from '../src/hooks/start-work/index.js'

describe('start-work router', () => {
  it('forces hm-init when no hivemind state exists', () => {
    const decision = resolveStartWork({
      userMessage: 'implement the refactor workflow',
      sessionId: 'ses_bootstrap',
      sessionScope: 'main',
      hasHivemind: false,
      hivemindHealthy: false,
      hasWorkflow: false,
      hasHandoff: false,
    })

    assert.equal(decision.requiredCommandId, 'hm-init')
    assert.equal(decision.riskLevel, 'blocked')
  })

  it('routes framework implementation into hivefiver command stack', () => {
    const decision = resolveStartWork({
      userMessage: 'implement the plugin hook refactor and workflow chain',
      sessionId: 'ses_impl',
      sessionScope: 'main',
      activeLineage: 'hivefiver',
      hasHivemind: true,
      hivemindHealthy: true,
      hasWorkflow: true,
      hasHandoff: false,
    })

    assert.equal(decision.lineage, 'hivefiver')
    assert.equal(decision.purposeClass, 'implementation')
    assert.equal(decision.recommendedCommandId, 'hm-implement')
    assert.equal(decision.autoRoute, true)
  })

  it('keeps sub-session continuity bounded', () => {
    const decision = resolveStartWork({
      userMessage: 'investigate and synthesize the doc-intel gaps',
      sessionId: 'ses_sub',
      sessionScope: 'sub-session',
      parentSessionId: 'ses_parent',
      activeLineage: 'hivefiver',
      hasHivemind: true,
      hivemindHealthy: true,
      hasWorkflow: true,
      hasHandoff: true,
    })

    assert.equal(decision.sessionState, 'sub-session')
    assert.equal(decision.purposeClass, 'research')
    assert.equal(decision.recommendedCommandId, 'hm-research')
  })
})
