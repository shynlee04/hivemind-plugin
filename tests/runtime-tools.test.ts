import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'

import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'

function createPluginInput(directory: string) {
  return {
    directory,
    client: {
      tui: {
        showToast: async () => undefined,
      },
    },
    $: {},
    serverUrl: new URL('http://localhost:4096'),
    project: null,
    worktree: directory,
  } as never
}

test('plugin registers the six preserved SDK tools only through the surviving assembly', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-runtime-tools-'))

  try {
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const toolIds = Object.keys(hooks.tool ?? {}).sort()

    assert.deepEqual(toolIds, [
      'hivemind_doc',
      'hivemind_handoff',
      'hivemind_runtime_command',
      'hivemind_runtime_status',
      'hivemind_task',
      'hivemind_trajectory',
    ])

    for (const toolId of toolIds) {
      const definition = hooks.tool?.[toolId]
      assert.equal(typeof definition?.description, 'string')
      assert.ok(definition?.description.length)
      assert.equal(typeof definition?.execute, 'function')
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('surviving runtime/plugin entrypoints do not depend on deleted plugin wrappers', async () => {
  const [pluginSource, rootIndex] = await Promise.all([
    readFile('src/plugin/opencode-plugin.ts', 'utf8'),
    readFile('src/index.ts', 'utf8'),
  ])

  assert.equal(pluginSource.includes('createRuntimeSurfaceRegistry'), false)
  assert.equal(pluginSource.includes('createPluginRuntimePlan'), false)
  assert.equal(rootIndex.includes('runtime-plan'), false)
  assert.equal(rootIndex.includes('surface-registry'), false)
  assert.equal(rootIndex.includes('create-core-hooks'), false)
  assert.equal(rootIndex.includes('plugin-types'), false)
})
