import { redactTextSecrets } from "../../../shared/security/redaction.js"
import { parseProductDetoxSessionMarkdown } from "./parser.js"
import { sanitizeSessionArtifactStem } from "./hook-event.js"
import type {
  EventTrackerFileSystem,
  ParsedSubSession,
  SessionJourneyDelegation,
  SessionJourneyDocument,
  SessionJourneyEvent,
  SessionJourneyTocEntry,
  SessionJourneyToolUsage,
} from "./types.js"

const MAX_EVENTS_PER_DOCUMENT = 100

/**
 * Creates an empty event-tracker journey document for a target session.
 *
 * @param event - First event used to seed timestamps and default document metadata.
 * @param targetSessionId - Optional root session ID for grouped child-session artifacts.
 * @returns A schema-compatible `SessionJourneyDocument` with no events yet recorded.
 *
 * @example
 * ```ts
 * const document = createEmptyDocument(event)
 * document._schema // "harness/event-tracker/v1"
 * ```
 */
export function createEmptyDocument(
  event: SessionJourneyEvent,
  targetSessionId = event.rootSessionId ?? event.sessionId,
): SessionJourneyDocument {
  const artifactStem = sanitizeSessionArtifactStem(targetSessionId)
  return {
    _schema: "harness/event-tracker/v1",
    sessionId: targetSessionId,
    semanticSessionId: artifactStem,
    artifactStem,
    mainSessionId: targetSessionId,
    lineage: [],
    purposeClass: "unspecified",
    keyFindings: [],
    resumable: true,
    startedAt: null,
    updatedAt: event.timestamp,
    status: "active",
    counters: { eventCount: 0, sessionStartCount: 0, sessionEndCount: 0 },
    actors: [],
    subSessions: [],
    delegations: [],
    toolsUsed: [],
    lastMessageOutput: "",
    exportMeta: null,
    toc: [],
    events: [],
  }
}

/**
 * Reads and normalizes a persisted event-tracker JSON document, or creates a new one.
 *
 * @param fs - Filesystem adapter used for JSON existence and read operations.
 * @param jsonPath - Absolute JSON artifact path to read.
 * @param event - Event used when the document does not exist yet.
 * @param targetSessionId - Optional root session ID for new document creation.
 * @returns A normalized event-tracker document that satisfies the v1 schema guard.
 * @throws {Error} When the JSON exists but cannot be parsed as a v1 event-tracker document.
 *
 * @example
 * ```ts
 * const document = readDocument(fs, paths.jsonPath, event)
 * ```
 */
export function readDocument(
  fs: EventTrackerFileSystem,
  jsonPath: string,
  event: SessionJourneyEvent,
  targetSessionId?: string,
): SessionJourneyDocument {
  if (!fs.existsSync(jsonPath)) {
    return createEmptyDocument(event, targetSessionId)
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as unknown
    if (!isJourneyDocument(parsed)) {
      throw new Error("invalid schema")
    }
    return normalizeDocument(parsed)
  } catch (error) {
    throw new Error(`[Harness] Failed to parse event-tracker JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Reads an existing document for root-session discovery without creating missing files.
 *
 * @param fs - Filesystem adapter used to read the candidate JSON artifact.
 * @param jsonPath - Absolute JSON path to parse.
 * @returns A normalized event-tracker document when schema-compatible, otherwise `null`.
 *
 * @example
 * ```ts
 * const existing = readExistingDocumentForScan(fs, candidatePath)
 * ```
 */
export function readExistingDocumentForScan(fs: EventTrackerFileSystem, jsonPath: string): SessionJourneyDocument | null {
  const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as unknown
  return isJourneyDocument(parsed) ? normalizeDocument(parsed) : null
}

/**
 * Checks whether a journey document already contains a session identifier.
 *
 * @param document - Normalized event-tracker document to inspect.
 * @param sessionId - Session ID to match against root, child, and event membership.
 * @returns `true` when the session appears anywhere in the document journey graph.
 *
 * @example
 * ```ts
 * documentContainsSession(document, "ses_child") // true when a child event is present
 * ```
 */
export function documentContainsSession(document: SessionJourneyDocument, sessionId: string): boolean {
  return document.sessionId === sessionId
    || document.mainSessionId === sessionId
    || document.subSessions.some((subSession) => subSession.sessionId === sessionId)
    || document.events.some((event) => event.sessionId === sessionId)
}

/**
 * Adds an event to a document while preserving de-duplication and bounded retention.
 *
 * @param document - Existing normalized document to evolve.
 * @param event - New journey event to insert by deterministic event ID.
 * @returns The evolved document plus a `written` flag indicating whether the event was new.
 *
 * @example
 * ```ts
 * const { document: next, written } = addEvent(document, event)
 * ```
 */
export function addEvent(
  document: SessionJourneyDocument,
  event: SessionJourneyEvent,
): { document: SessionJourneyDocument; written: boolean } {
  if (document.events.some((existing) => existing.id === event.id)) {
    return { document, written: false }
  }
  const events = retainBoundedEvents([...document.events, event].sort((a, b) => a.timestamp - b.timestamp))
  const maxTimestamp = Math.max(document.updatedAt, event.timestamp, ...events.map((item) => item.timestamp))
  const withMetadata = addDelegation(addToolUsage(document, event.toolUsage), event.delegation)
  const next: SessionJourneyDocument = {
    ...withMetadata,
    sessionId: document.sessionId,
    semanticSessionId: document.semanticSessionId,
    artifactStem: document.artifactStem,
    mainSessionId: document.mainSessionId ?? document.sessionId,
    startedAt: document.startedAt ?? (event.type === "session_start" ? event.timestamp : null),
    updatedAt: maxTimestamp,
    status: statusFromEvents(events),
    counters: {
      eventCount: events.length,
      sessionStartCount: events.filter((item) => item.type === "session_start").length,
      sessionEndCount: events.filter((item) => item.type === "session_end").length,
    },
    toc: buildToc(events),
    events,
  }
  return { document: next, written: true }
}

/**
 * Merges parsed session-export Markdown metadata into a journey document.
 *
 * @param document - Existing event-tracker document to evolve.
 * @param event - Synthetic session-updated event representing the export merge.
 * @param markdown - Session export Markdown to parse and merge.
 * @returns A schema-compatible document with parsed actors, tools, delegations, and export metadata.
 *
 * @example
 * ```ts
 * const merged = mergeExportMetadata(document, exportEvent, markdown)
 * ```
 */
export function mergeExportMetadata(
  document: SessionJourneyDocument,
  event: SessionJourneyEvent,
  markdown: string,
): SessionJourneyDocument {
  const parsed = parseProductDetoxSessionMarkdown(markdown)
  const { document: withEvent } = addEvent(document, event)
  const timestamp = Date.parse(parsed.header.updated) || event.timestamp
  const parsedTools = parsed.turns.flatMap((turn) => turn.toolInvocations.map((tool): SessionJourneyToolUsage => ({
    toolName: tool.toolName,
    status: "observed",
    summary: tool.toolName === "task"
      ? (tool.outputSummary.match(/task_id:\s*(ses_[A-Za-z0-9]+)/)?.[0] ?? "task result observed")
      : "tool invocation observed",
    timestamp,
  })))
  const parsedDelegations = parsed.turns.flatMap((turn) => turn.delegations.map((delegation): SessionJourneyDelegation => ({
    packetId: delegation.packetId,
    subSessionId: delegation.subSessionId,
    delegatedTo: delegation.delegatedTo,
    description: delegation.description,
    subagentType: delegation.subagentType,
    status: delegation.subSessionId ? "linked" : "observed",
  })))
  return {
    ...withEvent,
    sessionId: parsed.header.sessionId,
    semanticSessionId: parsed.meta.artifactStem,
    artifactStem: parsed.meta.artifactStem,
    mainSessionId: parsed.mainSessionId,
    actors: unique([...withEvent.actors, ...parsed.actors]),
    subSessions: mergeSubSessions(withEvent.subSessions, parsed.subSessions),
    toolsUsed: mergeToolUsages(withEvent.toolsUsed, parsedTools),
    delegations: mergeDelegations(withEvent.delegations, parsedDelegations),
    lastMessageOutput: redactTextSecrets(parsed.lastMessageOutput),
    exportMeta: parsed.meta,
  }
}

function isJourneyDocument(value: unknown): value is SessionJourneyDocument {
  return typeof value === "object" && value !== null
    && (value as { _schema?: unknown })._schema === "harness/event-tracker/v1"
    && Array.isArray((value as { events?: unknown }).events)
}

function normalizeDocument(document: SessionJourneyDocument): SessionJourneyDocument {
  return {
    ...document,
    mainSessionId: document.mainSessionId ?? document.sessionId,
    lineage: normalizeStringArray(document.lineage),
    purposeClass: typeof document.purposeClass === "string" && document.purposeClass.trim().length > 0 ? document.purposeClass : "unspecified",
    keyFindings: normalizeStringArray(document.keyFindings),
    resumable: typeof document.resumable === "boolean" ? document.resumable : true,
    actors: Array.isArray(document.actors) ? document.actors : [],
    subSessions: Array.isArray(document.subSessions) ? document.subSessions : [],
    delegations: Array.isArray(document.delegations) ? document.delegations : [],
    toolsUsed: Array.isArray(document.toolsUsed) ? document.toolsUsed : [],
    lastMessageOutput: typeof document.lastMessageOutput === "string" ? document.lastMessageOutput : "",
    exportMeta: document.exportMeta ?? null,
  }
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function statusFromEvents(events: SessionJourneyEvent[]): SessionJourneyDocument["status"] {
  if (events.some((event) => event.type === "session_end")) return "completed"
  if (events.some((event) => event.type === "session_idle")) return "idle"
  return "active"
}

function buildToc(events: SessionJourneyEvent[]): SessionJourneyTocEntry[] {
  return events.map((event, index) => ({
    index: index + 1,
    timestamp: event.timestamp,
    actor: event.actor,
    type: event.type,
    summary: event.summary,
  }))
}

function retainBoundedEvents(events: SessionJourneyEvent[]): SessionJourneyEvent[] {
  return events.slice(-MAX_EVENTS_PER_DOCUMENT)
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort()
}

function mergeSubSessions(existing: ParsedSubSession[], incoming: ParsedSubSession[]): ParsedSubSession[] {
  const bySession = new Map<string, ParsedSubSession>()
  for (const item of [...existing, ...incoming]) {
    bySession.set(item.sessionId, item)
  }
  return Array.from(bySession.values()).sort((a, b) => a.sessionId.localeCompare(b.sessionId))
}

function mergeToolUsages(existing: SessionJourneyToolUsage[], incoming: SessionJourneyToolUsage[]): SessionJourneyToolUsage[] {
  const byKey = new Map<string, SessionJourneyToolUsage>()
  for (const item of [...existing, ...incoming]) {
    byKey.set(`${item.toolName}:${item.timestamp}:${item.status}:${item.summary}`, item)
  }
  return Array.from(byKey.values()).sort((a, b) => a.timestamp - b.timestamp || a.toolName.localeCompare(b.toolName))
}

function mergeDelegations(existing: SessionJourneyDelegation[], incoming: SessionJourneyDelegation[]): SessionJourneyDelegation[] {
  const byKey = new Map<string, SessionJourneyDelegation>()
  for (const item of [...existing, ...incoming]) {
    byKey.set(item.packetId ?? item.subSessionId ?? `${item.delegatedTo}:${item.description}`, item)
  }
  return Array.from(byKey.values()).sort((a, b) => (a.subSessionId ?? a.delegatedTo).localeCompare(b.subSessionId ?? b.delegatedTo))
}

function addToolUsage(document: SessionJourneyDocument, usage?: SessionJourneyToolUsage): SessionJourneyDocument {
  if (!usage) return document
  return { ...document, toolsUsed: mergeToolUsages(document.toolsUsed, [usage]) }
}

function addDelegation(document: SessionJourneyDocument, delegation?: SessionJourneyDelegation): SessionJourneyDocument {
  if (!delegation) return document
  return { ...document, delegations: mergeDelegations(document.delegations, [delegation]) }
}
