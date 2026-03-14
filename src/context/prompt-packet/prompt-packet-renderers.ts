import type { NormalizedPromptPacketState } from './prompt-packet-normalize.js'

function summarize(values: string[]): string {
  return values.join(', ')
}

export function renderMainSystemPacket(state: NormalizedPromptPacketState): string {
  return [
    '<hivemind-kernel-packet>',
    'packet_version=runtime-v1',
    `session_scope=${state.sessionScope}`,
    `session_class=${state.sessionClass}`,
    `lineage=${state.lineage}`,
    `session_id=${state.sessionId}`,
    `trajectory=${state.trajectoryId}`,
    `workflow=${state.workflowId}`,
    `task_ids=${summarize(state.taskIds)}`,
    `subtask_ids=${summarize(state.subtaskIds)}`,
    `checkpoint_id=${state.checkpointId}`,
    `todo_chain=${state.todoChainId}`,
    `branch_focus=${state.branchFocus}`,
    `governance_mode=${state.governanceMode}`,
    `automation_level=${state.automationLevel}`,
    `language=${state.language}`,
    `artifact_language=${state.artifactLanguage}`,
    `expert_level=${state.expertLevel}`,
    `output_style=${state.outputStyle}`,
    `verification_contract=${state.verificationContract}`,
    `guardrails=${summarize(state.guardrails)}`,
    `facilitators=${summarize(state.facilitators)}`,
    `mcp_readiness=${summarize(state.mcpReadiness)}`,
    `hivebrain=${summarize(state.hivebrainDigest)}`,
    'delegation_posture=main-session owns todo, verification, and branch routing',
    '</hivemind-kernel-packet>',
  ].join('\n')
}

export function renderSubsessionSystemPacket(state: NormalizedPromptPacketState): string {
  return [
    '<hivemind-delegation-packet>',
    'packet_version=runtime-v1',
    `session_scope=${state.sessionScope}`,
    `session_class=${state.sessionClass}`,
    `lineage=${state.lineage}`,
    `session_id=${state.sessionId}`,
    `parent_session_id=${state.parentSessionId ?? 'unknown'}`,
    `trajectory=${state.trajectoryId}`,
    `workflow=${state.workflowId}`,
    `task_ids=${summarize(state.taskIds)}`,
    `subtask_ids=${summarize(state.subtaskIds)}`,
    `checkpoint_id=${state.checkpointId}`,
    `branch_focus=${state.branchFocus}`,
    `governance_mode=${state.governanceMode}`,
    `artifact_language=${state.artifactLanguage}`,
    `guardrails=${summarize(state.guardrails)}`,
    `facilitators=${summarize(state.facilitators)}`,
    `mcp_readiness=${summarize(state.mcpReadiness)}`,
    `hivebrain=${summarize(state.hivebrainDigest)}`,
    'delegation_inheritance=bounded-minimal-refresh',
    'todo_authority=main-session-only unless explicitly escalated',
    `return_contract=${state.returnContract}`,
    '</hivemind-delegation-packet>',
  ].join('\n')
}

export function renderMainMessagePacket(state: NormalizedPromptPacketState): string {
  return [
    '<hivemind-lineage-refresh>',
    `session_scope=${state.sessionScope}`,
    `session_class=${state.sessionClass}`,
    `lineage=${state.lineage}`,
    `session_id=${state.sessionId}`,
    `trajectory=${state.trajectoryId}`,
    `workflow=${state.workflowId}`,
    `task_ids=${summarize(state.taskIds)}`,
    `todo_chain=${state.todoChainId}`,
    `branch_focus=${state.branchFocus}`,
    'delegation_posture=main-session remains the todo and verification authority',
    '</hivemind-lineage-refresh>',
  ].join('\n')
}

export function renderSubsessionMessagePacket(state: NormalizedPromptPacketState): string {
  return [
    '<hivemind-delegation-refresh>',
    `session_scope=${state.sessionScope}`,
    `session_class=${state.sessionClass}`,
    `lineage=${state.lineage}`,
    `parent_session_id=${state.parentSessionId ?? 'unknown'}`,
    `trajectory=${state.trajectoryId}`,
    `workflow=${state.workflowId}`,
    `task_ids=${summarize(state.taskIds)}`,
    `branch_focus=${state.branchFocus}`,
    'todo_authority=main-session-only',
    `return_contract=${state.returnContract}`,
    '</hivemind-delegation-refresh>',
  ].join('\n')
}
