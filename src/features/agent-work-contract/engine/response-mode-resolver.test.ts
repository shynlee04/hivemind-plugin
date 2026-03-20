/**
 * Response Mode Resolver Tests
 *
 * Tests for the response mode resolution engine component.
 * Validates deterministic mapping from PurposeClass to ResponseMode.
 *
 * @module agent-work-contract/engine/response-mode-resolver.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveResponseMode } from './response-mode-resolver.js'
import type { PurposeClass, ResponseMode } from '../schema/index.js'

test('ResponseModeResolver - resolve - quick-action maps to broad-search-execute', () => {
  const result = resolveResponseMode('quick-action')
  
  assert.equal(result, 'broad-search-execute')
})

test('ResponseModeResolver - resolve - research-brainstorm maps to interactive-qa', () => {
  const result = resolveResponseMode('research-brainstorm')
  
  assert.equal(result, 'interactive-qa')
})

test('ResponseModeResolver - resolve - project-driven maps to broad-search-execute', () => {
  const result = resolveResponseMode('project-driven')
  
  assert.equal(result, 'broad-search-execute')
})

test('ResponseModeResolver - resolve - isDeterministic - same input always same output', () => {
  const purposeClass: PurposeClass = 'quick-action'
  
  const result1 = resolveResponseMode(purposeClass)
  const result2 = resolveResponseMode(purposeClass)
  const result3 = resolveResponseMode(purposeClass)
  
  assert.equal(result1, result2)
  assert.equal(result2, result3)
})

test('ResponseModeResolver - resolve - isPure - no side effects', () => {
  // Call multiple times - should be pure and idempotent
  const results: ResponseMode[] = []
  
  for (let i = 0; i < 100; i++) {
    results.push(resolveResponseMode('research-brainstorm'))
  }
  
  // All results should be identical
  const uniqueResults = new Set(results)
  assert.equal(uniqueResults.size, 1)
  assert.equal(results[0], 'interactive-qa')
})

test('ResponseModeResolver - resolve - returns valid ResponseMode', () => {
  const validModes: ResponseMode[] = ['broad-search-execute', 'interactive-qa', 'deep-research']
  const purposeClasses: PurposeClass[] = ['quick-action', 'research-brainstorm', 'project-driven']
  
  for (const pc of purposeClasses) {
    const result = resolveResponseMode(pc)
    assert.ok(validModes.includes(result), `Invalid response mode for ${pc}: ${result}`)
  }
})

test('ResponseModeResolver - resolve - complete mapping - all purpose classes have mappings', () => {
  const allPurposeClasses: PurposeClass[] = ['quick-action', 'research-brainstorm', 'project-driven']
  
  for (const pc of allPurposeClasses) {
    // Should not throw
    const result = resolveResponseMode(pc)
    assert.ok(result !== undefined)
    assert.ok(result !== null)
    assert.ok(typeof result === 'string')
    assert.ok(result.length > 0)
  }
})