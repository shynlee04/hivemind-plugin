import type { WorkflowDecision, WorkflowRecord } from './workflow-types.js'

function resolveLoadStrategy(record: WorkflowRecord): WorkflowDecision['loadStrategy'] {
  if (record.scope === 'sub-session') {
    return 'bounded'
  }

  if (record.stage === 'initial') {
    return 'full'
  }

  return 'light'
}

export function routeWorkflow(record: WorkflowRecord): WorkflowDecision {
  const shouldDelegate = record.scope === 'main' && record.stage !== 'initial'

  return {
    workflowId: record.id,
    shouldDelegate,
    loadStrategy: resolveLoadStrategy(record),
  }
}
