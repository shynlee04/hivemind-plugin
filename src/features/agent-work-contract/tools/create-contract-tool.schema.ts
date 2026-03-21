/**
 * Schema definitions and constants for the create-contract tool.
 *
 * @module create-contract-tool/schema
 */

/**
 * Tool identifier for the create-contract tool.
 */
export const HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID = 'hivemind_agent_work_create_contract'

/**
 * Default chain action configuration for new contracts.
 */
export const DEFAULT_CHAIN_ACTIONS = {
  onTaskComplete: 'next-task',
  onWorkflowEnd: 'archive',
  onDelegation: 'handoff-packet',
  onCompaction80: 'launch-context-agent',
} as const

export interface CreateContractWorkflowTaskInput {
  id: string
  title: string
  status: 'pending' | 'active' | 'delegated' | 'verifying' | 'complete'
  parentTaskId?: string
  dependencyIds?: string[]
  delegationMode?: 'parallel' | 'sequential' | 'handoff'
  delegationSessionId?: string
  evidenceRefs?: string[]
}

export interface CreateContractWorkflowInput {
  planningPath?: string
  phase?: string
  outlineRef?: string
  tasks: CreateContractWorkflowTaskInput[]
}

export interface CreateContractChainActionsInput {
  onTaskComplete: 'export-workflow' | 'next-task' | 'close'
  onWorkflowEnd: 'export-contract' | 'archive'
  onDelegation: 'export-messages' | 'handoff-packet'
  onCompaction80: 'launch-context-agent' | 'export-summary'
}

export interface CreateContractBriefingInput {
  summary: string
  workflowState: string
  followUp: string[]
}

export interface CreateContractAnchorInput {
  timestamp: string
  kind: 'workflow-shift' | 'planning-shift' | 'stage-shift' | 'user-redirect'
  description: string
  snapshotRef?: string
}

export interface CreateContractToolArgs {
  action: 'create' | 'update'
  contractId?: string
  sessionId?: string
  rawIntent?: string
  delegationExportSessionId?: string
  responseMode?: 'broad-search-execute' | 'interactive-qa' | 'deep-research'
  workflow?: CreateContractWorkflowInput
  chainActions?: CreateContractChainActionsInput
  briefing?: CreateContractBriefingInput
  anchors?: CreateContractAnchorInput[]
}
