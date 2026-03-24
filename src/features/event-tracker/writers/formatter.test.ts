/**
 * Formatter Tests — Plan #7 Gap Fixes
 *
 * Tests for the formatter module: truncateForDisplay, truncateForIndex,
 * formatTurnSection, and formatCompactionEvent.
 *
 * @module event-tracker/writers/formatter.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import type { ParsedTurn } from '../parser/types.js'

// Runtime import
import {
  truncateForDisplay,
  truncateForIndex,
  formatTurnSection,
  formatCompactionEvent,
} from './formatter.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTurn(overrides: Partial<ParsedTurn> = {}): ParsedTurn {
  return {
    turnNumber: 1,
    userMessage: 'Tell me about the codebase.',
    assistantContent: 'Here is an overview of the codebase structure.',
    thinking: null,
    agentName: 'Hiveminder',
    model: 'mimo-v2-pro-free',
    duration: 3200,
    isCompaction: false,
    delegationTargets: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// truncateForDisplay
// ---------------------------------------------------------------------------

test('truncateForDisplay returns empty string for empty input', () => {
  const result = truncateForDisplay('')
  assert.equal(result, '')
})

test('truncateForDisplay returns short string unchanged', () => {
  const input = 'short text'
  const result = truncateForDisplay(input)
  assert.equal(result, input)
})

test('truncateForDisplay returns string at exactly 500 chars unchanged', () => {
  const input = 'x'.repeat(500)
  const result = truncateForDisplay(input)
  assert.equal(result, input)
  assert.equal(result.length, 500)
})

test('truncateForDisplay truncates string over 500 chars to exactly 500 total', () => {
  const input = 'x'.repeat(600)
  const result = truncateForDisplay(input)
  assert.equal(result.length, 500, 'result should be exactly 500 chars (499 content + ellipsis)')
  assert.ok(result.endsWith('…'), 'result should end with ellipsis')
})

test('truncateForDisplay respects custom maxChars — exact total', () => {
  const input = 'a'.repeat(200)
  const result = truncateForDisplay(input, 100)
  assert.ok(result.endsWith('…'), 'result should end with ellipsis')
  assert.equal(result.length, 100, 'result should be exactly 100 chars (99 content + ellipsis)')
})

test('truncateForDisplay handles very long string (10000 chars)', () => {
  const input = 'z'.repeat(10000)
  const result = truncateForDisplay(input)
  assert.equal(result.length, 500, 'should truncate to exactly 500 chars')
  assert.ok(result.endsWith('…'), 'should end with ellipsis')
})

// ---------------------------------------------------------------------------
// truncateForIndex
// ---------------------------------------------------------------------------

test('truncateForIndex returns empty string for empty input', () => {
  const result = truncateForIndex('')
  assert.equal(result, '')
})

test('truncateForIndex truncates string over 200 chars to exactly 200 total', () => {
  const input = 'b'.repeat(300)
  const result = truncateForIndex(input)
  assert.ok(result.endsWith('…'), 'result should end with ellipsis')
  assert.equal(result.length, 200, 'result should be exactly 200 chars (199 content + ellipsis)')
})

test('truncateForIndex returns string at exactly 200 chars unchanged', () => {
  const input = 'c'.repeat(200)
  const result = truncateForIndex(input)
  assert.equal(result, input)
  assert.equal(result.length, 200)
})

test('truncateForIndex respects custom maxChars — exact total', () => {
  const input = 'd'.repeat(200)
  const result = truncateForIndex(input, 50)
  assert.ok(result.endsWith('…'), 'result should end with ellipsis')
  assert.equal(result.length, 50, 'result should be exactly 50 chars (49 content + ellipsis)')
})

// ---------------------------------------------------------------------------
// formatTurnSection — core
// ---------------------------------------------------------------------------

test('formatTurnSection produces deterministic markdown block with all sections', () => {
  const turn = makeTurn({ turnNumber: 3, agentName: 'Hiveminder', model: 'mimo-v2-pro-free' })
  const result = formatTurnSection(turn)

  assert.match(result, /## Turn 3/)
  assert.match(result, /\*\*Agent:\*\* Hiveminder · mimo-v2-pro-free/)
  assert.match(result, /\*\*Duration:\*\* 3200ms/)
  assert.match(result, /\*\*User:\*\*/)
  assert.match(result, /\*\*Assistant:\*\*/)
})

test('formatTurnSection shows N/A for null duration', () => {
  const turn = makeTurn({ duration: null })
  const result = formatTurnSection(turn)

  assert.match(result, /\*\*Duration:\*\* N\/A/)
})

test('formatTurnSection truncates long user message to 200 chars', () => {
  const longMessage = 'u'.repeat(500)
  const turn = makeTurn({ userMessage: longMessage })
  const result = formatTurnSection(turn)

  // Extract the User section content — it should contain at most 200 chars + ellipsis
  const userSection = result.split('**User:**')[1]?.split('**Assistant:**')[0] ?? ''
  assert.ok(userSection.length <= 210, 'user section content should be truncated')
  assert.ok(userSection.includes('…'), 'user section should contain ellipsis for truncation')
})

test('formatTurnSection truncates long assistant content to 500 chars', () => {
  const longContent = 'a'.repeat(1000)
  const turn = makeTurn({ assistantContent: longContent })
  const result = formatTurnSection(turn)

  // Extract the Assistant section content
  const assistantSection = result.split('**Assistant:**')[1] ?? ''
  assert.ok(assistantSection.length <= 520, 'assistant section content should be truncated')
  assert.ok(assistantSection.includes('…'), 'assistant section should contain ellipsis for truncation')
})

test('formatTurnSection output is grep-friendly with stable headers', () => {
  const turn = makeTurn({ turnNumber: 7 })
  const result = formatTurnSection(turn)

  // Verify the output starts with the turn header for grep stability
  assert.ok(result.startsWith('## Turn 7'), 'should start with turn header')
})

// ---------------------------------------------------------------------------
// formatTurnSection — delegations (Gap 2)
// ---------------------------------------------------------------------------

test('formatTurnSection renders ### Delegations when turn has delegation targets', () => {
  const turn = makeTurn({
    delegationTargets: [
      { delegatedTo: 'hivexplorer', description: 'Explore the codebase', subagentType: 'explore', packetId: 'pkt-001' },
    ],
  })
  const result = formatTurnSection(turn)

  assert.ok(result.includes('### Delegations'), 'should include Delegations heading')
  assert.ok(result.includes('**hivexplorer**'), 'should list delegation target name')
  assert.ok(result.includes('Explore the codebase'), 'should include delegation description')
  assert.ok(result.includes('(explore)'), 'should include subagent type in parens')
})

test('formatTurnSection does not render delegation section when targets are empty', () => {
  const turn = makeTurn({ delegationTargets: [] })
  const result = formatTurnSection(turn)

  assert.ok(!result.includes('### Delegations'), 'should NOT include Delegations heading')
})

test('formatTurnSection renders multiple delegation targets as a list', () => {
  const turn = makeTurn({
    delegationTargets: [
      { delegatedTo: 'hivexplorer', description: 'Scan files', subagentType: 'explore', packetId: null },
      { delegatedTo: 'hiveq', description: 'Verify changes', subagentType: 'general', packetId: 'pkt-002' },
    ],
  })
  const result = formatTurnSection(turn)

  assert.ok(result.includes('### Delegations'), 'should include Delegations heading')
  assert.ok(result.includes('**hivexplorer**'), 'should list first target')
  assert.ok(result.includes('**hiveq**'), 'should list second target')
  // Verify delegation section appears after Assistant section
  const assistantIdx = result.indexOf('**Assistant:**')
  const delegationIdx = result.indexOf('### Delegations')
  assert.ok(delegationIdx > assistantIdx, 'Delegations section should come after Assistant')
})

test('formatTurnSection delegation entry omits empty description gracefully', () => {
  const turn = makeTurn({
    delegationTargets: [
      { delegatedTo: 'worker', description: '', subagentType: 'general', packetId: null },
    ],
  })
  const result = formatTurnSection(turn)

  assert.ok(result.includes('### Delegations'), 'should include heading')
  assert.ok(result.includes('**worker**'), 'should list target')
  assert.ok(!result.includes('—  ('), 'should not render empty description dash')
})

// ---------------------------------------------------------------------------
// formatCompactionEvent — core
// ---------------------------------------------------------------------------

test('formatCompactionEvent produces markdown block with compaction header', () => {
  const turn = makeTurn({ isCompaction: true, agentName: 'Hiveminder', model: 'mimo-v2-pro-free' })
  const result = formatCompactionEvent(turn)

  assert.match(result, /## Compaction/)
  assert.match(result, /\*\*Agent:\*\* Hiveminder · mimo-v2-pro-free/)
})

test('formatCompactionEvent shows N/A for null duration', () => {
  const turn = makeTurn({ isCompaction: true, duration: null })
  const result = formatCompactionEvent(turn)

  assert.match(result, /\*\*Duration:\*\* N\/A/)
})

test('formatCompactionEvent shows duration in ms when present', () => {
  const turn = makeTurn({ isCompaction: true, duration: 1500 })
  const result = formatCompactionEvent(turn)

  assert.match(result, /\*\*Duration:\*\* 1500ms/)
})

test('formatCompactionEvent output is grep-friendly', () => {
  const turn = makeTurn({ isCompaction: true })
  const result = formatCompactionEvent(turn)

  assert.ok(result.startsWith('## Compaction'), 'should start with compaction header')
})

// ---------------------------------------------------------------------------
// formatCompactionEvent — enriched fields (Gap 1)
// ---------------------------------------------------------------------------

test('formatCompactionEvent includes Timestamp field', () => {
  const turn = makeTurn({
    isCompaction: true,
    timestamp: '2026-03-24T10:00:00Z',
  } as any)
  const result = formatCompactionEvent(turn)

  assert.match(result, /\*\*Timestamp:\*\* 2026-03-24T10:00:00Z/)
})

test('formatCompactionEvent defaults Timestamp to N/A when missing', () => {
  const turn = makeTurn({ isCompaction: true })
  const result = formatCompactionEvent(turn)

  assert.match(result, /\*\*Timestamp:\*\* N\/A/)
})

test('formatCompactionEvent includes Before section when beforeSummary present', () => {
  const turn = makeTurn({
    isCompaction: true,
    beforeSummary: 'Session had 45 messages consuming 12000 tokens',
  } as any)
  const result = formatCompactionEvent(turn)

  assert.ok(result.includes('**Before:**'), 'should include Before heading')
  assert.ok(result.includes('Session had 45 messages'), 'should include beforeSummary content')
})

test('formatCompactionEvent includes After section when afterSummary present', () => {
  const turn = makeTurn({
    isCompaction: true,
    afterSummary: 'Compacted to 8 messages with 2000 tokens',
  } as any)
  const result = formatCompactionEvent(turn)

  assert.ok(result.includes('**After:**'), 'should include After heading')
  assert.ok(result.includes('Compacted to 8 messages'), 'should include afterSummary content')
})

test('formatCompactionEvent includes both Before and After when both present', () => {
  const turn = makeTurn({
    isCompaction: true,
    timestamp: '2026-03-24T12:00:00Z',
    beforeSummary: 'Before: 50 msgs',
    afterSummary: 'After: 5 msgs',
  } as any)
  const result = formatCompactionEvent(turn)

  assert.ok(result.includes('**Timestamp:**'), 'should have timestamp')
  assert.ok(result.includes('**Before:**'), 'should have Before section')
  assert.ok(result.includes('**After:**'), 'should have After section')

  // Verify ordering: Agent, Duration, Timestamp, Before, After
  const agentIdx = result.indexOf('**Agent:**')
  const durationIdx = result.indexOf('**Duration:**')
  const timestampIdx = result.indexOf('**Timestamp:**')
  const beforeIdx = result.indexOf('**Before:**')
  const afterIdx = result.indexOf('**After:**')
  assert.ok(agentIdx < durationIdx, 'Agent before Duration')
  assert.ok(durationIdx < timestampIdx, 'Duration before Timestamp')
  assert.ok(timestampIdx < beforeIdx, 'Timestamp before Before')
  assert.ok(beforeIdx < afterIdx, 'Before before After')
})

test('formatCompactionEvent omits Before/After sections when fields are empty', () => {
  const turn = makeTurn({ isCompaction: true })
  const result = formatCompactionEvent(turn)

  assert.ok(!result.includes('**Before:**'), 'should NOT include Before section when empty')
  assert.ok(!result.includes('**After:**'), 'should NOT include After section when empty')
})
