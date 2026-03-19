import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'
import { createMockPluginInput } from './helpers/mock-sdk.js'

describe('plugin assembly smoke test', () => {
  it('plugin entry source has no inline tool({}) definitions', async () => {
    const src = await readFile(join(process.cwd(), 'src/plugin/opencode-plugin.ts'), 'utf-8')
    const inlineToolDefs = (src.match(/\btool\(\{/g) ?? []).length
    assert.equal(inlineToolDefs, 0, 'plugin entry should have zero inline tool({...}) definitions')
  })

  it('plugin entry source keeps helper logic out of the assembly file', async () => {
    const src = await readFile(join(process.cwd(), 'src/plugin/opencode-plugin.ts'), 'utf-8')

    const forbiddenLocalHelpers = [
      'type MessageLike =',
      'function createSyntheticPart(',
      'function getMessageText(',
      'function findLastUserMessage(',
      'async function recordToolEvent(',
      'const HIVEMIND_MANAGED_TOOLS =',
    ]

    for (const signature of forbiddenLocalHelpers) {
      assert.equal(
        src.includes(signature),
        false,
        `plugin entry should not define local helper logic: ${signature}`,
      )
    }
  })

  it('plugin entry exports HiveMindPlugin', async () => {
    assert.ok(typeof HiveMindPlugin === 'function', 'HiveMindPlugin should be a function')
  })

  it('registers the surviving runtime context hooks on the real plugin export', async () => {
    const { input } = createMockPluginInput()
    const hooks = await HiveMindPlugin(input)

    assert.ok(hooks.event, 'should have event hook')
    assert.ok(hooks.tool, 'should have tool registry')
    assert.ok(hooks['chat.message'], 'should keep chat.message for turn lifecycle work')
    assert.ok(hooks['permission.ask'], 'should have permission.ask hook')
    assert.ok(hooks['tool.execute.before'], 'should have tool.execute.before hook')
    assert.ok(hooks['tool.execute.after'], 'should have tool.execute.after hook')
    assert.ok(hooks['shell.env'], 'should have shell.env hook')
    assert.ok(hooks['command.execute.before'], 'should have command.execute.before hook')
    assert.ok(hooks['experimental.chat.messages.transform'], 'should have messages transform hook')
    assert.ok(hooks['experimental.session.compacting'], 'should have compaction hook')
    assert.equal(
      hooks['experimental.chat.system.transform'],
      undefined,
      'system transform should no longer be a required runtime context emitter',
    )
  })

  it('registers all 6 HiveMind tools', async () => {
    const { input } = createMockPluginInput()
    const hooks = await HiveMindPlugin(input)

    const toolKeys = Object.keys(hooks.tool ?? {})
    assert.ok(toolKeys.includes('hivemind_doc'), 'should register doc tool')
    assert.ok(toolKeys.includes('hivemind_runtime_status'), 'should register runtime_status')
    assert.ok(toolKeys.includes('hivemind_runtime_command'), 'should register runtime_command')
    assert.ok(toolKeys.includes('hivemind_task'), 'should register task')
    assert.ok(toolKeys.includes('hivemind_trajectory'), 'should register trajectory')
    assert.ok(toolKeys.includes('hivemind_handoff'), 'should register handoff')
    assert.equal(toolKeys.length, 6, 'should have exactly 6 tools')
  })
})
