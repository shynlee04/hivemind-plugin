import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import type { ToolContext } from '@opencode-ai/plugin'

import { createHivemindHmSettingTool } from '../../../src/tools/hivefiver-setting/index.js'

function createMockContext(root: string): ToolContext {
  return {
    sessionID: 'test-session-dashboard-tool',
    messageID: 'msg-dashboard',
    agent: 'test-agent',
    directory: root,
    worktree: root,
    abort: new AbortController().signal,
    metadata() {},
    async ask() {},
  }
}

async function executeHmSetting(args: Record<string, unknown>, projectRoot: string) {
  const tool = createHivemindHmSettingTool(projectRoot)
  return await tool.execute(args as never, createMockContext(projectRoot))
}

test('hivemind_hm_setting with dashboard: true returns dashboard payload with pane40 and pane60', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-dashboard-tool-'))

  try {
    const raw = await executeHmSetting({ group: 'all', dashboard: true }, projectRoot)
    const parsed = JSON.parse(raw)

    assert.equal(parsed.status, 'success')
    assert.equal(parsed.message, 'hm-setting [dashboard]: 40/60 dashboard layout')

    const dashboard = parsed.data?.dashboard
    assert.ok(dashboard, 'dashboard payload must be present')
    assert.ok(dashboard.pane40, 'pane40 must be present')
    assert.ok(dashboard.pane60, 'pane60 must be present')
    assert.equal(dashboard.pane40.sessionId, 'test-session-dashboard-tool')
    assert.ok(dashboard.pane40.title.includes('40 pane'))
    assert.ok(dashboard.pane60.title.includes('60 pane'))
    assert.ok(typeof dashboard.rendered === 'string', 'rendered text must be a string')
    assert.match(dashboard.rendered, /Hivefiver settings dashboard proof/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivemind_hm_setting with dashboard: false (default) does NOT return dashboard payload', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-dashboard-tool-default-'))

  try {
    const raw = await executeHmSetting({ group: 'language', locale: 'en' }, projectRoot)
    const parsed = JSON.parse(raw)

    assert.equal(parsed.status, 'success')
    assert.equal(parsed.data.group, 'language')
    assert.equal(parsed.data.dashboard, undefined, 'dashboard must NOT be present in normal mode')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivemind_hm_setting dashboard mode includes currentSettings from runtime snapshot', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-dashboard-tool-settings-'))

  try {
    const raw = await executeHmSetting({ group: 'all', dashboard: true }, projectRoot)
    const parsed = JSON.parse(raw)
    const dashboard = parsed.data?.dashboard

    assert.ok(dashboard, 'dashboard payload must be present')
    assert.ok(dashboard.pane60.currentSettings, 'currentSettings must be present in pane60')
    assert.ok('chatLanguage' in dashboard.pane60.currentSettings, 'chatLanguage key must exist')
    assert.ok('governanceMode' in dashboard.pane60.currentSettings, 'governanceMode key must exist')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
