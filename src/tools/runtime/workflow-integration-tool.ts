import { buildWorkflowIntegrationState } from '../../hooks/workflow-integration/index.js'
import { routeWorkflow } from '../../core/workflow-management/index.js'
import type { HandoffRecord, WorkflowRecord } from '../../core/workflow-management/index.js'
import { success } from '../../shared/tool-response.js'
import { loadRuntimeToolInstruction } from './instruction-loader.js'
import type { RuntimeToolDefinition } from './runtime-tool-types.js'

export interface WorkflowIntegrationInput {
  workflow: WorkflowRecord
  handoff?: HandoffRecord
}

export const workflowIntegrationTool: RuntimeToolDefinition<
  WorkflowIntegrationInput,
  {
    decision: ReturnType<typeof routeWorkflow>
    continuity: ReturnType<typeof buildWorkflowIntegrationState>
  }
> = {
  id: 'workflow-integration',
  instructionFile: 'workflow-integration.txt',
  loadInstruction: () => loadRuntimeToolInstruction('workflow-integration'),
  async execute(input) {
    const decision = routeWorkflow(input.workflow)
    const continuity = buildWorkflowIntegrationState(input.workflow, input.handoff)
    const instruction = await loadRuntimeToolInstruction('workflow-integration')
    return success('Integrated workflow continuity and routing', { decision, continuity }, {
      tool: 'workflow-integration',
      instruction,
    })
  },
}
