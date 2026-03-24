/**
 * Synthesizer Tests — Plan #8 RED Phase
 *
 * Tests for the session synthesis generator: section renderers,
 * full synthesis composition, and I/O function (generateSessionSynthesis).
 *
 * These tests MUST fail until synthesizer.ts is implemented and
 * the new types (SynthesisInput, SynthesisTurnSummary, SynthesisDelegationEntry,
 * SynthesisEventEntry) are added to types.ts.
 *
 * @module event-tracker/writers/synthesizer.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type {
  SynthesisInput,
  SynthesisTurnSummary,
  SynthesisDelegationEntry,
  SynthesisEventEntry,
} from '../types.js'

import {
  renderSynthesisHeader,
  renderTurnSummaryTable,
  renderDelegationChain,
  renderKeyFindings,
  renderSynthesis,
  generateSessionSynthesis,
} from './synthesizer.js'

import { getSessionSynthesisPath } from '../paths.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTurnSummary(overrides: Partial<SynthesisTurnSummary> = {}): SynthesisTurnSummary {
  return {
    turnNumber: 1,
    agent: 'hivemaker',
    model: 'gpt-4',
    duration: 1200,
    delegationCount: 2,
    userMessagePreview: 'Tell me about the codebase structure.',
    ...overrides,
  }
}

function makeDelegation(overrides: Partial<SynthesisDelegationEntry> = {}): SynthesisDelegationEntry {
  return {
    packetId: 'pkt-001',
    delegatedTo: 'hivexplorer',
    subagentType: 'explore',
    status: 'completed',
    description: 'Investigate codebase structure',
    ...overrides,
  }
}

function makeEvent(overrides: Partial<SynthesisEventEntry> = {}): SynthesisEventEntry {
  return {
    turnNumber: 3,
    type: 'delegation_created',
    summary: 'dispatched to explore for codebase mapping',
    ...overrides,
  }
}

function makeSynthesisInput(overrides: Partial<SynthesisInput> = {}): SynthesisInput {
  return {
    sessionId: 'ses_abc123',
    lineage: 'hiveminder',
    purposeClass: 'planning',
    agent: 'hivemaker',
    status: 'active',
    created: '2026-03-24T10:00:00Z',
    updated: '2026-03-24T12:30:00Z',
    turns: [makeTurnSummary()],
    delegations: [makeDelegation()],
    highImportanceEvents: [makeEvent()],
    compactionCount: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// renderSynthesisHeader
// ---------------------------------------------------------------------------

test('renderSynthesisHeader includes all identity fields', () => {
  const input = makeSynthesisInput()
  const header = renderSynthesisHeader(input)

  assert.ok(header.includes('hiveminder'), 'should include lineage')
  assert.ok(header.includes('planning'), 'should include purpose class')
  assert.ok(header.includes('hivemaker'), 'should include agent')
  assert.ok(header.includes('active'), 'should include status')
  assert.ok(header.includes('2026-03-24T10:00:00Z'), 'should include created')
  assert.ok(header.includes('2026-03-24T12:30:00Z'), 'should include updated')
})

test('renderSynthesisHeader renders session ID in title', () => {
  const input = makeSynthesisInput({ sessionId: 'ses_xyz789' })
  const header = renderSynthesisHeader(input)

  assert.ok(header.includes('ses_xyz789'), 'should include session ID in output')
})

// ---------------------------------------------------------------------------
// renderTurnSummaryTable
// ---------------------------------------------------------------------------

test('renderTurnSummaryTable table includes all turns with agent model duration delegation count', () => {
  const turns = [
    makeTurnSummary({ turnNumber: 1, agent: 'hivemaker', model: 'gpt-4', duration: 1200, delegationCount: 2 }),
    makeTurnSummary({ turnNumber: 2, agent: 'hiveq', model: 'gpt-4', duration: 800, delegationCount: 0 }),
    makeTurnSummary({ turnNumber: 3, agent: 'hivemaker', model: 'gpt-4', duration: 2000, delegationCount: 1 }),
  ]

  const table = renderTurnSummaryTable(turns)

  assert.ok(table.includes('hivemaker'), 'should include agent name')
  assert.ok(table.includes('hiveq'), 'should include second agent')
  assert.ok(table.includes('gpt-4'), 'should include model')
  assert.ok(table.includes('1200'), 'should include duration')
  assert.ok(table.includes('2'), 'should include delegation count')
})

test('renderTurnSummaryTable null duration renders N/A', () => {
  const turns = [makeTurnSummary({ duration: null })]
  const table = renderTurnSummaryTable(turns)

  assert.ok(table.includes('N/A'), 'should render N/A for null duration')
})

test('renderTurnSummaryTable empty turns array renders no turns recorded message', () => {
  const table = renderTurnSummaryTable([])

  assert.ok(
    table.toLowerCase().includes('no turns') || table.toLowerCase().includes('no turns recorded'),
    'should indicate no turns recorded'
  )
})

// ---------------------------------------------------------------------------
// renderDelegationChain
// ---------------------------------------------------------------------------

test('renderDelegationChain each delegation shows delegatedTo subagentType status description', () => {
  const delegations = [
    makeDelegation({
      delegatedTo: 'hivexplorer',
      subagentType: 'explore',
      status: 'completed',
      description: 'Investigate codebase structure',
    }),
    makeDelegation({
      packetId: 'pkt-002',
      delegatedTo: 'hiveq',
      subagentType: 'general',
      status: 'active',
      description: 'Verify test coverage',
    }),
  ]

  const chain = renderDelegationChain(delegations)

  assert.ok(chain.includes('hivexplorer'), 'should include delegatedTo')
  assert.ok(chain.includes('explore'), 'should include subagentType')
  assert.ok(chain.includes('completed'), 'should include status')
  assert.ok(chain.includes('Investigate codebase structure'), 'should include description')
  assert.ok(chain.includes('hiveq'), 'should include second delegation target')
  assert.ok(chain.includes('active'), 'should include second status')
})

test('renderDelegationChain empty delegations array renders no delegations message', () => {
  const chain = renderDelegationChain([])

  assert.ok(
    chain.toLowerCase().includes('no delegation'),
    'should indicate no delegations'
  )
})

// ---------------------------------------------------------------------------
// renderKeyFindings
// ---------------------------------------------------------------------------

test('renderKeyFindings each event shows turn number type summary', () => {
  const events = [
    makeEvent({ turnNumber: 3, type: 'delegation_created', summary: 'dispatched to explore for codebase mapping' }),
    makeEvent({ turnNumber: 5, type: 'delegation_returned', summary: 'explore returned findings, 12 files analyzed' }),
  ]

  const findings = renderKeyFindings(events)

  assert.ok(findings.includes('3'), 'should include turn number')
  assert.ok(findings.includes('delegation_created'), 'should include event type')
  assert.ok(findings.includes('dispatched to explore'), 'should include summary')
  assert.ok(findings.includes('5'), 'should include second turn number')
  assert.ok(findings.includes('delegation_returned'), 'should include second event type')
})

test('renderKeyFindings empty events array renders no high-importance events message', () => {
  const findings = renderKeyFindings([])

  assert.ok(
    findings.toLowerCase().includes('no high-importance events') ||
    findings.toLowerCase().includes('no high-importance'),
    'should indicate no high-importance events'
  )
})

// ---------------------------------------------------------------------------
// renderSynthesis — full composition
// ---------------------------------------------------------------------------

test('renderSynthesis full input produces complete synthesis with all sections', () => {
  const input = makeSynthesisInput({
    turns: [
      makeTurnSummary({ turnNumber: 1 }),
      makeTurnSummary({ turnNumber: 2, agent: 'hiveq', delegationCount: 0 }),
    ],
    delegations: [makeDelegation()],
    highImportanceEvents: [makeEvent()],
    compactionCount: 0,
  })

  const synthesis = renderSynthesis(input)

  // Identity section
  assert.ok(synthesis.includes('ses_abc123'), 'should contain session ID')
  assert.ok(synthesis.includes('hiveminder'), 'should contain lineage')

  // Turn summary section
  assert.ok(synthesis.includes('hivemaker') || synthesis.includes('hiveq'), 'should contain agents')

  // Delegation chain section
  assert.ok(synthesis.includes('hivexplorer'), 'should contain delegation target')

  // Key findings section
  assert.ok(synthesis.includes('delegation_created'), 'should contain event type')

  // Should be substantial markdown
  assert.ok(synthesis.length > 100, 'synthesis should be substantial markdown')
})

test('renderSynthesis zero compactions shows 0 compaction count', () => {
  const input = makeSynthesisInput({ compactionCount: 0 })
  const synthesis = renderSynthesis(input)

  assert.ok(
    synthesis.includes('0') && (synthesis.toLowerCase().includes('compaction')),
    'should show 0 compaction(s)'
  )
})

test('renderSynthesis output is deterministic for same input', () => {
  const input = makeSynthesisInput()

  const synthesis1 = renderSynthesis(input)
  const synthesis2 = renderSynthesis(input)

  assert.equal(synthesis1, synthesis2, 'same input should produce identical output')
})

test('renderSynthesis with multiple compactions shows count', () => {
  const input = makeSynthesisInput({ compactionCount: 3 })
  const synthesis = renderSynthesis(input)

  assert.ok(synthesis.includes('3'), 'should show compaction count')
  assert.ok(synthesis.toLowerCase().includes('compaction'), 'should mention compaction')
})

// ---------------------------------------------------------------------------
// generateSessionSynthesis — I/O
// ---------------------------------------------------------------------------

test('generateSessionSynthesis writes synthesis.md to correct session path', async () => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'synth-test-'))
  try {
    const input = makeSynthesisInput({ sessionId: 'ses_io01' })

    await generateSessionSynthesis(tmpDir, input)

    const synthPath = getSessionSynthesisPath(tmpDir, 'ses_io01')
    const content = await readFile(synthPath, 'utf8')

    assert.ok(content.includes('ses_io01'), 'should contain session ID')
    assert.ok(content.length > 0, 'file should not be empty')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('generateSessionSynthesis overwrites existing synthesis.md', async () => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'synth-overwrite-'))
  try {
    // Write initial synthesis
    await generateSessionSynthesis(tmpDir, makeSynthesisInput({
      sessionId: 'ses_overwrite',
      turns: [makeTurnSummary({ turnNumber: 1, agent: 'old-agent' })],
    }))

    // Overwrite with new content
    await generateSessionSynthesis(tmpDir, makeSynthesisInput({
      sessionId: 'ses_overwrite',
      turns: [makeTurnSummary({ turnNumber: 1, agent: 'new-agent' })],
    }))

    const synthPath = getSessionSynthesisPath(tmpDir, 'ses_overwrite')
    const content = await readFile(synthPath, 'utf8')

    assert.ok(content.includes('new-agent'), 'should contain new agent')
    assert.ok(!content.includes('old-agent'), 'should NOT contain old agent after overwrite')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('generateSessionSynthesis creates session directory if missing', async () => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'synth-mkdir-'))
  try {
    const nestedRoot = path.join(tmpDir, 'deep', 'nested')

    await generateSessionSynthesis(nestedRoot, makeSynthesisInput({ sessionId: 'ses_deep' }))

    const synthPath = getSessionSynthesisPath(nestedRoot, 'ses_deep')
    const content = await readFile(synthPath, 'utf8')

    assert.ok(content.includes('ses_deep'), 'file should exist in nested session directory')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// SynthesisInput type — compilation gate
// ---------------------------------------------------------------------------

test('SynthesisInput type accepts valid shape with all fields', () => {
  const input: SynthesisInput = {
    sessionId: 'ses_type_check',
    lineage: 'hivefiver',
    purposeClass: 'research',
    agent: 'general',
    status: 'completed',
    created: '2026-03-23T00:00:00Z',
    updated: '2026-03-23T01:00:00Z',
    turns: [
      { turnNumber: 1, agent: 'general', model: 'gpt-4', duration: null, delegationCount: 0, userMessagePreview: 'hello' },
    ],
    delegations: [
      { packetId: 'pkt-1', delegatedTo: 'explore', subagentType: 'explore', status: 'completed', description: 'scan' },
    ],
    highImportanceEvents: [
      { turnNumber: 1, type: 'session_start', summary: 'session started' },
    ],
    compactionCount: 2,
  }

  assert.equal(input.sessionId, 'ses_type_check')
  assert.equal(input.lineage, 'hivefiver')
  assert.equal(input.compactionCount, 2)
  assert.equal(input.turns.length, 1)
  assert.equal(input.delegations.length, 1)
  assert.equal(input.highImportanceEvents.length, 1)
})
