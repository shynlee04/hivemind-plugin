import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import type { CommandExecutionInput } from '../../commands/slash-command/command-types.js'
import { getHivemindPath } from '../../shared/paths.js'
import type { CommandSessionContractLinkage } from '../agent-work-contract/engine/command-session-contract.js'

import type { TurnExportProjectionV1 } from './turn-output.js'

const CONTINUITY_DIR = 'runtime-continuity'

export interface WorkflowContinuityTransactionV1 {
  version: 'v1'
  continuityId: string
  continuityKey: string
  commandId: 'hm-plan' | 'hm-implement'
  phase: 'planning' | 'implementation'
  currentSessionId: string
  priorSessionId?: string
  turnOutputRefs: string[]
  linkedContractId?: string
  linkedContractFile?: string
  delegationId?: string
  handoffRef?: string
  targetSessionId?: string
  resumeTarget?: string
  delegationStatus?: 'open' | 'validated' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface WorkflowContinuityLinkage {
  transaction: WorkflowContinuityTransactionV1
  filePath: string
}

export interface WorkflowContinuityIdentityInput {
  workflowId?: string
  trajectoryId?: string
  sessionId: string
}

function sanitizeKeyFragment(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 160) || 'session:unknown'
}

function buildContinuityId(continuityKey: string): string {
  return `continuity-${sanitizeKeyFragment(continuityKey).replace(/:/g, '-')}`
}

function getContinuityDirectory(projectRoot: string): string {
  return path.join(getHivemindPath(projectRoot), 'project', CONTINUITY_DIR)
}

function getContinuityFilePath(projectRoot: string, continuityId: string): string {
  return path.join(getContinuityDirectory(projectRoot), `${continuityId}.json`)
}

function getTurnOutputRefs(projection: TurnExportProjectionV1): string[] {
  return [projection.markdownPath, projection.yamlPath].filter((value): value is string => Boolean(value))
}

export function resolveWorkflowContinuityKey(input: WorkflowContinuityIdentityInput): string {
  if (input.workflowId) {
    return `workflow:${input.workflowId}`
  }

  if (input.trajectoryId) {
    return `trajectory:${input.trajectoryId}`
  }

  return `session:${input.sessionId}`
}

function resolveCandidateContinuityKeys(input: WorkflowContinuityIdentityInput): string[] {
  return [...new Set([
    input.workflowId ? `workflow:${input.workflowId}` : undefined,
    input.trajectoryId ? `trajectory:${input.trajectoryId}` : undefined,
    `session:${input.sessionId}`,
  ].filter((value): value is string => Boolean(value)))]
}

async function readContinuityTransaction(
  projectRoot: string,
  continuityKey: string,
): Promise<WorkflowContinuityTransactionV1 | null> {
  const filePath = getContinuityFilePath(projectRoot, buildContinuityId(continuityKey))

  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content) as WorkflowContinuityTransactionV1
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

/**
 * Result of listing workflow continuity transactions.
 * Explicitly tracks both valid transactions and corruption errors.
 */
export interface ListContinuityResult {
  transactions: WorkflowContinuityTransactionV1[]
  errors: Array<{
    file: string
    error: string
  }>
}

async function listWorkflowContinuityTransactions(projectRoot: string): Promise<ListContinuityResult> {
  const directory = getContinuityDirectory(projectRoot)

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    const results = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => {
        const filePath = path.join(directory, entry.name)
        try {
          const content = await fs.readFile(filePath, 'utf8')
          const transaction = JSON.parse(content) as WorkflowContinuityTransactionV1
          return { ok: true as const, transaction, file: entry.name }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          return {
            ok: false as const,
            file: entry.name,
            error: errorMessage,
          }
        }
      }))

    const transactions: WorkflowContinuityTransactionV1[] = []
    const errors: ListContinuityResult['errors'] = []

    for (const result of results) {
      if (result.ok) {
        transactions.push(result.transaction)
      } else {
        errors.push({ file: result.file, error: result.error })
      }
    }

    return { transactions, errors }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { transactions: [], errors: [] }
    }

    throw error
  }
}

async function findSessionLinkedContinuityTransaction(
  projectRoot: string,
  sessionId: string,
): Promise<WorkflowContinuityTransactionV1 | null> {
  const { transactions, errors } = await listWorkflowContinuityTransactions(projectRoot)

  // Log corruption errors for visibility (errors are no longer silently dropped)
  if (errors.length > 0) {
    console.warn(`[workflow-continuity] ${errors.length} corrupted continuity record(s) found:`, errors)
  }

  return transactions
    .filter((transaction) => (
      transaction.currentSessionId === sessionId
      || transaction.priorSessionId === sessionId
      || transaction.targetSessionId === sessionId
    ))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null
}

export async function loadWorkflowContinuityTransactionForExecution(
  projectRoot: string,
  input: WorkflowContinuityIdentityInput,
): Promise<WorkflowContinuityTransactionV1 | null> {
  for (const continuityKey of resolveCandidateContinuityKeys(input)) {
    const transaction = await readContinuityTransaction(projectRoot, continuityKey)
    if (transaction) {
      return transaction
    }
  }

  return findSessionLinkedContinuityTransaction(projectRoot, input.sessionId)
}

export async function upsertWorkflowContinuityTransaction(input: {
  projectRoot: string
  commandId: 'hm-plan' | 'hm-implement'
  executionInput: CommandExecutionInput
  phase: 'planning' | 'implementation'
  turnOutputProjection: TurnExportProjectionV1
  sessionContractLinkage: CommandSessionContractLinkage
}): Promise<WorkflowContinuityLinkage> {
  const continuityKey = resolveWorkflowContinuityKey(input.executionInput)
  const continuityId = buildContinuityId(continuityKey)
  const filePath = getContinuityFilePath(input.projectRoot, continuityId)
  const existing = await loadWorkflowContinuityTransactionForExecution(input.projectRoot, input.executionInput)
  const now = new Date().toISOString()

  await fs.mkdir(getContinuityDirectory(input.projectRoot), { recursive: true })

  const transaction: WorkflowContinuityTransactionV1 = {
    version: 'v1',
    continuityId,
    continuityKey,
    commandId: input.commandId,
    phase: input.phase,
    currentSessionId: input.executionInput.sessionId,
    priorSessionId: existing && existing.currentSessionId !== input.executionInput.sessionId
      ? existing.currentSessionId
      : existing?.priorSessionId,
    turnOutputRefs: getTurnOutputRefs(input.turnOutputProjection),
    linkedContractId: input.sessionContractLinkage.contract.contractId,
    linkedContractFile: input.sessionContractLinkage.contractFilePath,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await fs.writeFile(filePath, JSON.stringify(transaction, null, 2), 'utf8')

  return {
    transaction,
    filePath,
  }
}

export async function upsertWorkflowDelegationContinuityLinkage(input: {
  projectRoot: string
  identity: WorkflowContinuityIdentityInput
  actingSessionId: string
  linkedContractId?: string
  linkedContractFile?: string
  delegation: {
    delegationId: string
    handoffRef: string
    targetSessionId: string
    resumeTarget?: string
    status: 'open' | 'validated' | 'closed'
  }
}): Promise<WorkflowContinuityLinkage | null> {
  const existing = await loadWorkflowContinuityTransactionForExecution(input.projectRoot, input.identity)
  const continuityKey = existing?.continuityKey ?? resolveWorkflowContinuityKey(input.identity)
  const continuityId = buildContinuityId(continuityKey)
  const filePath = getContinuityFilePath(input.projectRoot, continuityId)
  const linkedContractId = existing?.linkedContractId ?? input.linkedContractId
  const linkedContractFile = existing?.linkedContractFile ?? input.linkedContractFile

  if (!linkedContractId) {
    return null
  }

  const now = new Date().toISOString()

  await fs.mkdir(getContinuityDirectory(input.projectRoot), { recursive: true })

  const transaction: WorkflowContinuityTransactionV1 = {
    version: 'v1',
    continuityId,
    continuityKey,
    commandId: existing?.commandId ?? 'hm-plan',
    phase: existing?.phase ?? 'planning',
    currentSessionId: input.actingSessionId,
    priorSessionId: existing && existing.currentSessionId !== input.actingSessionId
      ? existing.currentSessionId
      : existing?.priorSessionId,
    turnOutputRefs: existing?.turnOutputRefs ?? [],
    linkedContractId,
    linkedContractFile,
    delegationId: input.delegation.delegationId,
    handoffRef: input.delegation.handoffRef,
    targetSessionId: input.delegation.targetSessionId,
    resumeTarget: input.delegation.resumeTarget,
    delegationStatus: input.delegation.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await fs.writeFile(filePath, JSON.stringify(transaction, null, 2), 'utf8')

  return {
    transaction,
    filePath,
  }
}
