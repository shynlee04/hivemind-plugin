import {
  contextInjectionHookBridge,
  promptTransformationHookBridge,
  runtimeLoaderHookBridge,
  workflowIntegrationHookBridge,
} from '../hooks/runtime-bridge/index.js'
import { discoverSlashCommandBundles } from '../commands/slash-command/index.js'
import { agentToolCatalog } from '../tools/index.js'
import { getRuntimePressureContract } from '../shared/pressure-contract.js'
import type { RuntimeSurfaceEntry } from './plugin-types.js'

const hookBridgeMetadata: Record<string, Pick<RuntimeSurfaceEntry, 'hostEvent' | 'workflowPhase' | 'purposeClasses' | 'stateAuthority' | 'pressureContract'>> = {
  'context-injection': {
    hostEvent: 'experimental.chat.messages.transform',
    workflowPhase: 'prompt-transform',
    purposeClasses: ['research', 'planning', 'implementation', 'gatekeeping', 'tdd', 'course-correction'],
    stateAuthority: 'session-envelope',
    pressureContract: getRuntimePressureContract('steady-state'),
  },
  'prompt-transformation': {
    hostEvent: 'experimental.chat.messages.transform',
    workflowPhase: 'prompt-transform',
    purposeClasses: ['research', 'planning', 'implementation', 'gatekeeping', 'tdd', 'course-correction'],
    stateAuthority: 'session-envelope',
    pressureContract: getRuntimePressureContract('steady-state'),
  },
  'runtime-loader': {
    hostEvent: 'shell.env',
    workflowPhase: 'governance-projection',
    purposeClasses: ['planning', 'implementation', 'gatekeeping', 'course-correction'],
    stateAuthority: 'plugin-control-plane',
    pressureContract: getRuntimePressureContract('workflow-readiness'),
  },
  'workflow-integration': {
    hostEvent: 'command.execute.before',
    workflowPhase: 'command-transition',
    purposeClasses: ['planning', 'implementation', 'gatekeeping', 'tdd', 'course-correction'],
    stateAuthority: 'workflow',
    pressureContract: getRuntimePressureContract('workflow-readiness'),
  },
}

/**
 * Build the live runtime surface registry for the revamp lane.
 *
 * @returns The registered hook, command, and tool surfaces with event, phase, safety, and evidence metadata.
 */
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
    ...hookBridgeMetadata[bridge.id],
  }))

  const slashCommands: RuntimeSurfaceEntry[] = discoverSlashCommandBundles().map((bundle) => ({
    id: bundle.id,
    kind: 'slash-command',
    contractFile: bundle.commandFile,
    hostEvent: bundle.hostEvent,
    workflowPhase: bundle.workflowPhase,
    purposeClasses: bundle.purposeClasses,
    stateAuthority: bundle.stateAuthority,
    pressureContract: bundle.pressureContract,
  }))

  const agentTools: RuntimeSurfaceEntry[] = agentToolCatalog.map((tool) => ({
    id: tool.id,
    kind: 'agent-tool',
    contractFile: tool.contractFile,
    hostEvent: tool.hostEvent,
    workflowPhase: tool.workflowPhase,
    purposeClasses: tool.purposeClasses,
    stateAuthority: tool.stateAuthority,
    pressureContract: tool.pressureContract,
  }))

  const runtimeAdminTools: RuntimeSurfaceEntry[] = [
    {
      id: 'hivemind_runtime_status',
      kind: 'agent-tool',
      contractFile: 'src/plugin/opencode-plugin.ts',
      hostEvent: 'tool.call',
      workflowPhase: 'governance-projection',
      purposeClasses: ['planning', 'implementation', 'gatekeeping', 'course-correction'],
      stateAuthority: 'plugin-control-plane',
      pressureContract: getRuntimePressureContract('steady-state'),
    },
    {
      id: 'hivemind_runtime_command',
      kind: 'agent-tool',
      contractFile: 'src/plugin/opencode-plugin.ts',
      hostEvent: 'tool.call',
      workflowPhase: 'command-transition',
      purposeClasses: ['planning', 'implementation', 'gatekeeping', 'tdd', 'course-correction'],
      stateAuthority: 'plugin-control-plane',
      pressureContract: getRuntimePressureContract('workflow-readiness'),
    },
  ]

  return [...hookBridges, ...slashCommands, ...runtimeAdminTools, ...agentTools]
}
