import assert from 'node:assert/strict'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { HiveMindPlugin } from '../src/index.js'

async function createPluginHooks(directory: string) {
  return HiveMindPlugin({
    client: {} as never,
    project: {} as never,
    directory,
    worktree: directory,
    serverUrl: new URL('http://localhost'),
    $: {} as never,
  })
}

function createToolContext(directory: string, sessionID = 'ses_runtime_tool') {
  return {
    sessionID,
    messageID: 'msg_runtime_tool',
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

describe('control-plane runtime tools', () => {
  it('returns question-gate when hivemind_runtime_command runs hm-init without intake answers', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-runtime-tool-gate-'))

    try {
      const hooks = await createPluginHooks(dir)
      const runtimeCommand = hooks.tool?.hivemind_runtime_command
      assert.ok(runtimeCommand)

      const raw = await runtimeCommand!.execute({
        command: 'hm-init',
      }, createToolContext(dir))
      const result = JSON.parse(raw) as {
        executionMode: string
        report: {
          status: string
          intake: { questionnaireId: string; nextAction: string }
        }
      }

      assert.equal(result.executionMode, 'question-gate')
      assert.equal(result.report.status, 'intake-required')
      assert.equal(result.report.intake.questionnaireId, 'bootstrap-profile-v1')
      assert.equal(result.report.intake.nextAction, 'question-tool:bootstrap-profile-v1')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exposes incomplete bootstrap state through hivemind_runtime_status after a failed init gate', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-runtime-status-gate-'))

    try {
      const hooks = await createPluginHooks(dir)
      const runtimeCommand = hooks.tool?.hivemind_runtime_command
      const runtimeStatus = hooks.tool?.hivemind_runtime_status
      assert.ok(runtimeCommand)
      assert.ok(runtimeStatus)

      await runtimeCommand!.execute({
        command: 'hm-init',
      }, createToolContext(dir, 'ses_runtime_status_gate'))

      const rawStatus = await runtimeStatus!.execute({}, createToolContext(dir, 'ses_runtime_status_gate'))
      const status = JSON.parse(rawStatus) as {
        entryState: { state: string; interactiveBootstrapRequired: boolean }
        qaState: { state: string }
        runtimeState: {
          hasRuntimeAttachment: boolean
          profileComplete: boolean
          missingProfileFields: string[]
        }
      }

      assert.equal(status.entryState.state, 'uninitialized')
      assert.equal(status.entryState.interactiveBootstrapRequired, true)
      assert.equal(status.qaState.state, 'blocked')
      assert.equal(status.runtimeState.hasRuntimeAttachment, false)
      assert.equal(status.runtimeState.profileComplete, false)
      assert.deepEqual(status.runtimeState.missingProfileFields, [
        'preferredUserName',
        'chatLanguage',
        'artifactLanguage',
        'expertiseLevel',
        'outputStyle',
        'governanceMode',
        'automationLevel',
      ])

      await assert.rejects(access(join(dir, '.hivemind')))
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('auto-recovers runtime entry before workflow commands and stops in qa-pending', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-runtime-tool-autorecover-'))

    try {
      const hooks = await createPluginHooks(dir)
      const runtimeCommand = hooks.tool?.hivemind_runtime_command
      assert.ok(runtimeCommand)

      const raw = await runtimeCommand!.execute({
        command: 'hm-plan',
      }, createToolContext(dir, 'ses_runtime_autorecover'))
      const result = JSON.parse(raw) as {
        closeoutStatus: string
        report: {
          status: string
          entry_state: string
          auto_recovery?: { action: string; qaState: string }
          next_command: string
        }
      }

      assert.equal(result.closeoutStatus, 'qa-pending')
      assert.equal(result.report.status, 'qa-pending')
      assert.equal(result.report.entry_state, 'qa-pending')
      assert.deepEqual(result.report.auto_recovery, {
        action: 'hm-init',
        qaState: 'qa-pending',
      })
      assert.equal(result.report.next_command, 'hm-harness')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
