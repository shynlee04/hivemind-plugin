import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import type { ToolContext } from '@opencode-ai/plugin'

import { SupportedLanguage } from '../../../src/schema-kernel/config-records.js'
import { createHivemindHmSettingTool } from '../../../src/tools/hivefiver-setting/index.js'

function createMockContext(root: string): ToolContext {
  return {
    sessionID: 'test-session-hm-setting-localization',
    messageID: 'msg-test',
    agent: 'test-agent',
    directory: root,
    worktree: root,
    abort: new AbortController().signal,
    metadata() {},
    async ask() {},
  }
}

async function executeHmSetting(args: Record<string, unknown>) {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-localization-'))

  try {
    const tool = createHivemindHmSettingTool(projectRoot)
    const payload = JSON.parse(await tool.execute(args as never, createMockContext(projectRoot)))
    return payload
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
}

test('language group returns backward-compatible result shape', async () => {
  const payload = await executeHmSetting({ group: 'language' })

  assert.equal(payload.status, 'success')
  assert.equal(payload.data.group, 'language')
  assert.ok('currentConfig' in payload.data)
  assert.ok('proposedChange' in payload.data)
  assert.ok('authorizationRequired' in payload.data)
  assert.ok('written' in payload.data)
})

test('unsupported locale falls back to english selector copy', async () => {
  const payload = await executeHmSetting({ group: 'language', locale: 'fr-CA' })

  assert.equal(payload.status, 'success')
  assert.equal(payload.data.languageSelector.locale, 'en')
  assert.equal(payload.data.languageSelector.title, 'Language settings')
  assert.equal(
    payload.data.localizedMessage,
    'Review or update Hivefiver language preferences.',
  )
})

test('language selector metadata is returned for the language group', async () => {
  const payload = await executeHmSetting({ group: 'language', locale: 'vi' })
  const expectedValues = Object.values(SupportedLanguage)

  assert.equal(payload.status, 'success')
  assert.equal(payload.data.languageSelector.fields.length, 2)
  assert.deepEqual(
    payload.data.languageSelector.fields.map((field: { key: string }) => field.key).sort(),
    ['communication_language', 'document_language'],
  )
  assert.deepEqual(
    payload.data.languageSelector.fields[0].options.map((option: { value: string }) => option.value),
    expectedValues,
  )
})

test('authorization and non-writing behavior stay unchanged for proposed language updates', async () => {
  const payload = await executeHmSetting({
    group: 'language',
    key: 'communication_language',
    value: 'vi',
    locale: 'ko',
  })

  assert.equal(payload.status, 'success')
  assert.equal(payload.data.authorizationRequired, true)
  assert.equal(payload.data.written, false)
  assert.equal(payload.data.proposedChange.value, 'vi')
})
