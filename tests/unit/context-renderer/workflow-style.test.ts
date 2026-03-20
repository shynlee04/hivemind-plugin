import assert from 'node:assert/strict'
import test from 'node:test'

import {
  detectWorkflowStyle,
  renderTDDCompaction,
  renderBMADCompaction,
  renderResearchCompaction,
  renderDefaultCompaction,
  createHivemindContextPacket,
} from '../../../src/plugin/context-renderer.js'
import type { CompactionPreservationPacket } from '../../../src/features/agent-work-contract/schema/contract.js'

/**
 * Mock runtime snapshot for testing
 */
function createMockSnapshot() {
  return {
    trajectoryId: 'traj_001',
    taskIds: ['tsk_001', 'tsk_002'],
    entryState: 'active',
    defaultLineage: 'main',
    defaultPurposeClass: 'project-driven',
    governanceMode: 'standard',
    language: 'en',
    workflowId: 'wf_001',
  }
}

/**
 * Mock agent work packet for TDD workflow
 */
function createTDDMockAgentWorkPacket(): CompactionPreservationPacket & { lastTestStatus?: string; lastTestFile?: string; testCountRun?: number; testCountPass?: number; nextAction?: string } {
  return {
    contractId: 'c_tdd_001',
    sessionId: 'sess_tdd_001',
    purposeClass: 'project-driven',
    responseMode: 'broad-search-execute',
    workflowPhase: 'test-driven',
    activeTaskIds: ['tsk_010'],
    pendingTaskIds: ['tsk_009'],
    briefingSummary: 'Implementing feature X using TDD',
    followUp: ['complete_test', 'write_impl'],
    recentAnchorDescriptions: ['test_write:2026-03-21T10:00:00Z'],
    compactionAction: 'launch-context-agent',
    lastTestStatus: 'failing',
    lastTestFile: 'src/utils.test.ts',
    testCountRun: 14,
    testCountPass: 12,
    nextAction: 'write_implementation_to_pass_failing_test',
  }
}

/**
 * Mock agent work packet for BMAD workflow
 */
function createBMADMockAgentWorkPacket(): CompactionPreservationPacket & { currentPhase?: string; phaseSequence?: string[]; completedPhases?: string[]; pendingDecisions?: number; decisionRefs?: string[]; nextArtifact?: string } {
  return {
    contractId: 'c_bmad_001',
    sessionId: 'sess_bmad_001',
    purposeClass: 'project-driven',
    responseMode: 'broad-search-execute',
    workflowPhase: 'implementation',
    activeTaskIds: ['tsk_010'],
    pendingTaskIds: [],
    briefingSummary: 'BMAD workflow implementation',
    followUp: ['review', 'deploy'],
    recentAnchorDescriptions: ['phase_shift:2026-03-21T09:00:00Z'],
    compactionAction: 'export-summary',
    currentPhase: 'implementation',
    phaseSequence: ['discovery', 'planning', 'implementation', 'review'],
    completedPhases: ['discovery', 'planning'],
    pendingDecisions: 3,
    decisionRefs: ['dec_001', 'dec_002', 'dec_003'],
    nextArtifact: 'implementation/feature-x/impl.ts',
  }
}

/**
 * Mock agent work packet for research workflow
 */
function createResearchMockAgentWorkPacket(): CompactionPreservationPacket & { researchDepth?: string; sourcesConsulted?: string[]; keyFindings?: string[] } {
  return {
    contractId: 'c_research_001',
    sessionId: 'sess_research_001',
    purposeClass: 'research-brainstorm',
    responseMode: 'deep-research',
    workflowPhase: 'investigation',
    activeTaskIds: ['tsk_020'],
    pendingTaskIds: ['tsk_021'],
    briefingSummary: 'Deep research on AI trends',
    followUp: ['synthesize', 'present'],
    recentAnchorDescriptions: ['source_found:2026-03-21T08:00:00Z'],
    compactionAction: 'export-summary',
    researchDepth: 'comprehensive',
    sourcesConsulted: ['arxiv', 'hackernews', 'tech blogs'],
    keyFindings: ['LLM reasoning improving', 'cost decreasing'],
  }
}

test('detectWorkflowStyle returns "tdd" for TDD workflow phase', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'test_session',
    snapshot: createMockSnapshot(),
    agentWorkPacket: createTDDMockAgentWorkPacket(),
  })
  const style = detectWorkflowStyle(packet)
  assert.equal(style, 'tdd')
})

test('detectWorkflowStyle returns "bmad" for project-driven with BMAD phase', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'test_session',
    snapshot: createMockSnapshot(),
    agentWorkPacket: createBMADMockAgentWorkPacket(),
  })
  const style = detectWorkflowStyle(packet)
  assert.equal(style, 'bmad')
})

test('detectWorkflowStyle returns "research" for research-brainstorm purposeClass', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'test_session',
    snapshot: createMockSnapshot(),
    agentWorkPacket: createResearchMockAgentWorkPacket(),
  })
  const style = detectWorkflowStyle(packet)
  assert.equal(style, 'research')
})

test('detectWorkflowStyle returns "default" for quick-action purposeClass', () => {
  const quickActionPacket: CompactionPreservationPacket = {
    contractId: 'c_quick_001',
    sessionId: 'sess_quick_001',
    purposeClass: 'quick-action',
    responseMode: 'interactive-qa',
    workflowPhase: 'execution',
    activeTaskIds: [],
    pendingTaskIds: [],
    briefingSummary: 'Quick fix',
    followUp: [],
    recentAnchorDescriptions: [],
    compactionAction: 'export-summary',
  }
  const packet = createHivemindContextPacket({
    sessionId: 'test_session',
    snapshot: createMockSnapshot(),
    agentWorkPacket: quickActionPacket,
  })
  const style = detectWorkflowStyle(packet)
  assert.equal(style, 'default')
})

test('detectWorkflowStyle returns "default" when no agentWorkPacket provided', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'test_session',
    snapshot: createMockSnapshot(),
  })
  const style = detectWorkflowStyle(packet)
  assert.equal(style, 'default')
})

test('renderTDDCompaction outputs correct XML structure', () => {
  const agentWorkPacket = createTDDMockAgentWorkPacket()
  const packet = createHivemindContextPacket({
    sessionId: 'sess_tdd_001',
    snapshot: createMockSnapshot(),
    agentWorkPacket,
  })

  const output = renderTDDCompaction(packet)

  assert.ok(output.includes('<hivemind-compaction workflow_style=\'tdd\'>'))
  assert.ok(output.includes("last_test_status='failing'"))
  assert.ok(output.includes("last_test_file='src/utils.test.ts'"))
  assert.ok(output.includes('test_count_run=14'))
  assert.ok(output.includes('test_count_pass=12'))
  assert.ok(output.includes('next_action=write_implementation_to_pass_failing_test'))
  assert.ok(output.includes('pending_task_ids='))
  assert.ok(output.includes('</hivemind-compaction>'))
})

test('renderTDDCompaction handles missing TDD fields gracefully', () => {
  const minimalPacket: CompactionPreservationPacket = {
    contractId: 'c_min_001',
    sessionId: 'sess_min_001',
    purposeClass: 'project-driven',
    responseMode: 'broad-search-execute',
    workflowPhase: 'test-driven',
    activeTaskIds: [],
    pendingTaskIds: [],
    briefingSummary: 'TDD task',
    followUp: [],
    recentAnchorDescriptions: [],
    compactionAction: 'launch-context-agent',
  }
  const packet = createHivemindContextPacket({
    sessionId: 'sess_min_001',
    snapshot: createMockSnapshot(),
    agentWorkPacket: minimalPacket,
  })

  const output = renderTDDCompaction(packet)

  assert.ok(output.includes('<hivemind-compaction workflow_style=\'tdd\'>'))
  assert.ok(output.includes('</hivemind-compaction>'))
})

test('renderBMADCompaction outputs correct XML structure', () => {
  const agentWorkPacket = createBMADMockAgentWorkPacket()
  const packet = createHivemindContextPacket({
    sessionId: 'sess_bmad_001',
    snapshot: createMockSnapshot(),
    agentWorkPacket,
  })

  const output = renderBMADCompaction(packet)

  assert.ok(output.includes('<hivemind-compaction workflow_style=\'bmad\'>'))
  assert.ok(output.includes("current_phase='implementation'"))
  assert.ok(output.includes('phase_sequence='))
  assert.ok(output.includes('completed_phases='))
  assert.ok(output.includes('pending_decisions=3'))
  assert.ok(output.includes('decision_refs='))
  assert.ok(output.includes('active_task_ids='))
  assert.ok(output.includes('next_artifact='))
  assert.ok(output.includes('</hivemind-compaction>'))
})

test('renderBMADCompaction includes recent anchors', () => {
  const agentWorkPacket = createBMADMockAgentWorkPacket()
  const packet = createHivemindContextPacket({
    sessionId: 'sess_bmad_001',
    snapshot: createMockSnapshot(),
    agentWorkPacket,
  })

  const output = renderBMADCompaction(packet)

  assert.ok(output.includes('recent_anchors='))
  assert.ok(output.includes('phase_shift:2026-03-21T09:00:00Z'))
})

test('renderResearchCompaction outputs correct XML structure', () => {
  const agentWorkPacket = createResearchMockAgentWorkPacket()
  const packet = createHivemindContextPacket({
    sessionId: 'sess_research_001',
    snapshot: createMockSnapshot(),
    agentWorkPacket,
  })

  const output = renderResearchCompaction(packet)

  assert.ok(output.includes('<hivemind-compaction workflow_style=\'research\'>'))
  assert.ok(output.includes("purpose='research-brainstorm'"))
  assert.ok(output.includes('research_depth='))
  assert.ok(output.includes('sources_consulted='))
  assert.ok(output.includes('key_findings='))
  assert.ok(output.includes('pending_task_ids='))
  assert.ok(output.includes('</hivemind-compaction>'))
})

test('renderDefaultCompaction outputs standard context format', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'sess_default_001',
    snapshot: createMockSnapshot(),
  })

  const output = renderDefaultCompaction(packet)

  assert.ok(output.includes('<hivemind-compaction workflow_style=\'default\'>'))
  assert.ok(output.includes('session_id='))
  assert.ok(output.includes('purpose='))
  assert.ok(output.includes('</hivemind-compaction>'))
})

test('renderDefaultCompaction falls back for quick-action', () => {
  const quickActionPacket: CompactionPreservationPacket = {
    contractId: 'c_quick_001',
    sessionId: 'sess_quick_001',
    purposeClass: 'quick-action',
    responseMode: 'interactive-qa',
    workflowPhase: 'execution',
    activeTaskIds: [],
    pendingTaskIds: [],
    briefingSummary: 'Quick task',
    followUp: [],
    recentAnchorDescriptions: [],
    compactionAction: 'export-summary',
  }
  const packet = createHivemindContextPacket({
    sessionId: 'sess_quick_001',
    snapshot: createMockSnapshot(),
    agentWorkPacket: quickActionPacket,
  })

  const output = renderDefaultCompaction(packet)

  assert.ok(output.includes('<hivemind-compaction workflow_style=\'default\'>'))
})
