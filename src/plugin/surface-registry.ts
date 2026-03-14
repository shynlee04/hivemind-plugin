import {
  contextInjectionHookBridge,
  promptTransformationHookBridge,
  runtimeLoaderHookBridge,
  workflowIntegrationHookBridge,
} from '../hooks/runtime-bridge/index.js'
import { discoverSlashCommandBundles } from '../commands/slash-command/index.js'
import { agentToolCatalog } from '../tools/index.js'
import type { RuntimeSurfaceEntry } from './plugin-types.js'

export function createRuntimeSurfaceRegistry(): RuntimeSurfaceEntry[] {
  const hookBridges: RuntimeSurfaceEntry[] = [
    contextInjectionHookBridge,
    promptTransformationHookBridge,
    runtimeLoaderHookBridge,
    workflowIntegrationHookBridge,
  ].map((bridge) => ({
    id: bridge.id,
    kind: 'hook-bridge',
    contractFile: bridge.instructionFile,
  }))

  const slashCommands: RuntimeSurfaceEntry[] = discoverSlashCommandBundles().map((bundle) => ({
    id: bundle.id,
    kind: 'slash-command',
    contractFile: bundle.commandFile,
  }))

  const agentTools: RuntimeSurfaceEntry[] = agentToolCatalog.map((tool) => ({
    id: tool.id,
    kind: 'agent-tool',
    contractFile: tool.contractFile,
  }))

  const runtimeAdminTools: RuntimeSurfaceEntry[] = [
    { id: 'hivemind_runtime_status', kind: 'agent-tool', contractFile: 'src/plugin/opencode-plugin.ts' },
    { id: 'hivemind_runtime_command', kind: 'agent-tool', contractFile: 'src/plugin/opencode-plugin.ts' },
  ]

  return [...hookBridges, ...slashCommands, ...runtimeAdminTools, ...agentTools]
}
