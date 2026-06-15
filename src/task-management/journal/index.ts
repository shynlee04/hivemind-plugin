import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import { dirname } from "node:path"
import { redactBoundaryFields } from "../../shared/security/redaction.js"

export const SESSION_JOURNAL_STATE_ROLES = [
  "canonical runtime state",
  "audit trail",
  "derived projection",
] as const

export type SessionJournalStateRole = (typeof SESSION_JOURNAL_STATE_ROLES)[number]

export type SessionJournalActor = "human" | "agent" | "system" | "tool"

export type SessionJournalEntry = {
  id: string
  sessionId: string
  turnId?: string
  parentSessionId?: string
  childSessionId?: string
  actor: SessionJournalActor
  eventType: string
  timestamp: number
  source: string
  summary: string
  stateRole: SessionJournalStateRole
  idempotencyKey?: string
}

export type SessionJournalAppendInput = {
  entry: SessionJournalEntry
  filePath: string
  idempotencyKey: string
}

type SessionJournalCreateInput = Omit<SessionJournalEntry, "id"> & { id?: string }

function assertStateRole(value: string): asserts value is SessionJournalStateRole {
  if (!SESSION_JOURNAL_STATE_ROLES.includes(value as SessionJournalStateRole)) {
    throw new Error(`[Hivemind] Invalid session journal state role: ${value}`)
  }
}

function stablePart(value: string | number | undefined): string {
  return value === undefined ? "-" : String(value)
}

/** Build a deterministic replay-friendly journal identifier from public entry fields. */
export function buildJournalId(input: Pick<SessionJournalEntry, "sessionId" | "turnId" | "eventType" | "timestamp" | "source">): string {
  return [input.sessionId, stablePart(input.turnId), input.eventType, input.timestamp, input.source]
    .map((part) => encodeURIComponent(part))
    .join(":")
}

/** Create a validated append-only Session Journal entry. */
export function createJournalEntry(input: SessionJournalCreateInput): SessionJournalEntry {
  assertStateRole(input.stateRole)
  return {
    ...input,
    id: input.id ?? buildJournalId(input),
  }
}

/** Serialize a journal entry to the JSON contract consumed by agents and replay tools. */
export function serializeJournalEntryJson(entry: SessionJournalEntry): SessionJournalEntry {
  return { ...entry }
}

/** Render only bounded metadata and summary fields; never reads raw transcripts. */
export function renderJournalEntryMarkdown(entry: SessionJournalEntry): string {
  return [
    `## Journal Entry ${entry.id}`,
    "",
    `- Session: ${entry.sessionId}`,
    `- Actor: ${entry.actor}`,
    `- Event: ${entry.eventType}`,
    `- Source: ${entry.source}`,
    `- State role: ${entry.stateRole}`,
    `- Summary: ${entry.summary}`,
  ].join("\n")
}

function existingIdempotencyKeys(filePath: string): Set<string> {
  if (!existsSync(filePath)) {
    return new Set()
  }

  const keys = new Set<string>()
  const lines = readFileSync(filePath, "utf-8").split("\n").filter((line) => line.trim().length > 0)
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as { idempotencyKey?: unknown }
      if (typeof parsed.idempotencyKey === "string") {
        keys.add(parsed.idempotencyKey)
      }
    } catch {
      // Corrupt historical lines are ignored so a single bad projection does not block append-only recovery.
    }
  }
  return keys
}

/**
 * Append one JSONL record per unique idempotency key.
 *
 * This module writes only caller-specified journal files. It does not import,
 * patch, or replace continuity/delegation runtime writers.
 */
export function appendJournalEntry({ entry, filePath, idempotencyKey }: SessionJournalAppendInput): SessionJournalEntry {
  mkdirSync(dirname(filePath), { recursive: true })
  const keys = existingIdempotencyKeys(filePath)
  if (keys.has(idempotencyKey)) {
    return { ...entry, idempotencyKey }
  }

  const stored = redactBoundaryFields({ ...entry, idempotencyKey }, { redactFieldNames: ["summary"] })
  appendFileSync(filePath, `${JSON.stringify(stored)}\n`, "utf-8")
  return stored
}
