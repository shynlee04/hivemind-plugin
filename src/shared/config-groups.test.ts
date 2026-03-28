/**
 * Config Groups Module Tests (RED)
 *
 * Verifies CONFIG_GROUPS mapping, getConfigGroup, validateConfigUpdate,
 * and applyConfigUpdate against the UserPreferences schema.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CONFIG_GROUPS,
  getConfigGroup,
  validateConfigUpdate,
  applyConfigUpdate,
} from './config-groups.js'

// --- CONFIG_GROUPS structure ---

describe('CONFIG_GROUPS', () => {
  it('defines exactly 4 groups', () => {
    assert.equal(Object.keys(CONFIG_GROUPS).length, 4)
  })

  it('defines language group with communication_language and document_language', () => {
    const lang = CONFIG_GROUPS.language
    assert.ok(lang, 'language group exists')
    assert.deepEqual(lang.keys.sort(), ['communication_language', 'document_language'])
  })

  it('defines expertise group with expert_level', () => {
    const exp = CONFIG_GROUPS.expertise
    assert.ok(exp, 'expertise group exists')
    assert.deepEqual(exp.keys, ['expert_level'])
    assert.deepEqual(
      exp.validValues!['expert_level'].sort(),
      ['beginner', 'intermediate', 'advanced', 'expert'].sort(),
    )
  })

  it('defines governance group with governance_level', () => {
    const gov = CONFIG_GROUPS.governance
    assert.ok(gov, 'governance group exists')
    assert.deepEqual(gov.keys, ['governance_level'])
    assert.deepEqual(
      gov.validValues!['governance_level'].sort(),
      ['permissive', 'standard', 'strict', 'paranoid'].sort(),
    )
  })

  it('defines operation-mode group with operation_mode', () => {
    const op = CONFIG_GROUPS['operation-mode']
    assert.ok(op, 'operation-mode group exists')
    assert.deepEqual(op.keys, ['operation_mode'])
    assert.deepEqual(
      op.validValues!['operation_mode'].sort(),
      ['iterative-interactive', 'research-first', 'yolo'].sort(),
    )
  })
})

// --- getConfigGroup ---

describe('getConfigGroup', () => {
  it('returns default values for language group', () => {
    const result = getConfigGroup('language')
    assert.equal(result.status, 'success')
    assert.deepEqual(result.values, {
      communication_language: 'en',
      document_language: 'en',
    })
  })

  it('returns default value for expertise group', () => {
    const result = getConfigGroup('expertise')
    assert.equal(result.status, 'success')
    assert.deepEqual(result.values, { expert_level: 'intermediate' })
  })

  it('returns default value for governance group', () => {
    const result = getConfigGroup('governance')
    assert.equal(result.status, 'success')
    assert.deepEqual(result.values, { governance_level: 'standard' })
  })

  it('returns default value for operation-mode group', () => {
    const result = getConfigGroup('operation-mode')
    assert.equal(result.status, 'success')
    assert.deepEqual(result.values, { operation_mode: 'iterative-interactive' })
  })

  it('returns error for unknown group name', () => {
    const result = getConfigGroup('nonexistent')
    assert.equal(result.status, 'error')
    assert.ok(result.error?.includes('Unknown config group'))
  })
})

// --- validateConfigUpdate ---

describe('validateConfigUpdate', () => {
  it('accepts valid language value', () => {
    const result = validateConfigUpdate('language', 'communication_language', 'fr')
    assert.equal(result.status, 'success')
  })

  it('rejects invalid key for language group', () => {
    const result = validateConfigUpdate('language', 'expert_level', 'beginner')
    assert.equal(result.status, 'error')
    assert.ok(result.error?.includes('not in group'))
  })

  it('accepts valid expert_level value', () => {
    const result = validateConfigUpdate('expertise', 'expert_level', 'advanced')
    assert.equal(result.status, 'success')
  })

  it('rejects invalid expert_level value', () => {
    const result = validateConfigUpdate('expertise', 'expert_level', 'wizard')
    assert.equal(result.status, 'error')
    assert.ok(result.error?.includes('Invalid value'))
  })

  it('accepts valid governance_level value', () => {
    const result = validateConfigUpdate('governance', 'governance_level', 'strict')
    assert.equal(result.status, 'success')
  })

  it('rejects invalid governance_level value', () => {
    const result = validateConfigUpdate('governance', 'governance_level', 'extreme')
    assert.equal(result.status, 'error')
    assert.ok(result.error?.includes('Invalid value'))
  })

  it('accepts valid operation_mode value', () => {
    const result = validateConfigUpdate('operation-mode', 'operation_mode', 'yolo')
    assert.equal(result.status, 'success')
  })

  it('rejects invalid operation_mode value', () => {
    const result = validateConfigUpdate('operation-mode', 'operation_mode', 'auto-pilot')
    assert.equal(result.status, 'error')
    assert.ok(result.error?.includes('Invalid value'))
  })

  it('returns error for unknown group', () => {
    const result = validateConfigUpdate('bogus', 'some_key', 'val')
    assert.equal(result.status, 'error')
    assert.ok(result.error?.includes('Unknown config group'))
  })
})

// --- applyConfigUpdate ---

describe('applyConfigUpdate', () => {
  it('applies communication_language change to defaults', () => {
    const result = applyConfigUpdate('language', 'communication_language', 'ja')
    assert.equal(result.status, 'success')
    assert.deepEqual(result.preferences, {
      communication_language: 'ja',
      document_language: 'en',
      expert_level: 'intermediate',
      governance_level: 'standard',
      operation_mode: 'iterative-interactive',
    })
  })

  it('applies expert_level change to defaults', () => {
    const result = applyConfigUpdate('expertise', 'expert_level', 'expert')
    assert.equal(result.status, 'success')
    assert.equal(result.preferences!.expert_level, 'expert')
    // other defaults preserved
    assert.equal(result.preferences!.communication_language, 'en')
  })

  it('applies governance_level change to defaults', () => {
    const result = applyConfigUpdate('governance', 'governance_level', 'paranoid')
    assert.equal(result.status, 'success')
    assert.equal(result.preferences!.governance_level, 'paranoid')
  })

  it('applies operation_mode change to defaults', () => {
    const result = applyConfigUpdate('operation-mode', 'operation_mode', 'research-first')
    assert.equal(result.status, 'success')
    assert.equal(result.preferences!.operation_mode, 'research-first')
  })

  it('applies update on top of provided base preferences', () => {
    const base = {
      communication_language: 'fr',
      document_language: 'de',
      expert_level: 'advanced' as const,
      governance_level: 'strict' as const,
      operation_mode: 'yolo' as const,
    }
    const result = applyConfigUpdate('language', 'communication_language', 'es', base)
    assert.equal(result.status, 'success')
    assert.equal(result.preferences!.communication_language, 'es')
    // other base values preserved
    assert.equal(result.preferences!.document_language, 'de')
    assert.equal(result.preferences!.expert_level, 'advanced')
  })

  it('rejects invalid value even with base preferences', () => {
    const base = {
      communication_language: 'fr',
      document_language: 'de',
      expert_level: 'advanced' as const,
      governance_level: 'strict' as const,
      operation_mode: 'yolo' as const,
    }
    const result = applyConfigUpdate('expertise', 'expert_level', 'ninja', base)
    assert.equal(result.status, 'error')
  })

  it('returns error for unknown group', () => {
    const result = applyConfigUpdate('nonexistent', 'key', 'value')
    assert.equal(result.status, 'error')
  })
})
