import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'

import * as hiveMindRoot from '../src/index.js'
import { bootstrapTrajectoryLedger } from '../src/core/index.js'
import { saveRuntimeAttachmentSettings } from '../src/features/runtime-entry/attachment.js'
import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'
import * as agentWorkContractHooks from '../src/features/agent-work-contract/hooks/index.js'
import * as agentWorkContractTools from '../src/features/agent-work-contract/tools/index.js'
import { HIVEMIND_MANAGED_TOOLS } from '../src/hooks/runtime-loader/tool-governance.js'
import { agentToolCatalog } from '../src/tools/index.js'
import { markEntryKernelReady } from '../src/shared/entry-kernel-state.js'

const AGENT_WORK_FEATURE_TOOL_IDS = [
  agentWorkContractTools.HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
  agentWorkContractTools.HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
  agentWorkContractTools.HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID,
].sort()

const AUTHORITATIVE_RUNTIME_TOOL_IDS = [
  'hivemind_agent_work_create_contract',
  'hivemind_agent_work_export_contract',
  'hivemind_doc',
  'hivemind_handoff',
  'hivemind_journal',
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

async function bootstrapReadyRuntime(projectRoot: string): Promise<void> {
  await saveRuntimeAttachmentSettings(projectRoot, {
    runtimeAuthority: 'attached-sdk',
    runtimeInstanceId: 'rt_test',
    serverBaseUrl: 'http://localhost:4096',
    preferredUserName: 'Taylor',
  })
  await bootstrapTrajectoryLedger(projectRoot, {
    trajectoryId: 'traj_123',
    workflowId: 'wf_123',
    sessionId: 'ses_123',
    lineage: 'hivefiver',
    purposeClass: 'planning',
    taskIds: ['task-1'],
  })
  await markEntryKernelReady(projectRoot)
}

test('plugin registers the promoted runtime tools through the surviving assembly', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-runtime-tools-'))

  try {
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const toolIds = Object.keys(hooks.tool ?? {}).sort()

    assert.deepEqual(toolIds, AUTHORITATIVE_RUNTIME_TOOL_IDS)
    assert.deepEqual(toolIds.filter((toolId) => AGENT_WORK_FEATURE_TOOL_IDS.includes(toolId)), [
      agentWorkContractTools.HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
      agentWorkContractTools.HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID,
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

test('surviving runtime/plugin entrypoints expose current runtime surfaces without deleted wrapper exports', () => {
  assert.equal(typeof hiveMindRoot.HiveMindPlugin, 'function')
  assert.equal('createRuntimeSurfaceRegistry' in hiveMindRoot, false)
  assert.equal('createPluginRuntimePlan' in hiveMindRoot, false)
  assert.equal('createCoreHooks' in hiveMindRoot, false)
  assert.equal('pluginTypes' in hiveMindRoot, false)
})

test('agent-work contract runtime promotion keeps authorities synchronized while classify-intent stays feature-local', async () => {
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

    assert.equal(pluginToolIds.includes(agentWorkContractTools.HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID), false)
    assert.equal(HIVEMIND_MANAGED_TOOLS.has(agentWorkContractTools.HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID), false)
    assert.equal(
      agentToolCatalog.some((entry) => entry.id === agentWorkContractTools.HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID),
      false,
    )
    assert.equal(pluginToolIds.includes(agentWorkContractTools.HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID), true)
    assert.equal(HIVEMIND_MANAGED_TOOLS.has(agentWorkContractTools.HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID), true)
    assert.equal(
      agentToolCatalog.some((entry) => entry.id === agentWorkContractTools.HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID),
      true,
    )
    assert.equal(pluginToolIds.includes(agentWorkContractTools.HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID), true)
    assert.equal(HIVEMIND_MANAGED_TOOLS.has(agentWorkContractTools.HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID), true)
    assert.equal(
      agentToolCatalog.some((entry) => entry.id === agentWorkContractTools.HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID),
      true,
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('runtime status tool exposes executable command capabilities instead of a flat command list', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-runtime-tool-capabilities-'))

  try {
    await bootstrapReadyRuntime(directory)
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const statusTool = hooks.tool?.hivemind_runtime_status

    assert.ok(statusTool)

    const payload = JSON.parse(await statusTool.execute({} as never, {
      sessionID: 'ses_123',
      messageID: 'msg_123',
      agent: 'runtime-agent',
      directory,
      worktree: directory,
      abort: new AbortController().signal,
      metadata() {},
      async ask() {
        throw new Error('runtime status should not ask for permissions')
      },
    } as never))

    assert.equal(payload.workflowGateState.availableCommands.includes('hm-research'), true)
    assert.equal(payload.workflowGateState.commandCapabilities['hm-research'], 'handler')
    assert.equal(payload.workflowGateState.commandCapabilities['hm-verify'], 'handler')
    assert.equal(payload.workflowGateState.commandCapabilities['hm-tdd'], 'handler')
    assert.equal(payload.workflowGateState.commandCapabilities['hm-course-correct'], 'handler')
    assert.equal(payload.workflowGateState.commandCapabilities['hm-init'], 'control-plane')
    assert.equal(payload.capabilityMatrix.chainActions.support['handoff-packet'], 'live')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('runtime command hm-init redirect returns identity and readiness blocks for attached authority', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-runtime-tool-init-redirect-'))

  try {
    await bootstrapReadyRuntime(directory)
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const commandTool = hooks.tool?.hivemind_runtime_command

    assert.ok(commandTool)

    const payload = JSON.parse(await commandTool.execute({ command: 'hm-init' } as never, {
      sessionID: 'ses_123',
      messageID: 'msg_123',
      agent: 'runtime-agent',
      directory,
      worktree: directory,
      abort: new AbortController().signal,
      metadata() {},
      async ask() {
        throw new Error('runtime command should not ask for permissions on redirect')
      },
    } as never))

    assert.equal(payload.closeoutStatus, 'ready')
    assert.equal(payload.runtime_identity.cardId, 'hivemind-runtime-identity-v1')
    assert.equal(payload.runtime_identity.activeRuntimeAuthority, 'attached-sdk')
    assert.equal(payload.runtime_identity.routeDisposition, 'attach')
    assert.equal(payload.readiness_signal.cardId, 'hivemind-readiness-signal-v1')
    assert.equal(payload.readiness_signal.exactNextCommand, 'hm-harness')
    assert.equal(payload.report.runtime_identity.activeRuntimeAuthority, 'attached-sdk')
    assert.equal(payload.report.readiness_signal.readinessState, 'ready')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
