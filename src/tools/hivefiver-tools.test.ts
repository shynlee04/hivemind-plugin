/**
 * TDD RED phase tests for hivefiver tools (hm-init, hm-doctor, hm-setting).
 * These tests define expected behavior BEFORE implementation exists.
 *
 * Each test imports tool factories and validates:
 * 1. Factory function exists and returns a tool
 * 2. Tool has correct description
 * 3. Args schema validates correctly
 * 4. Execute returns structured JSON response
 */

import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { type ToolContext } from '@opencode-ai/plugin'

// ─── Mock Context ─────────────────────────────────────────────────────────────

function createMockContext(root: string): ToolContext {
  return {
    sessionID: 'test-session-hivefiver-001',
    messageID: 'msg-test',
    agent: 'test-agent',
    directory: root,
    worktree: root,
    abort: new AbortController().signal,
    metadata(_input: Record<string, unknown>) {
      // noop
    },
    async ask(_input: Record<string, unknown>) {
      // noop — mock authorization
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 1: hivemind_hm_init
// ═══════════════════════════════════════════════════════════════════════════════

test('hivefiver-init: createHivemindHmInitTool factory function exists', async () => {
  const { createHivemindHmInitTool } = await import('./hivefiver-init/index.js')
  assert.equal(typeof createHivemindHmInitTool, 'function', 'Should export createHivemindHmInitTool')
})

test('hivefiver-init: factory returns a tool with description', async () => {
  const { createHivemindHmInitTool } = await import('./hivefiver-init/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-init-test-'))
  try {
    const t = createHivemindHmInitTool(projectRoot)
    assert.ok(t.description, 'Tool must have a description')
    assert.ok(t.description.length > 10, 'Description must be meaningful')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-init: tool args include mode and force', async () => {
  const { createHivemindHmInitTool } = await import('./hivefiver-init/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-init-test-'))
  try {
    const t = createHivemindHmInitTool(projectRoot)
    assert.ok(t.args, 'Tool must have args')
    assert.ok(t.args.mode, 'Args must include mode')
    assert.ok(t.args.force, 'Args must include force')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-init: execute returns structured JSON response', async () => {
  const { createHivemindHmInitTool } = await import('./hivefiver-init/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-init-test-'))
  try {
    const t = createHivemindHmInitTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ mode: 'auto', force: false }, ctx)
    const parsed = JSON.parse(result)
    assert.ok(parsed.status, 'Response must have status field')
    assert.ok(parsed.message, 'Response must have message field')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-init: execute with greenfield mode returns greenfield plan', async () => {
  const { createHivemindHmInitTool } = await import('./hivefiver-init/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-init-test-'))
  try {
    const t = createHivemindHmInitTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ mode: 'greenfield', force: false }, ctx)
    const parsed = JSON.parse(result)
    assert.equal(parsed.status, 'success')
    assert.ok(parsed.data, 'Response must include data')
    assert.equal(parsed.data.mode, 'greenfield')
    assert.ok(Array.isArray(parsed.data.proposedChanges), 'Must include proposedChanges array')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-init: execute with brownfield mode returns brownfield plan', async () => {
  const { createHivemindHmInitTool } = await import('./hivefiver-init/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-init-test-'))
  try {
    const t = createHivemindHmInitTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ mode: 'brownfield', force: false }, ctx)
    const parsed = JSON.parse(result)
    assert.equal(parsed.status, 'success')
    assert.equal(parsed.data.mode, 'brownfield')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 2: hivemind_hm_doctor
// ═══════════════════════════════════════════════════════════════════════════════

test('hivefiver-doctor: createHivemindHmDoctorTool factory function exists', async () => {
  const { createHivemindHmDoctorTool } = await import('./hivefiver-doctor/index.js')
  assert.equal(typeof createHivemindHmDoctorTool, 'function', 'Should export createHivemindHmDoctorTool')
})

test('hivefiver-doctor: factory returns a tool with description', async () => {
  const { createHivemindHmDoctorTool } = await import('./hivefiver-doctor/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-doctor-test-'))
  try {
    const t = createHivemindHmDoctorTool(projectRoot)
    assert.ok(t.description, 'Tool must have a description')
    assert.ok(t.description.length > 10, 'Description must be meaningful')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-doctor: tool args include scope and fix', async () => {
  const { createHivemindHmDoctorTool } = await import('./hivefiver-doctor/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-doctor-test-'))
  try {
    const t = createHivemindHmDoctorTool(projectRoot)
    assert.ok(t.args, 'Tool must have args')
    assert.ok(t.args.scope, 'Args must include scope')
    assert.ok(t.args.fix, 'Args must include fix')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-doctor: execute returns structured JSON response', async () => {
  const { createHivemindHmDoctorTool } = await import('./hivefiver-doctor/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-doctor-test-'))
  try {
    const t = createHivemindHmDoctorTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ scope: 'all', fix: false }, ctx)
    const parsed = JSON.parse(result)
    assert.ok(parsed.status, 'Response must have status field')
    assert.ok(parsed.message, 'Response must have message field')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-doctor: execute with all scope returns full diagnostics', async () => {
  const { createHivemindHmDoctorTool } = await import('./hivefiver-doctor/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-doctor-test-'))
  try {
    const t = createHivemindHmDoctorTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ scope: 'all', fix: false }, ctx)
    const parsed = JSON.parse(result)
    assert.equal(parsed.status, 'success')
    assert.ok(parsed.data, 'Response must include data')
    assert.equal(parsed.data.scope, 'all')
    assert.ok(Array.isArray(parsed.data.findings), 'Must include findings array')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-doctor: execute with skills scope returns targeted findings', async () => {
  const { createHivemindHmDoctorTool } = await import('./hivefiver-doctor/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-doctor-test-'))
  try {
    const t = createHivemindHmDoctorTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ scope: 'skills', fix: false }, ctx)
    const parsed = JSON.parse(result)
    assert.equal(parsed.status, 'success')
    assert.equal(parsed.data.scope, 'skills')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-doctor: execute with fix=true returns authorization required', async () => {
  const { createHivemindHmDoctorTool } = await import('./hivefiver-doctor/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-doctor-test-'))
  try {
    const t = createHivemindHmDoctorTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ scope: 'all', fix: true }, ctx)
    const parsed = JSON.parse(result)
    // With fix=true in placeholder mode, should indicate authorization pending
    assert.ok(parsed.status, 'Must return status')
    assert.ok(parsed.data.proposedFixes || parsed.data.authorizationRequired !== undefined,
      'Must indicate proposed fixes or authorization state')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 3: hivemind_hm_setting
// ═══════════════════════════════════════════════════════════════════════════════

test('hivefiver-setting: createHivemindHmSettingTool factory function exists', async () => {
  const { createHivemindHmSettingTool } = await import('./hivefiver-setting/index.js')
  assert.equal(typeof createHivemindHmSettingTool, 'function', 'Should export createHivemindHmSettingTool')
})

test('hivefiver-setting: factory returns a tool with description', async () => {
  const { createHivemindHmSettingTool } = await import('./hivefiver-setting/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-test-'))
  try {
    const t = createHivemindHmSettingTool(projectRoot)
    assert.ok(t.description, 'Tool must have a description')
    assert.ok(t.description.length > 10, 'Description must be meaningful')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-setting: tool args include group, key, and value', async () => {
  const { createHivemindHmSettingTool } = await import('./hivefiver-setting/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-test-'))
  try {
    const t = createHivemindHmSettingTool(projectRoot)
    assert.ok(t.args, 'Tool must have args')
    assert.ok(t.args.group, 'Args must include group')
    assert.ok(t.args.key, 'Args must include key')
    assert.ok(t.args.value, 'Args must include value')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-setting: execute returns structured JSON response', async () => {
  const { createHivemindHmSettingTool } = await import('./hivefiver-setting/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-test-'))
  try {
    const t = createHivemindHmSettingTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ group: 'all' }, ctx)
    const parsed = JSON.parse(result)
    assert.ok(parsed.status, 'Response must have status field')
    assert.ok(parsed.message, 'Response must have message field')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-setting: execute with group=all shows all config groups', async () => {
  const { createHivemindHmSettingTool } = await import('./hivefiver-setting/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-test-'))
  try {
    const t = createHivemindHmSettingTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ group: 'all' }, ctx)
    const parsed = JSON.parse(result)
    assert.equal(parsed.status, 'success')
    assert.ok(parsed.data, 'Response must include data')
    assert.equal(parsed.data.group, 'all')
    assert.ok(parsed.data.currentConfig !== undefined, 'Must include currentConfig')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-setting: execute with key and value returns proposed change', async () => {
  const { createHivemindHmSettingTool } = await import('./hivefiver-setting/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-test-'))
  try {
    const t = createHivemindHmSettingTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ group: 'language', key: 'communication_language', value: 'fr' }, ctx)
    const parsed = JSON.parse(result)
    assert.equal(parsed.status, 'success')
    assert.ok(parsed.data.proposedChange, 'Must include proposedChange')
    assert.equal(parsed.data.proposedChange.key, 'communication_language')
    assert.equal(parsed.data.proposedChange.value, 'fr')
    assert.equal(parsed.data.authorizationRequired, true, 'Must require authorization')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('hivefiver-setting: execute does not write without authorization', async () => {
  const { createHivemindHmSettingTool } = await import('./hivefiver-setting/index.js')
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-setting-test-'))
  try {
    const t = createHivemindHmSettingTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    const result = await t.execute({ group: 'governance', key: 'governance_level', value: 'strict' }, ctx)
    const parsed = JSON.parse(result)
    assert.equal(parsed.data.written, false, 'Must not write without authorization')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN ASSEMBLY: All 3 tools must be wired
// ═══════════════════════════════════════════════════════════════════════════════

test('plugin assembly: opencode-plugin.ts imports all 3 hivefiver tool factories', async () => {
  const { readFileSync } = await import('node:fs')
  const pluginPath = join(process.cwd(), 'src/plugin/opencode-plugin.ts')
  const content = readFileSync(pluginPath, 'utf8')

  assert.ok(
    content.includes('hivefiver-init') || content.includes('HmInit'),
    'Plugin must import hm-init tool'
  )
  assert.ok(
    content.includes('hivefiver-doctor') || content.includes('HmDoctor'),
    'Plugin must import hm-doctor tool'
  )
  assert.ok(
    content.includes('hivefiver-setting') || content.includes('HmSetting'),
    'Plugin must import hm-setting tool'
  )
})

test('plugin assembly: tool object includes all 3 hivefiver tools', async () => {
  const { readFileSync } = await import('node:fs')
  const pluginPath = join(process.cwd(), 'src/plugin/opencode-plugin.ts')
  const content = readFileSync(pluginPath, 'utf8')

  assert.ok(content.includes('hivemind_hm_init'), 'Plugin tool object must include hivemind_hm_init')
  assert.ok(content.includes('hivemind_hm_doctor'), 'Plugin tool object must include hivemind_hm_doctor')
  assert.ok(content.includes('hivemind_hm_setting'), 'Plugin tool object must include hivemind_hm_setting')
})
