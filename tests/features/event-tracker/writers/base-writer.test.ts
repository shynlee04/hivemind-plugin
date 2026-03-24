import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { appendExactUtf8Content } from '../../../../src/features/event-tracker/writers/base-writer.js'

test('appendExactUtf8Content appends the exact caller-provided UTF-8 string to a new file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-event-tracker-base-writer-'))
  const filePath = join(directory, 'events.md')
  const payload = 'raw caller content\n- no formatting\n{"keep":true}'

  try {
    await appendExactUtf8Content(filePath, payload)

    await access(filePath)
    const content = await readFile(filePath, 'utf8')
    assert.equal(content, payload)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('appendExactUtf8Content preserves exact UTF-8 string content across multiple deterministic appends', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-event-tracker-base-writer-'))
  const filePath = join(directory, 'events.md')
  const first = 'first block\n'
  const second = 'second block\n  indented\n'

  try {
    await writeFile(filePath, '', 'utf8')

    await appendExactUtf8Content(filePath, first)
    await appendExactUtf8Content(filePath, second)

    const content = await readFile(filePath, 'utf8')
    assert.equal(content, first + second)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
