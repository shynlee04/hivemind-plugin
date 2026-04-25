import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { asString, getNestedValue } from "./helpers.js"

export type JourneyEventType =
  | "session_start"
  | "session_updated"
  | "session_idle"
  | "session_end"
  | "session_event"

export type SessionJourneyEvent = {
  id: string
  sessionId: string
  type: JourneyEventType
  actor: "system" | "agent" | "human" | "tool"
  title: string
  summary: string
  timestamp: number
  source: string
  stateRole: "audit trail"
}

export type SessionJourneyDocument = {
  _schema: "harness/session-journey/v1"
  sessionId: string
  startedAt: number | null
  updatedAt: number
  status: "active" | "idle" | "completed"
  counters: {
    eventCount: number
    sessionStartCount: number
    sessionEndCount: number
  }
  events: SessionJourneyEvent[]
}

export type JourneyEventHookInput = {
  event: unknown
  timestamp?: number
  source?: string
}

export type WriteSessionJourneyArtifactsInput = {
  projectRoot: string
  event: SessionJourneyEvent
}

export type WriteSessionJourneyArtifactsResult = {
  jsonPath: string
  markdownPath: string
  written: boolean
}

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
  return (asString(getNestedValue(event, ["sessionID"]))
    || asString(getNestedValue(event, ["sessionId"]))
    || asString(getNestedValue(event, ["properties", "sessionID"]))
    || asString(getNestedValue(event, ["properties", "sessionId"]))
    || "")
}

function resolveHookType(event: unknown): string {
  return asString(getNestedValue(event, ["type"])) || "unknown"
}

function buildEventId(sessionId: string, type: JourneyEventType, timestamp: number): string {
  return [sessionId, type, String(timestamp)].join("::")
}

/** Convert an OpenCode hook event into bounded journey metadata without raw payload storage. */
export function createJourneyEventFromHook(input: JourneyEventHookInput): SessionJourneyEvent {
  const sessionId = resolveSessionId(input.event)
  if (!sessionId) {
    throw new Error("[Harness] Cannot journal session event without session ID")
  }
  const hookType = resolveHookType(input.event)
  const type = eventTypeFromHook(hookType)
  const timestamp = input.timestamp ?? Date.now()
  const title = titleFromType(type)
  return {
    id: buildEventId(sessionId, type, timestamp),
    sessionId,
    type,
    actor: "system",
    title,
    summary: `${title} (${hookType})`,
    timestamp,
    source: input.source ?? "opencode.event",
    stateRole: "audit trail",
  }
}

function createEmptyDocument(sessionId: string, timestamp: number): SessionJourneyDocument {
  return {
    _schema: "harness/session-journey/v1",
    sessionId,
    startedAt: null,
    updatedAt: timestamp,
    status: "active",
    counters: { eventCount: 0, sessionStartCount: 0, sessionEndCount: 0 },
    events: [],
  }
}

function isJourneyDocument(value: unknown): value is SessionJourneyDocument {
  return typeof value === "object" && value !== null
    && (value as { _schema?: unknown })._schema === "harness/session-journey/v1"
    && Array.isArray((value as { events?: unknown }).events)
}

function readDocument(jsonPath: string, sessionId: string, timestamp: number): SessionJourneyDocument {
  if (!existsSync(jsonPath)) {
    return createEmptyDocument(sessionId, timestamp)
  }
  try {
    const parsed = JSON.parse(readFileSync(jsonPath, "utf-8")) as unknown
    return isJourneyDocument(parsed) ? parsed : createEmptyDocument(sessionId, timestamp)
  } catch {
    return createEmptyDocument(sessionId, timestamp)
  }
}

function updateCounters(document: SessionJourneyDocument): SessionJourneyDocument["counters"] {
  return {
    eventCount: document.events.length,
    sessionStartCount: document.events.filter((event) => event.type === "session_start").length,
    sessionEndCount: document.events.filter((event) => event.type === "session_end").length,
  }
}

function statusFromEvents(events: SessionJourneyEvent[]): SessionJourneyDocument["status"] {
  if (events.some((event) => event.type === "session_end")) return "completed"
  if (events.some((event) => event.type === "session_idle")) return "idle"
  return "active"
}

function addEvent(document: SessionJourneyDocument, event: SessionJourneyEvent): { document: SessionJourneyDocument; written: boolean } {
  if (document.events.some((existing) => existing.id === event.id)) {
    return { document, written: false }
  }
  const events = [...document.events, event].sort((a, b) => a.timestamp - b.timestamp)
  const next = {
    ...document,
    startedAt: document.startedAt ?? (event.type === "session_start" ? event.timestamp : null),
    updatedAt: event.timestamp,
    status: statusFromEvents(events),
    events,
  }
  return { document: { ...next, counters: updateCounters(next) }, written: true }
}

function journeyDir(projectRoot: string): string {
  return join(projectRoot, ".hivemind", "sessions", "journey-events")
}

function safeFileStem(sessionId: string): string {
  return sessionId.replace(/[^A-Za-z0-9_.-]/g, "_")
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>")
}

/** Render one bounded journey event block. */
export function renderJourneyEventMarkdown(event: SessionJourneyEvent): string {
  return [
    `## ${event.title}`,
    "",
    `- Timestamp: ${event.timestamp}`,
    `- Actor: ${event.actor}`,
    `- Type: ${event.type}`,
    `- Source: ${event.source}`,
    `- State role: ${event.stateRole}`,
    `- Summary: ${event.summary}`,
  ].join("\n")
}

function renderDocumentMarkdown(document: SessionJourneyDocument): string {
  const rows = document.events.map((event, index) => (
    `| ${index + 1} | ${event.timestamp} | ${escapeCell(event.actor)} | ${escapeCell(event.type)} | ${escapeCell(event.summary)} |`
  ))
  return [
    `# ${document.sessionId}`,
    "",
    `**Session ID:** ${document.sessionId}`,
    `**Updated:** ${document.updatedAt}`,
    `**Status:** ${document.status}`,
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

/** Write JSON and Markdown journey artifacts under `.hivemind/sessions/journey-events`. */
export function writeSessionJourneyArtifacts(input: WriteSessionJourneyArtifactsInput): WriteSessionJourneyArtifactsResult {
  const dir = journeyDir(input.projectRoot)
  const fileStem = safeFileStem(input.event.sessionId)
  const jsonPath = join(dir, `${fileStem}.json`)
  const markdownPath = join(dir, `${fileStem}.md`)
  mkdirSync(dirname(jsonPath), { recursive: true })
  const current = readDocument(jsonPath, input.event.sessionId, input.event.timestamp)
  const { document, written } = addEvent(current, input.event)
  writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`, "utf-8")
  writeFileSync(markdownPath, `${renderDocumentMarkdown(document)}\n`, "utf-8")
  return { jsonPath, markdownPath, written }
}
