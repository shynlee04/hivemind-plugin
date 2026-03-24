import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { getSessionDelegationPath } from '../paths.js'

type DelegationAppendInput = {
  sessionId: string
  timestamp: string
  packetId: string
  delegatedTo: string
  status: string
  summary: string
  details?: string
}

async function loadSessionWriter() {
  return import('../writers/session-writer.js')
}

test('session writer appends delegation.md with deterministic section framing', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-session-writer-red-'))
  const sessionId = 'ses_plan6_red_delegation_append'
  const delegationPath = getSessionDelegationPath(projectRoot, sessionId)

  const first: DelegationAppendInput = {
    sessionId,
    timestamp: '2026-03-24T18:30:00.000Z',
    packetId: 'pkt-plan6-red-1',
    delegatedTo: 'hiveq',
    status: 'partial',
    summary: 'Return contract incomplete due to missing evidence rows.',
    details: 'blocked_routes=["missing-red-proof"]',
  }

  const second: DelegationAppendInput = {
    sessionId,
    timestamp: '2026-03-24T18:33:00.000Z',
    packetId: 'pkt-plan6-red-2',
    delegatedTo: 'hivexplorer',
    status: 'complete',
    summary: 'Added all requested tests and RED evidence artifact.',
    details: 'artifacts=["plan-6-red-evidence.md"]',
  }

  try {
    await mkdir(dirname(delegationPath), { recursive: true })

    const { appendSessionDelegationEntry } = await loadSessionWriter()

    await appendSessionDelegationEntry(projectRoot, first)
    const contentAfterFirstAppend = await readFile(delegationPath, 'utf8')

    await appendSessionDelegationEntry(projectRoot, second)
    const contentAfterSecondAppend = await readFile(delegationPath, 'utf8')

    assert.match(contentAfterSecondAppend, /## Delegation Entry/)
    assert.match(contentAfterSecondAppend, /- \*\*Timestamp\*\*: 2026-03-24T18:30:00.000Z/)
    assert.match(contentAfterSecondAppend, /- \*\*Timestamp\*\*: 2026-03-24T18:33:00.000Z/)
    assert.match(contentAfterSecondAppend, /- \*\*Packet ID\*\*: pkt-plan6-red-1/)
    assert.match(contentAfterSecondAppend, /- \*\*Packet ID\*\*: pkt-plan6-red-2/)
    assert.match(contentAfterSecondAppend, /blocked_routes=\["missing-red-proof"\]/)
    assert.match(contentAfterSecondAppend, /artifacts=\["plan-6-red-evidence.md"\]/)
    assert.ok(contentAfterSecondAppend.startsWith(contentAfterFirstAppend))
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('session writer delegation append is append-only and writes one block per explicit call', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-session-writer-red-'))
  const sessionId = 'ses_plan6_red_delegation_append_contract'
  const delegationPath = getSessionDelegationPath(projectRoot, sessionId)

  try {
    await mkdir(dirname(delegationPath), { recursive: true })

    const { appendSessionDelegationEntry } = await loadSessionWriter()

    await appendSessionDelegationEntry(projectRoot, {
      sessionId,
      timestamp: '2026-03-24T18:40:00.000Z',
      packetId: 'pkt-plan6-red-3',
      delegatedTo: 'hiveq',
      status: 'partial',
      summary: 'First write for append-only check.',
    } satisfies DelegationAppendInput)

    await appendSessionDelegationEntry(projectRoot, {
      sessionId,
      timestamp: '2026-03-24T18:41:00.000Z',
      packetId: 'pkt-plan6-red-4',
      delegatedTo: 'hiveq',
      status: 'complete',
      summary: 'Second write for append-only check.',
    } satisfies DelegationAppendInput)

    const content = await readFile(delegationPath, 'utf8')
    const blockCount = (content.match(/^## Delegation Entry$/gm) ?? []).length

    assert.equal(blockCount, 2)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
