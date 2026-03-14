import { buildWorkflowIntegrationState } from '../../hooks/workflow-integration/index.js'
import { routeWorkflow } from '../../core/workflow-management/index.js'
import type { HandoffRecord, WorkflowRecord } from '../../core/workflow-management/index.js'
import { success } from '../../shared/tool-response.js'
import { loadRuntimeHookInstruction } from './instruction-loader.js'
import type { RuntimeHookBridgeDefinition } from './hook-bridge-types.js'

export interface WorkflowIntegrationInput {
  workflow: WorkflowRecord
  handoff?: HandoffRecord
}

export const workflowIntegrationHookBridge: RuntimeHookBridgeDefinition<
  WorkflowIntegrationInput,
  {
    decision: ReturnType<typeof routeWorkflow>
    continuity: ReturnType<typeof buildWorkflowIntegrationState>
  }
> = {
  id: 'workflow-integration',
  instructionFile: 'workflow-integration.txt',
  loadInstruction: () => loadRuntimeHookInstruction('workflow-integration'),
  async execute(input) {
    const decision = routeWorkflow(input.workflow)
    const continuity = buildWorkflowIntegrationState(input.workflow, input.handoff)
    const instruction = await loadRuntimeHookInstruction('workflow-integration')
    return success('Integrated workflow continuity and routing', { decision, continuity }, {
      hook: 'workflow-integration',
      instruction,
    })
  },
}
