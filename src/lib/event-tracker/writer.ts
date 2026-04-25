import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { asString, getNestedValue } from "../helpers.js"
import type {
  CreateEventTrackerArtifactsFromHookInput,
  EventTrackerArtifactPaths,
  EventTrackerFileSystem,
  JourneyEventHookInput,
  JourneyEventType,
  SessionJourneyDocument,
  SessionJourneyEvent,
  SessionJourneyTocEntry,
  WriteSessionJourneyArtifactsInput,
  WriteSessionJourneyArtifactsResult,
} from "./types.js"

const nodeFs: EventTrackerFileSystem = { existsSync, mkdirSync, readFileSync, writeFileSync }

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
    startedAt: null,
    updatedAt: event.timestamp,
    status: "active",
    counters: { eventCount: 0, sessionStartCount: 0, sessionEndCount: 0 },
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
    return isJourneyDocument(parsed) ? parsed : createEmptyDocument(event)
  } catch {
    return createEmptyDocument(event)
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

function addEvent(document: SessionJourneyDocument, event: SessionJourneyEvent): { document: SessionJourneyDocument; written: boolean } {
  if (document.events.some((existing) => existing.id === event.id)) {
    return { document, written: false }
  }
  const events = [...document.events, event].sort((a, b) => a.timestamp - b.timestamp)
  const next: SessionJourneyDocument = {
    ...document,
    sessionId: event.sessionId,
    semanticSessionId: event.artifactStem,
    artifactStem: event.artifactStem,
    startedAt: document.startedAt ?? (event.type === "session_start" ? event.timestamp : null),
    updatedAt: event.timestamp,
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
  const rows = document.toc.map((entry) => (
    `| ${entry.index} | ${entry.timestamp} | ${escapeCell(entry.actor)} | ${entry.type} | ${escapeCell(entry.summary)} |`
  ))
  return [
    `# ${document.artifactStem}`,
    "",
    `**Session ID:** ${document.sessionId}`,
    `**Artifact Stem:** ${document.artifactStem}`,
    `**Updated:** ${document.updatedAt}`,
    `**Status:** ${document.status}`,
    `**eventCount:** ${document.counters.eventCount}`,
    `**sessionStartCount:** ${document.counters.sessionStartCount}`,
    `**sessionEndCount:** ${document.counters.sessionEndCount}`,
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
