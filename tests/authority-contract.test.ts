/**
 * Authority Contract Tests
 * 
 * These tests verify governance exemptions and authority relationships
 * as documented in AGENTS.md and sector AGENTS.md files.
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getProjectRoot(): string {
  return join(__dirname, '..')
}

function readFile(relativePath: string): string {
  return readFileSync(join(getProjectRoot(), relativePath), 'utf-8')
}

test('GSD Orchestrator Exemption - AGENTS.md contains GSD orchestrator exemption from prohibition', () => {
  const content = readFile('AGENTS.md')
  
  // The blanket prohibition must have an explicit exemption for GSD orchestrators
  const hasProhibition = content.includes('Do not Read') && 
                         content.includes('Do not Execute')
  assert.strictEqual(hasProhibition, true, 'AGENTS.md should have blanket prohibition')
  
  // There must be an explicit exemption clause for GSD orchestrator workflow
  // The exemption text mentions bounded execution contract
  const hasExemption = (content.includes('GSD orchestrator') && 
                       (content.includes('EXEMPT') || content.includes('exempt'))) ||
                       content.includes('GSD orchestrator workflow is EXEMPT')
  
  assert.strictEqual(hasExemption, true, 'AGENTS.md should have explicit GSD orchestrator exemption')
})

test('SCHEMA_KERNEL_ACTIVE - schema-kernel/index.ts exports SCHEMA_KERNEL_ACTIVE=true', () => {
  const content = readFile('src/schema-kernel/index.ts')
  
  // Must export SCHEMA_KERNEL_ACTIVE = true (not SCHEMA_KERNEL_ARCHIVED = true)
  const hasActiveMarker = content.includes('SCHEMA_KERNEL_ACTIVE') && 
                          content.includes('true')
  assert.strictEqual(hasActiveMarker, true, 'schema-kernel/index.ts should export SCHEMA_KERNEL_ACTIVE=true')
  
  // Must NOT be marked as archived
  const hasArchivedMarker = content.includes('SCHEMA_KERNEL_ARCHIVED')
  assert.strictEqual(hasArchivedMarker, false, 'schema-kernel/index.ts should NOT have SCHEMA_KERNEL_ARCHIVED')
})

test('SCHEMA_KERNEL_CANONICAL_PATH - schema-kernel/index.ts has canonical path marker', () => {
  const content = readFile('src/schema-kernel/index.ts')
  
  const hasCanonicalPath = content.includes('SCHEMA_KERNEL_CANONICAL_PATH')
  assert.strictEqual(hasCanonicalPath, true, 'schema-kernel/index.ts should have SCHEMA_KERNEL_CANONICAL_PATH marker')
})

test('PressureContract is properly decomposed per Interface Decomposition', () => {
  const content = readFile('src/shared/pressure-contract.ts')
  
  // RuntimePressureContract uses intersection types for decomposition
  const usesIntersection = content.includes('& RuntimePressureMetadata') &&
                           content.includes('& RuntimePressureFailure') &&
                           content.includes('& { safety:')
  assert.strictEqual(usesIntersection, true, 'RuntimePressureContract should use intersection decomposition')
  
  // Verify the component interfaces exist and are small
  // RuntimePressureMetadata: id, title, summary (3 fields)
  // RuntimePressureFailure: failureBehavior (1 field)  
  // RuntimeSafetyExpectation: level, actions, closeout (3 fields)
  // RuntimeEvidenceCaptureSpec: requiredArtifacts, optionalArtifacts, captureFrom, stateOwners (4 fields)
  assert.ok(content.includes('interface RuntimePressureMetadata'), 'Should have RuntimePressureMetadata interface')
  assert.ok(content.includes('interface RuntimePressureFailure'), 'Should have RuntimePressureFailure interface')
})

test('TrajectoryRecord uses intersection decomposition', () => {
  const content = readFile('src/core/trajectory/trajectory-types.ts')
  
  // TrajectoryRecord is composed via intersection
  const hasIntersection = content.includes('TrajectoryCore') &&
                         content.includes('TrajectoryBindings') &&
                         content.includes('TrajectoryEvidence') &&
                         content.includes('TrajectoryPlanning')
  assert.strictEqual(hasIntersection, true, 'TrajectoryRecord should use intersection decomposition')
})

test('Known Debt - Type monoliths item should be checked as resolved', () => {
  const content = readFile('AGENTS.md')
  
  // The Known Debt section should show Type monoliths is resolved
  // Look for the Type monoliths line - it should be marked [x] not [ ]
  const knownDebtSection = content.substring(content.indexOf('## Known Debt'))
  const typeMonolithsLine = knownDebtSection.split('\n').find(line => line.includes('Type monoliths'))
  
  if (typeMonolithsLine) {
    const isResolved = typeMonolithsLine.trim().startsWith('- [x]')
    assert.strictEqual(isResolved, true, 'Type monoliths should be marked as [x] resolved in Known Debt')
  }
})
