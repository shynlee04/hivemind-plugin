import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { asString, getNestedValue } from "../helpers.js"
import { getEventSessionID } from "../session-api.js"
import { parseProductDetoxSessionMarkdown } from "./parser.js"
import type {
  CreateEventTrackerArtifactsFromHookInput,
  EventTrackerArtifactPaths,
  EventTrackerFileSystem,
  JourneyEventHookInput,
  JourneyEventType,
  MergeSessionExportMarkdownArtifactsInput,
  ParsedSubSession,
  SessionJourneyDocument,
  SessionJourneyEvent,
  SessionJourneyTocEntry,
  WriteSessionJourneyArtifactsInput,
  WriteSessionJourneyArtifactsResult,
} from "./types.js"

const nodeFs: EventTrackerFileSystem = { existsSync, mkdirSync, readFileSync, writeFileSync }
const MAX_EVENTS_PER_DOCUMENT = 100

function eventTypeFromHook(type: string): JourneyEventType {
  if (type === "session.created") return "session_start"
  if (type === "session.updated") return "session_updated"
  if (type === "session.idle") return "session_idle"
  if (type === "session.deleted") return "session_end"
  return "session_event"
}

function titleFromType(type: JourneyEventType): string {
  switch (type) {
    case "session_start": return "Session started"
    case "session_updated": return "Session updated"
    case "session_idle": return "Session idle"
    case "session_end": return "Session ended"
    case "session_event": return "Session event"
  }
}

function resolveSessionId(event: unknown): string {
  return (getEventSessionID(event)
    || asString(getNestedValue(event, ["sessionID"]))
    || asString(getNestedValue(event, ["sessionId"]))
    || asString(getNestedValue(event, ["properties", "sessionID"]))
    || asString(getNestedValue(event, ["properties", "sessionId"]))
    || "")
}

function resolveHookType(event: unknown): string {
  return asString(getNestedValue(event, ["type"])) || "unknown"
}

export function sanitizeSessionArtifactStem(sessionId: string): string {
  const explicit = sessionId.match(/ses[_-]?([A-Za-z0-9]{4})/i)?.[1]
  const suffixSource = explicit ?? sessionId.replace(/[^A-Za-z0-9]/g, "").slice(-4)
  const suffix = suffixSource.padEnd(4, "0").slice(0, 4).toLowerCase()
  return `ses_${suffix}`
}

function buildEventId(artifactStem: string, type: JourneyEventType, timestamp: number): string {
  return [artifactStem, type, String(timestamp)].join("::")
}

/** Convert an OpenCode hook event into bounded event-tracker metadata without raw payload storage. */
export function createJourneyEventFromHook(input: JourneyEventHookInput): SessionJourneyEvent {
  const sessionId = resolveSessionId(input.event)
  if (!sessionId) {
    throw new Error("[Harness] Cannot write event-tracker artifact without session ID")
  }
  const hookType = resolveHookType(input.event)
  const type = eventTypeFromHook(hookType)
  const timestamp = input.timestamp ?? Date.now()
  const title = titleFromType(type)
  const artifactStem = sanitizeSessionArtifactStem(sessionId)
  return {
    id: buildEventId(artifactStem, type, timestamp),
    sessionId,
    artifactStem,
    type,
    actor: "system",
    title,
    summary: `${title} (${hookType})`,
    timestamp,
    source: input.source ?? "opencode.event",
    stateRole: "audit trail",
  }
}

export function getEventTrackerArtifactPaths(projectRoot: string, sessionId: string): EventTrackerArtifactPaths {
  const artifactStem = sanitizeSessionArtifactStem(sessionId)
  const dir = join(projectRoot, ".hivemind", "event-tracker")
  return {
    dir,
    artifactStem,
    jsonPath: join(dir, `${artifactStem}.json`),
    markdownPath: join(dir, `${artifactStem}.md`),
  }
}

function createEmptyDocument(event: SessionJourneyEvent): SessionJourneyDocument {
  return {
    _schema: "harness/event-tracker/v1",
    sessionId: event.sessionId,
    semanticSessionId: event.artifactStem,
    artifactStem: event.artifactStem,
    mainSessionId: event.sessionId,
    startedAt: null,
    updatedAt: event.timestamp,
    status: "active",
    counters: { eventCount: 0, sessionStartCount: 0, sessionEndCount: 0 },
    actors: [],
    subSessions: [],
    lastMessageOutput: "",
    exportMeta: null,
    toc: [],
    events: [],
  }
}

function isJourneyDocument(value: unknown): value is SessionJourneyDocument {
  return typeof value === "object" && value !== null
    && (value as { _schema?: unknown })._schema === "harness/event-tracker/v1"
    && Array.isArray((value as { events?: unknown }).events)
}

function readDocument(fs: EventTrackerFileSystem, jsonPath: string, event: SessionJourneyEvent): SessionJourneyDocument {
  if (!fs.existsSync(jsonPath)) {
    return createEmptyDocument(event)
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

function normalizeDocument(document: SessionJourneyDocument): SessionJourneyDocument {
  return {
    ...document,
    mainSessionId: document.mainSessionId ?? document.sessionId,
    actors: Array.isArray(document.actors) ? document.actors : [],
    subSessions: Array.isArray(document.subSessions) ? document.subSessions : [],
    lastMessageOutput: typeof document.lastMessageOutput === "string" ? document.lastMessageOutput : "",
    exportMeta: document.exportMeta ?? null,
  }
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

function addEvent(document: SessionJourneyDocument, event: SessionJourneyEvent): { document: SessionJourneyDocument; written: boolean } {
  if (document.events.some((existing) => existing.id === event.id)) {
    return { document, written: false }
  }
  const events = retainBoundedEvents([...document.events, event].sort((a, b) => a.timestamp - b.timestamp))
  const maxTimestamp = Math.max(document.updatedAt, event.timestamp, ...events.map((item) => item.timestamp))
  const next: SessionJourneyDocument = {
    ...document,
    sessionId: event.sessionId,
    semanticSessionId: event.artifactStem,
    artifactStem: event.artifactStem,
    mainSessionId: document.mainSessionId ?? event.sessionId,
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

function escapeCell(value: string): string {
  return sanitizeMarkdownScalar(value).replace(/\|/g, "\\|")
}

function sanitizeMarkdownScalar(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 2_000)
}

/** Render one bounded journey event block. */
export function renderJourneyEventMarkdown(event: SessionJourneyEvent): string {
  return [
    `## ${sanitizeMarkdownScalar(event.title)}`,
    "",
    `- Timestamp: ${event.timestamp}`,
    `- Actor: ${sanitizeMarkdownScalar(event.actor)}`,
    `- Type: ${sanitizeMarkdownScalar(event.type)}`,
    `- Source: ${sanitizeMarkdownScalar(event.source)}`,
    `- State role: ${sanitizeMarkdownScalar(event.stateRole)}`,
    `- Summary: ${sanitizeMarkdownScalar(event.summary)}`,
  ].join("\n")
}

function renderDocumentMarkdown(document: SessionJourneyDocument): string {
  const rows = document.toc.map((entry) => (
    `| ${entry.index} | ${entry.timestamp} | ${escapeCell(entry.actor)} | ${entry.type} | ${escapeCell(entry.summary)} |`
  ))
  return [
    `# ${sanitizeMarkdownScalar(document.artifactStem)}`,
    "",
    `**Session ID:** ${sanitizeMarkdownScalar(document.sessionId)}`,
    `**Artifact Stem:** ${sanitizeMarkdownScalar(document.artifactStem)}`,
    `**Main Session ID:** ${sanitizeMarkdownScalar(document.mainSessionId ?? "")}`,
    `**Updated:** ${document.updatedAt}`,
    `**Status:** ${document.status}`,
    `**eventCount:** ${document.counters.eventCount}`,
    `**sessionStartCount:** ${document.counters.sessionStartCount}`,
    `**sessionEndCount:** ${document.counters.sessionEndCount}`,
    `**Actors:** ${sanitizeMarkdownScalar(document.actors.join(", "))}`,
    `**Sub Sessions:** ${document.subSessions.length}`,
    `**Last Output:** ${sanitizeMarkdownScalar(document.lastMessageOutput)}`,
    "",
    "---",
    "",
    "## Table of Contents",
    "",
    "| # | Timestamp | Actor | Type | Summary |",
    "|---|-----------|-------|------|---------|",
    ...rows,
    "",
    "---",
    ...document.events.flatMap((event) => [renderJourneyEventMarkdown(event), ""]),
  ].join("\n")
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

function mergeExportMetadata(document: SessionJourneyDocument, event: SessionJourneyEvent, markdown: string): SessionJourneyDocument {
  const parsed = parseProductDetoxSessionMarkdown(markdown)
  const { document: withEvent } = addEvent(document, event)
  return {
    ...withEvent,
    sessionId: parsed.header.sessionId,
    semanticSessionId: parsed.meta.artifactStem,
    artifactStem: parsed.meta.artifactStem,
    mainSessionId: parsed.mainSessionId,
    actors: unique([...withEvent.actors, ...parsed.actors]),
    subSessions: mergeSubSessions(withEvent.subSessions, parsed.subSessions),
    lastMessageOutput: parsed.lastMessageOutput,
    exportMeta: parsed.meta,
  }
}

/** Write JSON and Markdown event-tracker artifacts under `.hivemind/event-tracker`. */
export function writeSessionJourneyArtifacts(input: WriteSessionJourneyArtifactsInput): WriteSessionJourneyArtifactsResult {
  const fs = input.fs ?? nodeFs
  const paths = getEventTrackerArtifactPaths(input.projectRoot, input.event.sessionId)
  try {
    fs.mkdirSync(paths.dir, { recursive: true })
  } catch (error) {
    throw new Error(`[Harness] Failed to create event-tracker directory: ${error instanceof Error ? error.message : String(error)}`)
  }
  const current = readDocument(fs, paths.jsonPath, input.event)
  const { document, written } = addEvent(current, input.event)
  try {
    fs.writeFileSync(paths.jsonPath, `${JSON.stringify(document, null, 2)}\n`, "utf-8")
  } catch (error) {
    throw new Error(`[Harness] Failed to write event-tracker JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    fs.writeFileSync(paths.markdownPath, `${renderDocumentMarkdown(document)}\n`, "utf-8")
  } catch (error) {
    throw new Error(`[Harness] Failed to write event-tracker Markdown: ${error instanceof Error ? error.message : String(error)}`)
  }
  return { paths, document, written }
}

export function createEventTrackerArtifactsFromHook(input: CreateEventTrackerArtifactsFromHookInput): WriteSessionJourneyArtifactsResult {
  const event = createJourneyEventFromHook(input.hook)
  return writeSessionJourneyArtifacts({ projectRoot: input.projectRoot, event, fs: input.fs })
}

export function mergeSessionExportMarkdownArtifacts(input: MergeSessionExportMarkdownArtifactsInput): WriteSessionJourneyArtifactsResult {
  const parsed = parseProductDetoxSessionMarkdown(input.markdown)
  const timestamp = Date.parse(parsed.header.updated) || Date.now()
  const event: SessionJourneyEvent = {
    id: buildEventId(parsed.meta.artifactStem, "session_updated", timestamp),
    sessionId: parsed.header.sessionId,
    artifactStem: parsed.meta.artifactStem,
    type: "session_updated",
    actor: "system",
    title: "Session export parsed",
    summary: `Session export parsed (${parsed.counters.delegationCount} delegations, ${parsed.actors.length} actors)`,
    timestamp,
    source: input.source ?? "manual-session-export",
    stateRole: "audit trail",
  }
  const fs = input.fs ?? nodeFs
  const paths = getEventTrackerArtifactPaths(input.projectRoot, event.sessionId)
  try {
    fs.mkdirSync(paths.dir, { recursive: true })
  } catch (error) {
    throw new Error(`[Harness] Failed to create event-tracker directory: ${error instanceof Error ? error.message : String(error)}`)
  }
  const current = readDocument(fs, paths.jsonPath, event)
  const document = mergeExportMetadata(current, event, input.markdown)
  try {
    fs.writeFileSync(paths.jsonPath, `${JSON.stringify(document, null, 2)}\n`, "utf-8")
  } catch (error) {
    throw new Error(`[Harness] Failed to write event-tracker JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    fs.writeFileSync(paths.markdownPath, `${renderDocumentMarkdown(document)}\n`, "utf-8")
  } catch (error) {
    throw new Error(`[Harness] Failed to write event-tracker Markdown: ${error instanceof Error ? error.message : String(error)}`)
  }
  return { paths, document, written: true }
}
