/**
 * Plugin Assembly Smoke Test
 *
 * Verifies the plugin entry point is truly assembly-only:
 * - HiveMindPlugin is a function
 * - It returns a Hooks object with expected hook keys
 * - No inline tool definitions in plugin entry source
 * - All 6 tools are registered
 * - New L5 hooks (chat.message, permission.ask, tool.execute.before) are registered
 */

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, it } from 'node:test'

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
    const mod = await import('../src/plugin/opencode-plugin.js')
    assert.ok(typeof mod.HiveMindPlugin === 'function', 'HiveMindPlugin should be a function')
    assert.ok(mod.default === mod.HiveMindPlugin, 'default export should be HiveMindPlugin')
  })

  it('HiveMindPlugin returns hooks object with expected keys', async () => {
    const { input } = createMockPluginInput()
    const mod = await import('../src/plugin/opencode-plugin.js')
    const hooks = await mod.HiveMindPlugin(input)

    // Core hooks
    assert.ok(hooks.event, 'should have event hook')
    assert.ok(hooks.tool, 'should have tool registry')
    assert.ok(hooks['shell.env'], 'should have shell.env hook')
    assert.ok(hooks['command.execute.before'], 'should have command.execute.before hook')
    assert.ok(hooks['tool.execute.after'], 'should have tool.execute.after hook')

    // Experimental hooks (existing)
    assert.ok(hooks['experimental.chat.system.transform'], 'should have system transform hook')
    assert.ok(hooks['experimental.chat.messages.transform'], 'should have messages transform hook')

    // L5 new hooks
    assert.ok(hooks['chat.message'], 'should have chat.message hook')
    assert.ok(hooks['permission.ask'], 'should have permission.ask hook')
    assert.ok(hooks['tool.execute.before'], 'should have tool.execute.before hook')
  })

  it('registers all 6 HiveMind tools', async () => {
    const { input } = createMockPluginInput()
    const mod = await import('../src/plugin/opencode-plugin.js')
    const hooks = await mod.HiveMindPlugin(input)

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
