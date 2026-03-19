import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { routeWorkflow } from '../src/core/workflow-management/index.js'
import {
  createSyntheticPart,
  findLastUserMessage,
  getMessageText,
} from '../src/hooks/prompt-transformation/index.js'

describe('runtime hook hierarchy', () => {
  it('keeps only direct message helpers in the surviving prompt path', () => {
    const firstPart = createSyntheticPart('ses_main', 'msg_main', '<hivemind context_version="v1">')
    const assistantPart = createSyntheticPart('ses_assistant', 'msg_assistant', 'assistant output')
    const userTextPart = createSyntheticPart('ses_main', 'msg_main', 'continue the runtime audit')
    const lastUser = findLastUserMessage([
      {
        info: { role: 'assistant' },
        parts: [assistantPart],
      },
      {
        info: { role: 'user', id: 'msg_main', sessionID: 'ses_main' },
        parts: [firstPart, userTextPart],
      },
    ])

    assert.ok(lastUser)
    assert.equal(getMessageText(lastUser), '<hivemind context_version="v1"> continue the runtime audit')
  })

  it('keeps workflow routing independent from deleted wrapper chains', () => {
    const decision = routeWorkflow({
      id: 'wf-refactor',
      intent: 'continue runtime hierarchy refactor',
      stage: 'interdependent',
      scope: 'sub-session',
      lineage: 'hivefiver',
    })

    assert.equal(decision.loadStrategy, 'bounded')
  })
})
