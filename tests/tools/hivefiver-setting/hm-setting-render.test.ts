import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import type { ToolContext } from '@opencode-ai/plugin'

import { success } from '../../../src/shared/tool-response.js'
import {
  renderHmSettingDashboardTui,
  renderHmSettingTui,
} from '../../../src/tools/hivefiver-setting/render.js'
import type { HmSettingDashboardProof, HmSettingResult } from '../../../src/tools/hivefiver-setting/types.js'
import { createHivemindHmSettingTool } from '../../../src/tools/hivefiver-setting/index.js'

function createMockContext(root: string): ToolContext {
  return {
    sessionID: 'test-session-hm-setting-render',
    messageID: 'msg-test',
    agent: 'test-agent',
    directory: root,
    worktree: root,
    abort: new AbortController().signal,
    metadata() {},
    async ask() {},
  }
}

async function executeHmSettingRaw(args: Record<string, unknown>) {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-render-'))

  try {
    const tool = createHivemindHmSettingTool(projectRoot)
    return await tool.execute(args as never, createMockContext(projectRoot))
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
}

test('default mode remains JSON output', async () => {
  const raw = await executeHmSettingRaw({ group: 'language', locale: 'en' })
  const parsed = JSON.parse(raw)

  assert.equal(parsed.status, 'success')
  assert.equal(parsed.data.group, 'language')
})

test('tui render mode returns user-facing text from the same payload seam', async () => {
  const raw = await executeHmSettingRaw({ group: 'language', locale: 'en', renderMode: 'tui' })

  assert.match(raw, /Language settings/)
  assert.match(raw, /Communication language/)
  assert.match(raw, /Document language/)
  assert.match(raw, /en/)
})

test('local TUI renderer projects a structured hm-setting payload', () => {
  const result: HmSettingResult = {
    group: 'language',
    currentConfig: {
      communication_language: 'en',
      document_language: 'vi',
    },
    proposedChange: null,
    authorizationRequired: false,
    written: false,
    localizedMessage: 'Review or update Hivefiver language preferences.',
    languageSelector: {
      locale: 'en',
      title: 'Language settings',
      description: 'Choose how Hivefiver communicates with you and writes documents.',
      fields: [
        {
          key: 'communication_language',
          label: 'Communication language',
          description: 'Chat language.',
          currentValue: 'en',
          options: [
            { value: 'en', label: 'English', nativeLabel: 'English' },
            { value: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
          ],
        },
        {
          key: 'document_language',
          label: 'Document language',
          description: 'Document language.',
          currentValue: 'vi',
          options: [
            { value: 'en', label: 'English', nativeLabel: 'English' },
            { value: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
          ],
        },
      ],
    },
  }

  const output = renderHmSettingTui(success('hm-setting [language]: showing current config', result))

  assert.match(output, /hm-setting \[language\]: showing current config/)
  assert.match(output, /Language settings/)
  assert.match(output, /Document language/)
  assert.match(output, /Tiếng Việt/)
})

test('dashboard renderer projects pane40 runtime mirror and pane60 settings guidance', () => {
  const dashboard: HmSettingDashboardProof = {
    mode: 'settings',
    pane40: {
      title: '40 pane · runtime/session mirror',
      sessionId: 'ses_dashboard',
      runtimeAuthority: 'attached-sdk',
      attachmentMode: 'local-worktree',
      workflowId: 'wf_dashboard',
      trajectoryId: 'trj_dashboard',
      gateSummary: 'ready',
      healthSummary: 'healthy',
      recentEvents: [
        'workflow-ready',
        'runtime attached',
      ],
    },
    pane60: {
      title: '60 pane · Hivefiver settings',
      group: 'all',
      changedFields: ['chatLanguage'],
      impactSummary: ['updated:chatLanguage'],
      nextAction: 'refresh-session-guidance',
      guidance: ['question-gate satisfied'],
      currentSettings: {
        preferredUserName: 'Taylor',
        chatLanguage: 'vi',
      },
    },
  }

  const output = renderHmSettingDashboardTui(dashboard)

  assert.match(output, /40 pane · runtime\/session mirror/)
  assert.match(output, /attached-sdk/)
  assert.match(output, /workflow-ready/)
  assert.match(output, /60 pane · Hivefiver settings/)
  assert.match(output, /refresh-session-guidance/)
  assert.match(output, /chatLanguage: vi/)
})
