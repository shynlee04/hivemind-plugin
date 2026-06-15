import type { Delegation, SessionContinuityRecord } from "../../shared/types.js"
import type { SessionJournalEntry } from "./index.js"

export type ExecutionLineageStateRole = "derived projection"

export type ExecutionLineageSource = "continuity" | "delegation" | "journal" | "combined"

export type ExecutionLineageRecord = {
  id: string
  stateRole: ExecutionLineageStateRole
  source: ExecutionLineageSource
  sessionId: string
  childSessionId?: string
  parentSessionId?: string
  delegationId?: string
  planId?: string
  taskId?: string
  pipelineKey?: string
  actor: string
  agent?: string
  status: string
  eventType: string
  timestamp: number
  executionMode?: Delegation["executionMode"]
  queueKey?: string
  summary?: string
  evidenceRefs: string[]
}

export type ExecutionLineageInput = {
  continuityRecords: SessionContinuityRecord[]
  delegations: Delegation[]
  journalEntries: SessionJournalEntry[]
}

export type ExecutionLineageOptions = {
  pipelineKey?: string
}

function evidenceFromContinuity(record: SessionContinuityRecord | undefined): string[] {
  if (!record) return []
  const packet = record.metadata.delegationPacket
  return [
    `continuity:${record.sessionID}`,
    ...(packet?.artifacts.map((artifact) => `artifact:${artifact}`) ?? []),
    ...(packet?.commits.map((commit) => `commit:${commit}`) ?? []),
    ...(packet?.parentChain.map((parent) => `parent:${parent}`) ?? []),
  ]
}

function planFromContinuity(record: SessionContinuityRecord | undefined): string | undefined {
  return record?.metadata.delegationPacket?.plan
}

function journalRefsForDelegation(delegation: Delegation, entries: SessionJournalEntry[]): string[] {
  return entries
    .filter((entry) => entry.sessionId === delegation.childSessionId || entry.parentSessionId === delegation.parentSessionId)
    .map((entry) => `journal:${entry.id}`)
}

/** Build rebuildable execution lineage projection records from supplied runtime inputs. */
export function buildExecutionLineage(
  input: ExecutionLineageInput,
  options: ExecutionLineageOptions = {},
): ExecutionLineageRecord[] {
  return input.delegations.map((delegation) => {
    const continuity = input.continuityRecords.find((record) => record.sessionID === delegation.parentSessionId)
    const evidenceRefs = [
      ...evidenceFromContinuity(continuity),
      `delegation:${delegation.id}`,
      ...journalRefsForDelegation(delegation, input.journalEntries),
    ]

    return {
      id: `lineage:${delegation.id}`,
      stateRole: "derived projection",
      source: "combined",
      sessionId: delegation.parentSessionId,
      childSessionId: delegation.childSessionId,
      parentSessionId: delegation.parentSessionId,
      delegationId: delegation.id,
      planId: planFromContinuity(continuity),
      ...(options.pipelineKey ? { pipelineKey: options.pipelineKey } : {}),
      actor: "agent",
      agent: delegation.agent,
      status: delegation.status,
      eventType: "delegation.projected",
      timestamp: delegation.completedAt ?? delegation.createdAt,
      executionMode: delegation.executionMode,
      queueKey: delegation.queueKey,
      evidenceRefs,
    }
  })
}

function cell(value: string | undefined): string {
  return value && value.length > 0 ? value.replace(/\|/g, "\\|") : "—"
}

/** Render bounded agent-readable lineage summaries without raw result blobs. */
export function renderExecutionLineageMarkdown(records: ExecutionLineageRecord[]): string {
  if (records.length === 0) {
    return "No execution lineage records available."
  }

  const rows = records.map((record) => [
    cell(record.delegationId),
    cell(record.parentSessionId),
    cell(record.childSessionId),
    cell(record.agent),
    cell(record.status),
    cell(record.pipelineKey),
    cell(record.evidenceRefs.join(", ")),
    cell(record.summary),
  ].join(" | "))

  return [
    "| Delegation | Parent | Child | Agent | Status | Pipeline | Evidence | Summary |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map((row) => `| ${row} |`),
  ].join("\n")
}
