/**
 * Tool Helpers Deduplication Tests
 *
 * Verifies that shared/tool-helpers.ts exports work correctly
 * and that no tool file duplicates these helpers.
 */

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { parseList, parseJsonArray, renderToolResult } from '../src/shared/tool-helpers.js'

describe('shared tool helpers', () => {
  describe('parseList', () => {
    it('splits comma-separated values', () => {
      assert.deepEqual(parseList('a,b,c'), ['a', 'b', 'c'])
    })

    it('trims whitespace', () => {
      assert.deepEqual(parseList(' a , b , c '), ['a', 'b', 'c'])
    })

    it('filters empty strings', () => {
      assert.deepEqual(parseList('a,,b,,,c'), ['a', 'b', 'c'])
    })

    it('returns empty array for undefined', () => {
      assert.deepEqual(parseList(undefined), [])
    })

    it('returns empty array for empty string', () => {
      assert.deepEqual(parseList(''), [])
    })
  })

  describe('parseJsonArray', () => {
    it('parses valid JSON array', () => {
      assert.deepEqual(parseJsonArray('[1,2,3]'), [1, 2, 3])
    })

    it('returns empty array for undefined', () => {
      assert.deepEqual(parseJsonArray(undefined), [])
    })

    it('returns empty array for invalid JSON', () => {
      assert.deepEqual(parseJsonArray('not-json'), [])
    })

    it('returns empty array for non-array JSON', () => {
      assert.deepEqual(parseJsonArray('{"key":"value"}'), [])
    })
  })

  describe('renderToolResult', () => {
    it('renders to pretty JSON', () => {
      const result = renderToolResult({ status: 'ok' })
      assert.equal(result, JSON.stringify({ status: 'ok' }, null, 2))
    })
  })
})

describe('no duplicated helpers in tool files', () => {
  const toolFiles = [
    'src/tools/task/tools.ts',
    'src/tools/trajectory/tools.ts',
    'src/tools/handoff/tools.ts',
  ]

  for (const file of toolFiles) {
    it(`${file} does not define parseList locally`, async () => {
      const content = await readFile(join(process.cwd(), file), 'utf-8')
      assert.ok(
        !content.includes('function parseList'),
        `${file} should import parseList, not define it`,
      )
    })

    it(`${file} does not define render locally`, async () => {
      const content = await readFile(join(process.cwd(), file), 'utf-8')
      assert.ok(
        !content.match(/function render\b/),
        `${file} should import render, not define it`,
      )
    })
  }
})
