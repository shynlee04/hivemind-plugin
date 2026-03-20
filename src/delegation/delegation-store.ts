import * as fs from 'node:fs'
import * as path from 'node:path'

import { getHivemindPath } from '../shared/paths.js'
import { getRuntimePressureContract } from '../shared/pressure-contract.js'
import type { DelegationEvidenceItem, DelegationPacket } from './delegation-packet.js'
import { createDelegationPacket } from './delegation-packet.js'

export interface DelegationEvidenceRecord {
  kind: DelegationEvidenceItem['kind']
  description: string
  createdAt: string
}

export interface DelegationHandoffRecord {
  id: string
  createdAt: string
  updatedAt: string
  status: 'open' | 'validated' | 'closed'
  summary: string
  nextSteps: string[]
  packet: DelegationPacket
  evidence: DelegationEvidenceRecord[]
  closeSummary?: string
}

export interface CreateDelegationHandoffInput {
  packet: Parameters<typeof createDelegationPacket>[0]
  summary: string
  nextSteps?: string[]
  evidence?: DelegationEvidenceRecord[]
}

export interface UpdateDelegationHandoffInput {
  id: string
  summary?: string
  nextSteps?: string[]
  evidence?: DelegationEvidenceRecord[]
}

function getHandoffDirectory(projectRoot: string): string {
  return path.join(getHivemindPath(projectRoot), 'handoffs')
}

export function getDelegationHandoffPath(projectRoot: string, id: string): string {
  return path.join(getHandoffDirectory(projectRoot), `${id}.json`)
}

function ensureHandoffDirectory(projectRoot: string): string {
  const directory = getHandoffDirectory(projectRoot)
  fs.mkdirSync(directory, { recursive: true })
  return directory
}

function readHandoffFile(filePath: string): DelegationHandoffRecord | null {
  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DelegationHandoffRecord
  } catch {
    return null
  }
}

function writeHandoffRecord(projectRoot: string, record: DelegationHandoffRecord): DelegationHandoffRecord {
  ensureHandoffDirectory(projectRoot)
  fs.writeFileSync(getDelegationHandoffPath(projectRoot, record.id), JSON.stringify(record, null, 2))
  return record
}

function buildDelegationId(existingId?: string): string {
  return existingId ?? `dlg_${Date.now().toString(36)}`
}

export function createDelegationHandoff(
  projectRoot: string,
  input: CreateDelegationHandoffInput,
): DelegationHandoffRecord {
  const createdAt = new Date().toISOString()
  const delegationId = buildDelegationId(input.packet.delegationId)
  const packet = createDelegationPacket({
    ...input.packet,
    delegationId,
  })

  return writeHandoffRecord(projectRoot, {
    id: delegationId,
    createdAt,
    updatedAt: createdAt,
    status: 'open',
    summary: input.summary,
    nextSteps: input.nextSteps ?? [],
    packet,
    evidence: input.evidence ?? [],
  })
}

export function readDelegationHandoff(
  projectRoot: string,
  id: string,
): DelegationHandoffRecord | null {
  return readHandoffFile(getDelegationHandoffPath(projectRoot, id))
}

export function listDelegationHandoffs(projectRoot: string): DelegationHandoffRecord[] {
  const directory = ensureHandoffDirectory(projectRoot)
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => readHandoffFile(path.join(directory, file)))
    .filter((record): record is DelegationHandoffRecord => record !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function updateDelegationHandoff(
  projectRoot: string,
  input: UpdateDelegationHandoffInput,
): DelegationHandoffRecord | null {
  const existing = readDelegationHandoff(projectRoot, input.id)
  if (!existing) {
    return null
  }

  const mergedEvidence = [
    ...existing.evidence,
    ...(input.evidence ?? []),
  ]

  return writeHandoffRecord(projectRoot, {
    ...existing,
    summary: input.summary ?? existing.summary,
    nextSteps: input.nextSteps ?? existing.nextSteps,
    evidence: mergedEvidence,
    updatedAt: new Date().toISOString(),
  })
}

export function validateDelegationHandoff(
  projectRoot: string,
  id: string,
): {
  record: DelegationHandoffRecord | null
  valid: boolean
  missingEvidence: string[]
  evidenceRefs: string[]
  pressureContract: ReturnType<typeof getRuntimePressureContract>
} {
  const record = readDelegationHandoff(projectRoot, id)
  if (!record) {
    return {
      record: null,
      valid: false,
      missingEvidence: ['handoff-not-found'],
      evidenceRefs: [getDelegationHandoffPath(projectRoot, id)],
      pressureContract: getRuntimePressureContract('handoff-validation'),
    }
  }

  const evidenceKeys = new Set(record.evidence.map((entry) => `${entry.kind}:${entry.description}`))
  const missingEvidence = record.packet.requiredEvidence
    .filter((item) => item.required)
    .filter((item) => !evidenceKeys.has(`${item.kind}:${item.description}`))
    .map((item) => `${item.kind}:${item.description}`)

  const nextRecord = missingEvidence.length === 0 && record.status === 'open'
    ? writeHandoffRecord(projectRoot, {
        ...record,
        status: 'validated',
        updatedAt: new Date().toISOString(),
      })
    : record

  return {
    record: nextRecord,
    valid: missingEvidence.length === 0,
    missingEvidence,
    evidenceRefs: [getDelegationHandoffPath(projectRoot, id)],
    pressureContract: getRuntimePressureContract('handoff-validation'),
  }
}

export function closeDelegationHandoff(
  projectRoot: string,
  id: string,
  closeSummary: string,
): {
  record: DelegationHandoffRecord | null
  valid: boolean
  missingEvidence: string[]
  evidenceRefs: string[]
  pressureContract: ReturnType<typeof getRuntimePressureContract>
} {
  const validation = validateDelegationHandoff(projectRoot, id)
  if (!validation.record || !validation.valid) {
    return validation
  }

  const record = writeHandoffRecord(projectRoot, {
    ...validation.record,
    status: 'closed',
    closeSummary,
    updatedAt: new Date().toISOString(),
  })

  return {
    record,
    valid: true,
    missingEvidence: [],
    evidenceRefs: [getDelegationHandoffPath(projectRoot, id)],
    pressureContract: getRuntimePressureContract('handoff-validation'),
  }
}
