import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'

import * as hiveMindRoot from '../src/index.js'
import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'
import * as agentWorkContractHooks from '../src/features/agent-work-contract/hooks/index.js'
import * as agentWorkContractTools from '../src/features/agent-work-contract/tools/index.js'
import { HIVEMIND_MANAGED_TOOLS } from '../src/hooks/runtime-loader/tool-governance.js'
import { agentToolCatalog } from '../src/tools/index.js'

const AGENT_WORK_FEATURE_TOOL_IDS = [
  agentWorkContractTools.HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
  agentWorkContractTools.HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
  agentWorkContractTools.HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID,
].sort()

const AUTHORITATIVE_RUNTIME_TOOL_IDS = [
  'hivemind_doc',
  'hivemind_handoff',
  'hivemind_runtime_command',
  'hivemind_runtime_status',
  'hivemind_task',
  'hivemind_trajectory',
]

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

    assert.deepEqual(toolIds, AUTHORITATIVE_RUNTIME_TOOL_IDS)
    assert.deepEqual(toolIds.filter((toolId) => AGENT_WORK_FEATURE_TOOL_IDS.includes(toolId)), [])

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

test('surviving runtime/plugin entrypoints expose current runtime surfaces without deleted wrapper exports', () => {
  assert.equal(typeof hiveMindRoot.HiveMindPlugin, 'function')
  assert.equal('createRuntimeSurfaceRegistry' in hiveMindRoot, false)
  assert.equal('createPluginRuntimePlan' in hiveMindRoot, false)
  assert.equal('createCoreHooks' in hiveMindRoot, false)
  assert.equal('pluginTypes' in hiveMindRoot, false)
})

test('agent-work contract feature exports stay feature-local while runtime authorities stay synchronized', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-runtime-tool-sync-'))

  try {
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const pluginToolIds = Object.keys(hooks.tool ?? {}).sort()
    const managedToolIds = [...HIVEMIND_MANAGED_TOOLS].sort()
    const catalogToolIds = agentToolCatalog.map((entry) => entry.id).sort()

    assert.equal(typeof agentWorkContractHooks.extractAgentWorkEventPacket, 'function')
    assert.equal(typeof agentWorkContractHooks.createCompactionPreservationPacket, 'function')
    assert.equal(typeof agentWorkContractTools.createAgentWorkClassifyIntentTool, 'function')
    assert.equal(typeof agentWorkContractTools.createAgentWorkCreateContractTool, 'function')
    assert.equal(typeof agentWorkContractTools.createAgentWorkExportContractTool, 'function')
    assert.equal('createAgentWorkClassifyIntentTool' in hiveMindRoot, false)
    assert.equal('createAgentWorkCreateContractTool' in hiveMindRoot, false)
    assert.equal('createAgentWorkExportContractTool' in hiveMindRoot, false)

    assert.deepEqual(pluginToolIds, AUTHORITATIVE_RUNTIME_TOOL_IDS)
    assert.deepEqual(managedToolIds, AUTHORITATIVE_RUNTIME_TOOL_IDS)
    assert.deepEqual(catalogToolIds, AUTHORITATIVE_RUNTIME_TOOL_IDS)
    assert.equal(new Set(pluginToolIds).size, pluginToolIds.length)
    assert.equal(new Set(managedToolIds).size, managedToolIds.length)
    assert.equal(new Set(catalogToolIds).size, catalogToolIds.length)

    for (const toolId of AGENT_WORK_FEATURE_TOOL_IDS) {
      assert.equal(pluginToolIds.includes(toolId), false)
      assert.equal(HIVEMIND_MANAGED_TOOLS.has(toolId), false)
      assert.equal(agentToolCatalog.some((entry) => entry.id === toolId), false)
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
