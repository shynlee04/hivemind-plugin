/**
 * Tests for config-records language enum validation
 *
 * TDD RED phase — these tests MUST FAIL until:
 *   - SupportedLanguage enum is defined and exported
 *   - communication_language uses SupportedLanguage enum
 *   - document_language uses SupportedLanguage enum
 *
 * @module tests/schema-kernel/config-records
 */

import test from 'node:test'
import assert from 'node:assert/strict'

// These imports MUST resolve once implementation exists
import {
  SupportedLanguage,
  UserPreferences,
} from '../../src/schema-kernel/config-records.js'

// ---------------------------------------------------------------------------
// 1. SupportedLanguage enum exists and covers the required values
// ---------------------------------------------------------------------------

test('SupportedLanguage enum contains all required language codes', () => {
  const expected: readonly string[] = ['en', 'vi', 'zh', 'ko', 'ja']

  for (const code of expected) {
    assert.ok(
      Object.values(SupportedLanguage).includes(code),
      `SupportedLanguage should include "${code}"`,
    )
  }
})

test('SupportedLanguage enum contains ONLY the five required codes', () => {
  const values = Object.values(SupportedLanguage) as string[]
  assert.deepEqual(
    values.sort(),
    ['en', 'ja', 'ko', 'vi', 'zh'],
    'SupportedLanguage must have exactly 5 values',
  )
})

// ---------------------------------------------------------------------------
// 2. Schema accepts valid language codes
// ---------------------------------------------------------------------------

test('UserPreferences accepts communication_language="en"', () => {
  const result = UserPreferences.safeParse({ communication_language: 'en' })
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.communication_language, 'en')
  }
})

test('UserPreferences accepts communication_language="vi"', () => {
  const result = UserPreferences.safeParse({ communication_language: 'vi' })
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.communication_language, 'vi')
  }
})

test('UserPreferences accepts communication_language="zh"', () => {
  const result = UserPreferences.safeParse({ communication_language: 'zh' })
  assert.equal(result.success, true)
})

test('UserPreferences accepts communication_language="ko"', () => {
  const result = UserPreferences.safeParse({ communication_language: 'ko' })
  assert.equal(result.success, true)
})

test('UserPreferences accepts communication_language="ja"', () => {
  const result = UserPreferences.safeParse({ communication_language: 'ja' })
  assert.equal(result.success, true)
})

test('UserPreferences accepts document_language="en"', () => {
  const result = UserPreferences.safeParse({ document_language: 'en' })
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.document_language, 'en')
  }
})

test('UserPreferences accepts document_language="vi"', () => {
  const result = UserPreferences.safeParse({ document_language: 'vi' })
  assert.equal(result.success, true)
})

test('UserPreferences accepts both language fields together', () => {
  const result = UserPreferences.safeParse({
    communication_language: 'ko',
    document_language: 'ja',
  })
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.communication_language, 'ko')
    assert.equal(result.data.document_language, 'ja')
  }
})

// ---------------------------------------------------------------------------
// 3. Schema rejects INVALID language codes
// ---------------------------------------------------------------------------

test('UserPreferences rejects communication_language="fr"', () => {
  const result = UserPreferences.safeParse({ communication_language: 'fr' })
  assert.equal(result.success, false, '"fr" must be rejected')
})

test('UserPreferences rejects communication_language="de"', () => {
  const result = UserPreferences.safeParse({ communication_language: 'de' })
  assert.equal(result.success, false, '"de" must be rejected')
})

test('UserPreferences rejects communication_language="es"', () => {
  const result = UserPreferences.safeParse({ communication_language: 'es' })
  assert.equal(result.success, false, '"es" must be rejected')
})

test('UserPreferences rejects document_language="fr"', () => {
  const result = UserPreferences.safeParse({ document_language: 'fr' })
  assert.equal(result.success, false, '"fr" must be rejected for document_language')
})

test('UserPreferences rejects document_language="de"', () => {
  const result = UserPreferences.safeParse({ document_language: 'de' })
  assert.equal(result.success, false, '"de" must be rejected for document_language')
})

test('UserPreferences rejects empty string for communication_language', () => {
  const result = UserPreferences.safeParse({ communication_language: '' })
  assert.equal(result.success, false, 'empty string must be rejected')
})

test('UserPreferences rejects empty string for document_language', () => {
  const result = UserPreferences.safeParse({ document_language: '' })
  assert.equal(result.success, false, 'empty string must be rejected for document_language')
})

// ---------------------------------------------------------------------------
// 4. Default values
// ---------------------------------------------------------------------------

test('communication_language defaults to "en" when omitted', () => {
  const result = UserPreferences.safeParse({})
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.communication_language, 'en')
  }
})

test('document_language defaults to "en" when omitted', () => {
  const result = UserPreferences.safeParse({})
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.document_language, 'en')
  }
})

test('both language fields default to "en" simultaneously', () => {
  const result = UserPreferences.safeParse({})
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.communication_language, 'en')
    assert.equal(result.data.document_language, 'en')
  }
})

// ---------------------------------------------------------------------------
// 5. safeParse returns structured error info for invalid languages
// ---------------------------------------------------------------------------

test('safeParse error contains field-level issue for invalid communication_language', () => {
  const result = UserPreferences.safeParse({ communication_language: 'xyz' })
  assert.equal(result.success, false)
  if (!result.success) {
    const fieldIssues = result.error.issues.filter(
      (i) => i.path[0] === 'communication_language',
    )
    assert.ok(
      fieldIssues.length > 0,
      'error must reference communication_language path',
    )
  }
})

test('safeParse error contains field-level issue for invalid document_language', () => {
  const result = UserPreferences.safeParse({ document_language: 'xyz' })
  assert.equal(result.success, false)
  if (!result.success) {
    const fieldIssues = result.error.issues.filter(
      (i) => i.path[0] === 'document_language',
    )
    assert.ok(
      fieldIssues.length > 0,
      'error must reference document_language path',
    )
  }
})
