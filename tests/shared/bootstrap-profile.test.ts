/**
 * TDD RED phase tests for LANGUAGE_ALIASES expansion (zh, ko, ja).
 *
 * These tests MUST fail because src/shared/bootstrap-profile.ts currently
 * only has en/vi entries in LANGUAGE_ALIASES. The zh/ko/ja aliases do not
 * exist yet — that is the intended gap this test suite guards.
 *
 * Run: npx tsx --test tests/shared/bootstrap-profile.test.ts
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeProfileLanguage,
  createBootstrapProfile,
} from '../../src/shared/bootstrap-profile.js'

// ─────────────────────────────────────────────────────────────────────────────
// Chinese (zh) alias resolution
// ─────────────────────────────────────────────────────────────────────────────

test('normalizeProfileLanguage resolves "zh" to canonical "zh"', () => {
  assert.equal(normalizeProfileLanguage('zh'), 'zh')
})

test('normalizeProfileLanguage resolves "chinese" to canonical "zh"', () => {
  assert.equal(normalizeProfileLanguage('chinese'), 'zh')
})

test('normalizeProfileLanguage resolves "中文" (CJK display name) to canonical "zh"', () => {
  assert.equal(normalizeProfileLanguage('中文'), 'zh')
})

test('normalizeProfileLanguage resolves "zh-cn" to canonical "zh"', () => {
  assert.equal(normalizeProfileLanguage('zh-cn'), 'zh')
})

test('normalizeProfileLanguage resolves "zh-tw" to canonical "zh"', () => {
  assert.equal(normalizeProfileLanguage('zh-tw'), 'zh')
})

test('normalizeProfileLanguage resolves "zh-CN" (uppercase) to canonical "zh"', () => {
  assert.equal(normalizeProfileLanguage('zh-CN'), 'zh')
})

test('normalizeProfileLanguage resolves "zh-TW" (uppercase) to canonical "zh"', () => {
  assert.equal(normalizeProfileLanguage('zh-TW'), 'zh')
})

// ─────────────────────────────────────────────────────────────────────────────
// Korean (ko) alias resolution
// ─────────────────────────────────────────────────────────────────────────────

test('normalizeProfileLanguage resolves "ko" to canonical "ko"', () => {
  assert.equal(normalizeProfileLanguage('ko'), 'ko')
})

test('normalizeProfileLanguage resolves "korean" to canonical "ko"', () => {
  assert.equal(normalizeProfileLanguage('korean'), 'ko')
})

test('normalizeProfileLanguage resolves "한국어" (Hangul display name) to canonical "ko"', () => {
  assert.equal(normalizeProfileLanguage('한국어'), 'ko')
})

test('normalizeProfileLanguage resolves "ko-kr" to canonical "ko"', () => {
  assert.equal(normalizeProfileLanguage('ko-kr'), 'ko')
})

test('normalizeProfileLanguage resolves "ko-KR" (uppercase) to canonical "ko"', () => {
  assert.equal(normalizeProfileLanguage('ko-KR'), 'ko')
})

// ─────────────────────────────────────────────────────────────────────────────
// Japanese (ja) alias resolution
// ─────────────────────────────────────────────────────────────────────────────

test('normalizeProfileLanguage resolves "ja" to canonical "ja"', () => {
  assert.equal(normalizeProfileLanguage('ja'), 'ja')
})

test('normalizeProfileLanguage resolves "japanese" to canonical "ja"', () => {
  assert.equal(normalizeProfileLanguage('japanese'), 'ja')
})

test('normalizeProfileLanguage resolves "日本語" (CJK display name) to canonical "ja"', () => {
  assert.equal(normalizeProfileLanguage('日本語'), 'ja')
})

test('normalizeProfileLanguage resolves "ja-jp" to canonical "ja"', () => {
  assert.equal(normalizeProfileLanguage('ja-jp'), 'ja')
})

test('normalizeProfileLanguage resolves "ja-JP" (uppercase) to canonical "ja"', () => {
  assert.equal(normalizeProfileLanguage('ja-JP'), 'ja')
})

// ─────────────────────────────────────────────────────────────────────────────
// Existing en/vi entries still work after expansion
// ─────────────────────────────────────────────────────────────────────────────

test('normalizeProfileLanguage still resolves "en" to "en"', () => {
  assert.equal(normalizeProfileLanguage('en'), 'en')
})

test('normalizeProfileLanguage still resolves "english" to "en"', () => {
  assert.equal(normalizeProfileLanguage('english'), 'en')
})

test('normalizeProfileLanguage still resolves "eng" to "en"', () => {
  assert.equal(normalizeProfileLanguage('eng'), 'en')
})

test('normalizeProfileLanguage still resolves "vi" to "vi"', () => {
  assert.equal(normalizeProfileLanguage('vi'), 'vi')
})

test('normalizeProfileLanguage still resolves "vietnamese" to "vi"', () => {
  assert.equal(normalizeProfileLanguage('vietnamese'), 'vi')
})

test('normalizeProfileLanguage still resolves "vn" to "vi"', () => {
  assert.equal(normalizeProfileLanguage('vn'), 'vi')
})

test('normalizeProfileLanguage still resolves "vietnam" to "vi"', () => {
  assert.equal(normalizeProfileLanguage('vietnam'), 'vi')
})

// ─────────────────────────────────────────────────────────────────────────────
// createBootstrapProfile integration — zh/ko/ja flow through
// ─────────────────────────────────────────────────────────────────────────────

test('createBootstrapProfile normalizes "chinese" to chatLanguage "zh"', () => {
  const profile = createBootstrapProfile({ language: 'chinese' })
  assert.equal(profile.chatLanguage, 'zh')
})

test('createBootstrapProfile normalizes "korean" to chatLanguage "ko"', () => {
  const profile = createBootstrapProfile({ language: 'korean' })
  assert.equal(profile.chatLanguage, 'ko')
})

test('createBootstrapProfile normalizes "japanese" to chatLanguage "ja"', () => {
  const profile = createBootstrapProfile({ language: 'japanese' })
  assert.equal(profile.chatLanguage, 'ja')
})

test('createBootstrapProfile normalizes "中文" to chatLanguage "zh"', () => {
  const profile = createBootstrapProfile({ language: '中文' })
  assert.equal(profile.chatLanguage, 'zh')
})

test('createBootstrapProfile normalizes "한국어" to chatLanguage "ko"', () => {
  const profile = createBootstrapProfile({ language: '한국어' })
  assert.equal(profile.chatLanguage, 'ko')
})

test('createBootstrapProfile normalizes "日本語" to chatLanguage "ja"', () => {
  const profile = createBootstrapProfile({ language: '日本語' })
  assert.equal(profile.chatLanguage, 'ja')
})

test('createBootstrapProfile falls artifactLanguage back to chatLanguage for zh', () => {
  const profile = createBootstrapProfile({ language: 'zh' })
  assert.equal(profile.chatLanguage, 'zh')
  assert.equal(profile.artifactLanguage, 'zh')
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases: undefined / empty / unknown → fallback behavior
// ─────────────────────────────────────────────────────────────────────────────

test('normalizeProfileLanguage returns fallback "en" for undefined', () => {
  assert.equal(normalizeProfileLanguage(undefined), 'en')
})

test('normalizeProfileLanguage returns fallback "en" for empty string', () => {
  assert.equal(normalizeProfileLanguage(''), 'en')
})

test('normalizeProfileLanguage returns fallback "en" for whitespace-only string', () => {
  assert.equal(normalizeProfileLanguage('   '), 'en')
})

test('normalizeProfileLanguage returns fallback "en" for unsupported code "xx"', () => {
  assert.equal(normalizeProfileLanguage('xx'), 'en')
})

test('normalizeProfileLanguage uses custom fallback when provided', () => {
  assert.equal(normalizeProfileLanguage(undefined, 'zh'), 'zh')
})

test('normalizeProfileLanguage lowercases input before lookup', () => {
  assert.equal(normalizeProfileLanguage('English'), 'en')
  assert.equal(normalizeProfileLanguage('VIETNAMESE'), 'vi')
})
