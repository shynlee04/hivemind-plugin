import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { runCli } from '../src/cli.js'

test('cli init prints a readiness card in plain output and preserves json automation fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-cli-init-output-'))
  const logs: string[] = []
  const originalLog = console.log

  console.log = (value?: unknown) => {
    logs.push(String(value ?? ''))
  }

  try {
    const plainExitCode = await runCli(['init', '--project-root', directory, '--preset', 'guided-onboarding'])

    assert.equal(plainExitCode, 0)
    assert.equal(logs[0]?.includes('HiveMind Runtime Readiness'), true)
    assert.equal(logs[0]?.includes('Identity: HiveMind deterministic-harness-runtime'), true)
    assert.equal(logs[0]?.includes('Next: hm-harness'), true)

    logs.length = 0

    const jsonExitCode = await runCli(['init', '--project-root', directory, '--preset', 'guided-onboarding', '--json'])
    const payload = JSON.parse(logs[0] ?? '{}') as {
      runtime_identity?: { cardId?: string }
      readiness_signal?: { exactNextCommand?: string }
    }

    assert.equal(jsonExitCode, 0)
    assert.equal(payload.runtime_identity?.cardId, 'hivemind-runtime-identity-v1')
    assert.equal(payload.readiness_signal?.exactNextCommand, 'hm-harness')
  } finally {
    console.log = originalLog
    await rm(directory, { recursive: true, force: true })
  }
})
