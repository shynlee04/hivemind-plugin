import * as fs from 'node:fs'
import * as path from 'node:path'

import { getHivemindPath } from '../shared/paths.js'
import { getRuntimePressureContract } from '../shared/pressure-contract.js'
import type { DelegationEvidenceItem, DelegationPacket } from './delegation-packet.js'
import { createDelegationPacket } from './delegation-packet.js'
import {
  validateDelegationRecord,
  formatValidationIssues,
} from './delegation-record.schema.js'
import { Result, ValidationError } from '../shared/errors.js'

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

/**
 * Read and validate a handoff file from disk.
 * Returns structured result with either the validated record or validation error details.
 * Distinguishes between not-found (ENOENT), JSON parse errors (CORRUPTED),
 * and schema validation failures (SCHEMA_VALIDATION_FAILED).
 */
function readHandoffFileResult(filePath: string): Result<DelegationHandoffRecord, ValidationError> {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: new ValidationError(`Handoff file not found: ${filePath}`, { filePath }) }
  }

  let rawContent: string
  try {
    rawContent = fs.readFileSync(filePath, 'utf-8')
  } catch (parseError) {
    return {
      ok: false,
      error: new ValidationError(`Failed to read handoff file: ${filePath}`, { filePath, cause: String(parseError) }),
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    return {
      ok: false,
      error: new ValidationError(`Invalid JSON in handoff file: ${filePath}`, { filePath }),
    }
  }

  const validationResult = validateDelegationRecord(parsed)
  if (!validationResult.ok) {
    const detail = formatValidationIssues(validationResult.issues)
    return {
      ok: false,
      error: new ValidationError(
        `Handoff record schema validation failed: ${filePath}`,
        { filePath, detail },
        validationResult.issues,
      ),
    }
  }

  // Cast is safe after runtime validation - schema ensures pressureContractId is a string
  // and the DelegationHandoffRecord interface accepts string for that field
  return { ok: true, value: validationResult.value as unknown as DelegationHandoffRecord }
}

/**
 * Read a handoff file, returning null if not found or validation fails.
 * For detailed error information, use readHandoffFileResult.
 */
function readHandoffFile(filePath: string): DelegationHandoffRecord | null {
  const result = readHandoffFileResult(filePath)
  if (!result.ok) {
    // Log the validation error for diagnostics
    console.warn(`[delegation-store] ${result.error.message}`)
    return null
  }
  return result.value
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
  const results = fs.readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => readHandoffFileResult(path.join(directory, file)))

  // Log any validation errors for diagnostics
  for (const result of results) {
    if (!result.ok) {
      console.warn(`[delegation-store] ${result.error.message}`)
    }
  }

  return results
    .filter((result): result is { ok: true; value: DelegationHandoffRecord } => result.ok)
    .map((result) => result.value)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function updateDelegationHandoff(
  projectRoot: string,
  input: UpdateDelegationHandoffInput,
): DelegationHandoffRecord | null {
  const result = readHandoffFileResult(getDelegationHandoffPath(projectRoot, input.id))
  if (!result.ok) {
    // Log corruption but maintain backward compatibility by returning null
    console.warn(`[delegation-store] ${result.error.message}`)
    return null
  }

  const existing = result.value
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
