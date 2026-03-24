import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { getSessionDiagnosticsPath } from '../../../../src/features/event-tracker/paths.js'

type DiagnosticWriterInput = {
  sessionId: string
  timestamp: string
  level?: string
  actor?: string
  source?: string
  message?: string
  details?: string
}

async function loadDiagnosticsWriter() {
  try {
    // @ts-expect-error RED: implementation lands in GREEN.
    return await import('../../../../src/features/event-tracker/writers/diagnostics-writer.js')
  } catch (error) {
    assert.fail(
      `Expected diagnostics writer implementation at src/features/event-tracker/writers/diagnostics-writer.ts: ${String(error)}`,
    )
  }
}

async function readDiagnosticsWriterSource() {
  try {
    return await readFile(
      join(process.cwd(), 'src/features/event-tracker/writers/diagnostics-writer.ts'),
      'utf8',
    )
  } catch (error) {
    assert.fail(
      `Expected diagnostics writer source at src/features/event-tracker/writers/diagnostics-writer.ts: ${String(error)}`,
    )
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('diagnostics-writer uses getSessionDiagnosticsPath and appendExactUtf8Content for append delegation', async () => {
  const source = await readDiagnosticsWriterSource()

  assert.match(source, /getSessionDiagnosticsPath/)
  assert.match(source, /appendExactUtf8Content/)
})

test('appendSessionDiagnostic appends single-line diagnostics.log entries without minting timestamps', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-diagnostics-writer-'))
  const sessionId = 'ses_diagnostics_append_only'
  const diagnosticsPath = getSessionDiagnosticsPath(projectRoot, sessionId)
  const firstEntry: DiagnosticWriterInput = {
    sessionId,
    timestamp: '2026-03-24T13:00:00.000Z',
    level: 'info',
    actor: 'hiveminder',
    source: 'messages.transform',
    message: 'Captured injected context payload.',
    details: 'turn=3',
  }
  const secondEntry: DiagnosticWriterInput = {
    sessionId,
    timestamp: '2026-03-24T13:05:00.000Z',
    level: 'warn',
    actor: 'hiveminder',
    source: 'text.complete',
    message: 'Observed downstream append retry.',
    details: 'attempt=2',
  }

  try {
    await mkdir(dirname(diagnosticsPath), { recursive: true })

    const { appendSessionDiagnostic } = await loadDiagnosticsWriter()

    await appendSessionDiagnostic(projectRoot, firstEntry)
    await appendSessionDiagnostic(projectRoot, secondEntry)

    const content = await readFile(diagnosticsPath, 'utf8')
    const lines = content.split('\n').filter(Boolean)
    const timestamps = content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g) ?? []

    assert.equal(lines.length, 2)
    assert.deepEqual(timestamps, [firstEntry.timestamp, secondEntry.timestamp])
    assert.match(
      lines[0],
      new RegExp(
        `^${escapeRegExp(firstEntry.timestamp)} \\| session=${escapeRegExp(sessionId)} \\| level=info \\| actor=hiveminder \\| source=messages\\.transform \\| message=Captured injected context payload\\. \\| details=turn=3$`,
      ),
    )
    assert.match(
      lines[1],
      new RegExp(
        `^${escapeRegExp(secondEntry.timestamp)} \\| session=${escapeRegExp(sessionId)} \\| level=warn \\| actor=hiveminder \\| source=text\\.complete \\| message=Observed downstream append retry\\. \\| details=attempt=2$`,
      ),
    )
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('renderDiagnosticLogLine tolerates missing optional fields as N/A or empty values without validation failure', async () => {
  const { renderDiagnosticLogLine } = await loadDiagnosticsWriter()
  const rendered = renderDiagnosticLogLine({
    sessionId: 'ses_missing_fields',
    timestamp: '2026-03-24T14:00:00.000Z',
  } satisfies DiagnosticWriterInput)

  assert.doesNotMatch(rendered, /\n/)
  assert.match(
    rendered,
    /^2026-03-24T14:00:00\.000Z \| session=ses_missing_fields \| level=N\/A \| actor=N\/A \| source=N\/A \| message=N\/A \| details=$/,
  )
})
