/**
 * Language Resolution — CJK / Korean / Japanese Detection Tests
 *
 * TDD RED phase: These tests MUST fail because the functions under test
 * (isChineseMessage, isKoreanMessage, isJapaneseMessage, resolveDisplayLanguage
 * with expanded language codes) do not yet exist in the source module.
 *
 * @module language-resolution.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import type { CommandExecutionInput } from '../../../src/commands/slash-command/command-types.js'
import {
  isVietnameseMessage,
  normalizeStringValue,
  resolveDisplayLanguage,
  isChineseMessage,
  isKoreanMessage,
  isJapaneseMessage,
} from '../../../src/features/session-entry/language-resolution.js'

/** Minimal CommandExecutionInput stub for language resolution tests */
function stubInput(overrides: Partial<CommandExecutionInput> = {}): CommandExecutionInput {
  return {
    projectRoot: '/tmp/test',
    sessionId: 'test-session',
    sessionScope: 'main',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Existing function regression tests (these should pass)
// ---------------------------------------------------------------------------

test('isVietnameseMessage returns true for Vietnamese text with diacritics', () => {
  assert.equal(isVietnameseMessage('Xin chào bạn'), true)
})

test('isVietnameseMessage returns true for Vietnamese common words', () => {
  assert.equal(isVietnameseMessage('cho tôi biết cách sử dụng'), true)
})

test('isVietnameseMessage returns false for English text', () => {
  assert.equal(isVietnameseMessage('Hello, how are you?'), false)
})

test('isVietnameseMessage returns false for undefined input', () => {
  assert.equal(isVietnameseMessage(undefined), false)
})

test('isVietnameseMessage returns false for empty string', () => {
  assert.equal(isVietnameseMessage(''), false)
})

test('normalizeStringValue returns trimmed value for non-empty input', () => {
  assert.equal(normalizeStringValue('  hello  '), 'hello')
})

test('normalizeStringValue returns undefined for empty string', () => {
  assert.equal(normalizeStringValue(''), undefined)
})

test('normalizeStringValue returns undefined for whitespace-only string', () => {
  assert.equal(normalizeStringValue('   '), undefined)
})

test('normalizeStringValue returns undefined for undefined input', () => {
  assert.equal(normalizeStringValue(undefined), undefined)
})

// ---------------------------------------------------------------------------
// NEW: Chinese (CJK Unified Ideographs) detection — MUST FAIL
// ---------------------------------------------------------------------------

test('isChineseMessage returns true for Chinese text (你好世界)', () => {
  assert.equal(isChineseMessage('你好世界'), true)
})

test('isChineseMessage returns true for Chinese settings word (设置)', () => {
  assert.equal(isChineseMessage('设置'), true)
})

test('isChineseMessage returns true for mixed Chinese-English text (Hello 你好)', () => {
  assert.equal(isChineseMessage('Hello 你好'), true)
})

test('isChineseMessage returns true for longer Chinese sentence', () => {
  assert.equal(isChineseMessage('请帮我检查一下代码'), true)
})

test('isChineseMessage returns false for English-only text', () => {
  assert.equal(isChineseMessage('Hello, how are you?'), false)
})

test('isChineseMessage returns false for Vietnamese text', () => {
  assert.equal(isChineseMessage('Xin chào bạn'), false)
})

test('isChineseMessage returns false for Korean text', () => {
  assert.equal(isChineseMessage('안녕하세요'), false)
})

test('isChineseMessage returns false for undefined input', () => {
  assert.equal(isChineseMessage(undefined), false)
})

test('isChineseMessage returns false for empty string', () => {
  assert.equal(isChineseMessage(''), false)
})

// ---------------------------------------------------------------------------
// NEW: Korean (Hangul Syllables) detection — MUST FAIL
// ---------------------------------------------------------------------------

test('isKoreanMessage returns true for Korean text (안녕하세요)', () => {
  assert.equal(isKoreanMessage('안녕하세요'), true)
})

test('isKoreanMessage returns true for Korean settings word (설정)', () => {
  assert.equal(isKoreanMessage('설정'), true)
})

test('isKoreanMessage returns true for mixed Korean-English text', () => {
  assert.equal(isKoreanMessage('Hello 안녕'), true)
})

test('isKoreanMessage returns true for longer Korean sentence', () => {
  assert.equal(isKoreanMessage('코드를 확인해 주세요'), true)
})

test('isKoreanMessage returns false for English-only text', () => {
  assert.equal(isKoreanMessage('Hello, how are you?'), false)
})

test('isKoreanMessage returns false for Vietnamese text', () => {
  assert.equal(isKoreanMessage('Xin chào bạn'), false)
})

test('isKoreanMessage returns false for Chinese text', () => {
  assert.equal(isKoreanMessage('你好世界'), false)
})

test('isKoreanMessage returns false for undefined input', () => {
  assert.equal(isKoreanMessage(undefined), false)
})

test('isKoreanMessage returns false for empty string', () => {
  assert.equal(isKoreanMessage(''), false)
})

// ---------------------------------------------------------------------------
// NEW: Japanese (Hiragana + Katakana) detection — MUST FAIL
// ---------------------------------------------------------------------------

test('isJapaneseMessage returns true for Japanese Hiragana (こんにちは)', () => {
  assert.equal(isJapaneseMessage('こんにちは'), true)
})

test('isJapaneseMessage returns true for Japanese Katakana (コンニチハ)', () => {
  assert.equal(isJapaneseMessage('コンニチハ'), true)
})

test('isJapaneseMessage returns true for mixed Japanese-English text', () => {
  assert.equal(isJapaneseMessage('Hello こんにちは'), true)
})

test('isJapaneseMessage returns true for Japanese with kanji (日本語のテスト)', () => {
  assert.equal(isJapaneseMessage('日本語のテスト'), true)
})

test('isJapaneseMessage returns true for Katakana word (プロジェクト)', () => {
  assert.equal(isJapaneseMessage('プロジェクト'), true)
})

test('isJapaneseMessage returns false for English-only text', () => {
  assert.equal(isJapaneseMessage('Hello, how are you?'), false)
})

test('isJapaneseMessage returns false for Vietnamese text', () => {
  assert.equal(isJapaneseMessage('Xin chào bạn'), false)
})

test('isJapaneseMessage returns false for Korean text', () => {
  assert.equal(isJapaneseMessage('안녕하세요'), false)
})

test('isJapaneseMessage returns false for Chinese-only CJK text (你好世界)', () => {
  // Pure CJK without Hiragana/Katakana is ambiguous with Chinese —
  // this test documents that Japanese detection relies on kana presence.
  // '你好世界' has no Hiragana or Katakana, so isJapaneseMessage should be false.
  assert.equal(isJapaneseMessage('你好世界'), false)
})

test('isJapaneseMessage returns false for undefined input', () => {
  assert.equal(isJapaneseMessage(undefined), false)
})

test('isJapaneseMessage returns false for empty string', () => {
  assert.equal(isJapaneseMessage(''), false)
})

// ---------------------------------------------------------------------------
// NEW: resolveDisplayLanguage expanded language codes — MUST FAIL
// Currently returns 'en' | 'vi'. Expanded to include 'zh' | 'ko' | 'ja'.
// ---------------------------------------------------------------------------

test('resolveDisplayLanguage returns "zh" for Chinese text (你好世界)', () => {
  const result = resolveDisplayLanguage('你好世界', undefined, stubInput({ language: '' }))
  assert.equal(result, 'zh')
})

test('resolveDisplayLanguage returns "ko" for Korean text (안녕하세요)', () => {
  const result = resolveDisplayLanguage('안녕하세요', undefined, stubInput({ language: '' }))
  assert.equal(result, 'ko')
})

test('resolveDisplayLanguage returns "ja" for Japanese text (こんにちは)', () => {
  const result = resolveDisplayLanguage('こんにちは', undefined, stubInput({ language: '' }))
  assert.equal(result, 'ja')
})

test('resolveDisplayLanguage returns "en" for English text', () => {
  const result = resolveDisplayLanguage('Hello, how are you?', undefined, stubInput({ language: '' }))
  assert.equal(result, 'en')
})

test('resolveDisplayLanguage returns "vi" for Vietnamese text (existing behavior preserved)', () => {
  const result = resolveDisplayLanguage('Xin chào bạn', undefined, stubInput({ language: '' }))
  assert.equal(result, 'vi')
})

test('resolveDisplayLanguage explicit language flag takes priority over Chinese detection', () => {
  const result = resolveDisplayLanguage('你好世界', undefined, stubInput({ language: 'en' }))
  assert.equal(result, 'en')
})

test('resolveDisplayLanguage explicit "ja" flag takes priority over Korean detection', () => {
  const result = resolveDisplayLanguage('안녕하세요', undefined, stubInput({ language: 'ja' }))
  assert.equal(result, 'ja')
})

// ---------------------------------------------------------------------------
// Edge cases: empty / undefined input handling — MUST FAIL
// (isChineseMessage / isKoreanMessage / isJapaneseMessage don't exist yet)
// ---------------------------------------------------------------------------

test('isChineseMessage handles whitespace-only string as non-Chinese', () => {
  assert.equal(isChineseMessage('   '), false)
})

test('isKoreanMessage handles whitespace-only string as non-Korean', () => {
  assert.equal(isKoreanMessage('   '), false)
})

test('isJapaneseMessage handles whitespace-only string as non-Japanese', () => {
  assert.equal(isJapaneseMessage('   '), false)
})
