/**
 * Agent-callable tool barrel export.
 *
 * Runtime hooks and slash-command orchestration no longer live here.
 * `src/tools` is reserved for actual execution limbs used by agents in-session.
 */

export * from './task/index.js'
export * from './trajectory/index.js'
export * from './handoff/index.js'
export * from './runtime/index.js'
export * from './doc/index.js'
import { getRuntimePressureContract, type RuntimePressureContract } from '../shared/pressure-contract.js'

export interface AgentToolCatalogEntry {
  id: string
  contractFile: string
  hostEvent: string
  workflowPhase: string
  purposeClasses: string[]
  stateAuthority: 'workflow' | 'trajectory' | 'delegation' | 'plugin-control-plane'
  pressureContract: RuntimePressureContract
}

export const agentToolCatalog: AgentToolCatalogEntry[] = [
  {
    id: 'hivemind_doc',
    contractFile: 'src/tools/doc/tools.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'doc-intelligence',
    purposeClasses: ['discovery', 'research', 'planning', 'gatekeeping'],
    stateAuthority: 'plugin-control-plane',
    pressureContract: getRuntimePressureContract('steady-state'),
  },
  {
    id: 'hivemind_task',
    contractFile: 'src/tools/task/tools.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'tool-execution',
    purposeClasses: ['implementation', 'gatekeeping', 'tdd', 'course-correction'],
    stateAuthority: 'workflow',
    pressureContract: getRuntimePressureContract('task-mutation'),
  },
  {
    id: 'hivemind_trajectory',
    contractFile: 'src/tools/trajectory/tools.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'trajectory-attachment',
    purposeClasses: ['planning', 'implementation', 'gatekeeping', 'course-correction'],
    stateAuthority: 'trajectory',
    pressureContract: getRuntimePressureContract('trajectory-control'),
  },
  {
    id: 'hivemind_handoff',
    contractFile: 'src/tools/handoff/tools.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'recovery-checkpoint',
    purposeClasses: ['research', 'implementation', 'gatekeeping', 'course-correction'],
    stateAuthority: 'delegation',
    pressureContract: getRuntimePressureContract('handoff-validation'),
  },
  {
    id: 'hivemind_runtime_status',
    contractFile: 'src/tools/runtime/tools.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'runtime-inspection',
    purposeClasses: ['discovery', 'gatekeeping'],
    stateAuthority: 'plugin-control-plane',
    pressureContract: getRuntimePressureContract('steady-state'),
  },
  {
    id: 'hivemind_runtime_command',
    contractFile: 'src/tools/runtime/tools.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'runtime-command',
    purposeClasses: ['implementation', 'course-correction'],
    stateAuthority: 'plugin-control-plane',
    pressureContract: getRuntimePressureContract('control-plane-repair'),
  },
  {
    id: 'hivemind_agent_work_create_contract',
    contractFile: 'src/features/agent-work-contract/tools/create-contract-tool.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'agent-work-contract',
    purposeClasses: ['planning', 'implementation', 'gatekeeping'],
    stateAuthority: 'workflow',
    pressureContract: getRuntimePressureContract('task-mutation'),
  },
  {
    id: 'hivemind_agent_work_export_contract',
    contractFile: 'src/features/agent-work-contract/tools/export-contract-tool.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'agent-work-contract',
    purposeClasses: ['planning', 'implementation', 'gatekeeping', 'course-correction'],
    stateAuthority: 'workflow',
    pressureContract: getRuntimePressureContract('steady-state'),
  },
  {
    id: 'hivemind_journal',
    contractFile: 'src/tools/hivemind-journal.ts',
    hostEvent: 'tool.call',
    workflowPhase: 'session-journal',
    purposeClasses: ['discovery', 'brainstorming', 'research', 'planning', 'implementation', 'gatekeeping', 'tdd', 'course-correction'],
    stateAuthority: 'plugin-control-plane',
    pressureContract: getRuntimePressureContract('steady-state'),
  },
]
