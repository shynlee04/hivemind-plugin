/**
 * Intent Classifier Tests
 *
 * Tests for the intent classification engine component.
 * Validates regex-based purpose classification and confidence scoring.
 *
 * @module agent-work-contract/engine/intent-classifier.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyIntent } from './intent-classifier.js'

test('IntentClassifier - classifyIntent - quick-action classification', async () => {
  const result = await classifyIntent('fix the bug in the login module')
  
  assert.equal(result.intent.purposeClass, 'quick-action')
  assert.ok(result.intent.confidence > 0)
  assert.equal(result.intent.requiresPlan, false)
})

test('IntentClassifier - classifyIntent - quick-action refactor function', async () => {
  const result = await classifyIntent('refactor the authentication function')
  
  assert.equal(result.intent.purposeClass, 'quick-action')
  assert.equal(result.intent.requiresPlan, false)
})

test('IntentClassifier - classifyIntent - quick-action small edits', async () => {
  const result = await classifyIntent('update the variable name')
  
  assert.equal(result.intent.purposeClass, 'quick-action')
})

test('IntentClassifier - classifyIntent - quick-action single file changes', async () => {
  const result = await classifyIntent('add comment to this file')
  
  assert.equal(result.intent.purposeClass, 'quick-action')
})

test('IntentClassifier - classifyIntent - research-brainstorm research', async () => {
  const result = await classifyIntent('research the best approach for authentication')
  
  assert.equal(result.intent.purposeClass, 'research-brainstorm')
  assert.equal(result.intent.requiresPlan, false)
})

test('IntentClassifier - classifyIntent - research-brainstorm brainstorm', async () => {
  const result = await classifyIntent('brainstorm ideas for the UI design')
  
  assert.equal(result.intent.purposeClass, 'research-brainstorm')
})

test('IntentClassifier - classifyIntent - research-brainstorm explore options', async () => {
  const result = await classifyIntent('explore options for database migration')
  
  assert.equal(result.intent.purposeClass, 'research-brainstorm')
})

test('IntentClassifier - classifyIntent - research-brainstorm compare', async () => {
  const result = await classifyIntent('compare React and Vue for this project')
  
  assert.equal(result.intent.purposeClass, 'research-brainstorm')
})

test('IntentClassifier - classifyIntent - research-brainstorm investigate', async () => {
  const result = await classifyIntent('investigate why tests are failing')
  
  assert.equal(result.intent.purposeClass, 'research-brainstorm')
})

test('IntentClassifier - classifyIntent - project-driven implement feature', async () => {
  const result = await classifyIntent('implement the user authentication feature')
  
  assert.equal(result.intent.purposeClass, 'project-driven')
  assert.equal(result.intent.requiresPlan, true)
  assert.equal(result.intent.requiresGovernance, true)
})

test('IntentClassifier - classifyIntent - project-driven create module', async () => {
  const result = await classifyIntent('create a new payment module')
  
  assert.equal(result.intent.purposeClass, 'project-driven')
  assert.equal(result.intent.requiresPlan, true)
})

test('IntentClassifier - classifyIntent - project-driven build system', async () => {
  const result = await classifyIntent('build the notification system')
  
  assert.equal(result.intent.purposeClass, 'project-driven')
})

test('IntentClassifier - classifyIntent - project-driven develop application', async () => {
  const result = await classifyIntent('develop a REST API for user management')
  
  assert.equal(result.intent.purposeClass, 'project-driven')
})

test('IntentClassifier - classifyIntent - project-driven architect', async () => {
  const result = await classifyIntent('architect the microservices architecture')
  
  assert.equal(result.intent.purposeClass, 'project-driven')
})

test('IntentClassifier - classifyIntent - confidence scoring between 0 and1', async () => {
  const result = await classifyIntent('implement the feature')
  
  assert.ok(result.intent.confidence >= 0)
  assert.ok(result.intent.confidence <= 1)
})

test('IntentClassifier - classifyIntent - higher confidence for clear matches', async () => {
  const clearResult = await classifyIntent('implement the authentication system')
  const ambiguousResult = await classifyIntent('do something')
  
  assert.ok(clearResult.intent.confidence > ambiguousResult.intent.confidence)
})

test('IntentClassifier - classifyIntent - overall confidence in result', async () => {
  const result = await classifyIntent('research API integration')
  
  // Confidence is in the intent object
  assert.equal(typeof result.intent.confidence, 'number')
})

test('IntentClassifier - classifyIntent - provides reasoning array', async () => {
  const result = await classifyIntent('implement the login feature')
  
  assert.ok(Array.isArray(result.reasoning))
  assert.ok(result.reasoning.length > 0)
})

test('IntentClassifier - classifyIntent - suggests response mode', async () => {
  const result = await classifyIntent('build a new feature')
  
  const validModes = ['broad-search-execute', 'interactive-qa', 'deep-research']
  assert.ok(validModes.includes(result.suggestedResponseMode))
})

test('IntentClassifier - classifyIntent - requiresPlan appropriately set', async () => {
  const quickResult = await classifyIntent('fix the typo')
  const projectResult = await classifyIntent('implement new module')
  
  assert.equal(quickResult.intent.requiresPlan, false)
  assert.equal(projectResult.intent.requiresPlan, true)
})

test('IntentClassifier - classifyIntent - requiresGovernance appropriately set', async () => {
  const quickResult = await classifyIntent('update variable name')
  const projectResult = await classifyIntent('implement feature with tests')
  
  assert.equal(quickResult.intent.requiresGovernance, false)
  assert.equal(projectResult.intent.requiresGovernance, true)
})

test('IntentClassifier - classifyIntent - edge case unknown input', async () => {
  const result = await classifyIntent('xyz abc 123')
  
  assert.ok(result.intent.purposeClass !== undefined)
  assert.ok(result.intent.confidence >= 0)
})

test('IntentClassifier - classifyIntent - edge case empty-ish input', async () => {
  const result = await classifyIntent('   ')
  
  assert.ok(result.intent.purposeClass !== undefined)
  assert.equal(result.intent.raw, '   ')
})

test('IntentClassifier - classifyIntent - edge case mixed intent', async () => {
  const result = await classifyIntent('research and implement the feature')
  
  assert.ok(result.intent.purposeClass !== undefined)
  assert.ok(result.reasoning.length > 0)
})

test('IntentClassifier - classifyIntent - casing handled correctly', async () => {
  const lowerResult = await classifyIntent('IMPLEMENT THE FEATURE')
  const mixedResult = await classifyIntent('Implement The Feature')
  
  assert.equal(lowerResult.intent.purposeClass, 'project-driven')
  assert.equal(mixedResult.intent.purposeClass, 'project-driven')
})

test('IntentClassifier - classifyIntent - response mode for quick-action', async () => {
  const result = await classifyIntent('fix the bug')
  
  assert.equal(result.suggestedResponseMode, 'broad-search-execute')
})

test('IntentClassifier - classifyIntent - response mode for research-brainstorm', async () => {
  const result = await classifyIntent('research options for caching')
  
  assert.equal(result.suggestedResponseMode, 'interactive-qa')
})

test('IntentClassifier - classifyIntent - response mode for project-driven', async () => {
  const result = await classifyIntent('implement the payment system')
  
  assert.equal(result.suggestedResponseMode, 'broad-search-execute')
})