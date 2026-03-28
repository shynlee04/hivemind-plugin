import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

async function loadErrorLogWriter() {
  return import('./error-log-writer.js')
}

test('appendError writes session-scoped logs under sessions/error-logs', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'error-log-writer-'))

  try {
    const { appendError } = await loadErrorLogWriter()
    const timestamp = '2026-03-29T00:00:00.000Z'

    await appendError(projectRoot, {
      sessionId: 'ses_test',
      timestamp,
      level: 'error',
      message: 'consolidated writer failed',
      context: { reason: 'disk-full' },
    })

    const logPath = join(projectRoot, '.hivemind', 'sessions', 'error-logs', 'ses_test.log')
    const content = await readFile(logPath, 'utf8')

    assert.equal(
      content,
      '[2026-03-29T00:00:00.000Z] [ERROR] consolidated writer failed {"reason":"disk-full"}\n'
    )
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
