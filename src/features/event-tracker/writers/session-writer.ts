import { readFile, writeFile } from 'node:fs/promises'

import {
  getSessionDelegationPath,
  getSessionInjectionPath,
  getSessionMetadataPath,
} from '../paths.js'
import type {
  SessionDelegationAppendInput,
  SessionInjectionAppendInput,
  SessionMetadataInput,
  SessionMeta,
} from '../types.js'

import { appendExactUtf8Content } from './base-writer.js'

function trimOrFallback(value: string | undefined, fallback = 'N/A'): string {
  return value?.trim() ? value : fallback
}

function trimOrEmpty(value: string | undefined): string {
  return value?.trim() ? value : ''
}

function createInitialSessionMetadata(input: SessionMetadataInput): SessionMeta {
  return {
    sessionId: input.sessionId,
    lineage: input.lineage,
    purposeClass: input.purposeClass,
    agent: input.agent,
    created: input.timestamp,
    updated: input.timestamp,
    parentSessionId: input.parentSessionId ?? null,
    childSessionIds: [],
    status: input.status ?? 'active',
    userMessageCount: 0,
    agentOutputCount: 0,
    delegationCount: 0,
  }
}

async function readExistingSessionMetadata(filePath: string): Promise<SessionMeta | null> {
  try {
    const content = await readFile(filePath, 'utf8')
    return JSON.parse(content) as SessionMeta
  } catch {
    return null
  }
}

/**
 * Creates or updates the flat journey-events metadata JSON while preserving baseline identity fields.
 * @param projectRoot Absolute or workspace project root.
 * @param input Session metadata input for init or update.
 * @deprecated Use consolidated-journal-writer for session metadata output.
 */
export async function initOrUpdateSessionMetadata(
  projectRoot: string,
  input: SessionMetadataInput,
): Promise<void> {
  const metadataPath = getSessionMetadataPath(projectRoot, input.sessionId)
  const existing = await readExistingSessionMetadata(metadataPath)

  const next: SessionMeta = existing
    ? {
        ...existing,
        updated: input.timestamp,
        status: input.status ?? existing.status,
      }
    : createInitialSessionMetadata(input)

  await writeFile(metadataPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
}

function renderSessionDelegationBlock(entry: SessionDelegationAppendInput): string {
  const details = trimOrEmpty(entry.details)

  const lines = [
    '## Delegation Entry',
    '',
    `- **Timestamp**: ${entry.timestamp}`,
    `- **Packet ID**: ${entry.packetId}`,
    `- **Delegated To**: ${trimOrFallback(entry.delegatedTo)}`,
    `- **Status**: ${trimOrFallback(entry.status)}`,
    `- **Summary**: ${trimOrFallback(entry.summary)}`,
  ]

  if (details) {
    lines.push('', '### Details', '', details)
  }

  lines.push('', '')
  return lines.join('\n')
}

/**
 * Appends one legacy delegation block to the flat journey-events markdown file.
 * @param projectRoot Absolute or workspace project root.
 * @param entry Delegation entry supplied by caller.
 * @deprecated Delegation compatibility blocks now share the session journey-events markdown file.
 */
export async function appendSessionDelegationEntry(
  projectRoot: string,
  entry: SessionDelegationAppendInput,
): Promise<void> {
  const delegationPath = getSessionDelegationPath(projectRoot, entry.sessionId)
  const block = renderSessionDelegationBlock(entry)

  await appendExactUtf8Content(delegationPath, block)
}

function renderSessionInjectionBlock(entry: SessionInjectionAppendInput): string {
  return [
    '## Injection Entry',
    '',
    `- **Timestamp**: ${entry.timestamp}`,
    `- **Source**: ${trimOrFallback(entry.source)}`,
    `- **Summary**: ${trimOrFallback(entry.summary)}`,
    '',
    '### Payload',
    '',
    entry.payload,
    '',
    '',
  ].join('\n')
}

/**
 * Appends one legacy injection block to the flat journey-events markdown file.
 * @param projectRoot Absolute or workspace project root.
 * @param entry Injection entry supplied by caller.
 * @deprecated Injection compatibility blocks now share the session journey-events markdown file.
 */
export async function appendSessionInjectionEntry(
  projectRoot: string,
  entry: SessionInjectionAppendInput,
): Promise<void> {
  const injectionPath = getSessionInjectionPath(projectRoot, entry.sessionId)
  const block = renderSessionInjectionBlock(entry)

  await appendExactUtf8Content(injectionPath, block)
}
