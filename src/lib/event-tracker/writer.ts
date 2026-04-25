import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { asString, getNestedValue } from "../helpers.js"
import { getEventParentID, getEventSessionID } from "../session-api.js"
import { parseProductDetoxSessionMarkdown } from "./parser.js"
import type {
  CreateEventTrackerArtifactsFromHookInput,
  CleanupEventTrackerArtifactsInput,
  CleanupEventTrackerArtifactsResult,
  EventTrackerArtifactPaths,
  EventTrackerFileSystem,
  JourneyEventHookInput,
  JourneyEventType,
  MergeSessionExportMarkdownArtifactsInput,
  ParsedSubSession,
  SessionJourneyDelegation,
  SessionJourneyDocument,
  SessionJourneyEvent,
  SessionJourneyTocEntry,
  SessionJourneyToolUsage,
  WriteSessionJourneyArtifactsInput,
  WriteSessionJourneyArtifactsResult,
} from "./types.js"

const nodeFs: EventTrackerFileSystem = { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync }
const MAX_EVENTS_PER_DOCUMENT = 100
const MAX_TOOL_SUMMARY_LENGTH = 240

const IGNORED_HOOK_TYPES = new Set([
  "message.updated",
  "message.part.delta",
  "message.part.updated",
  "session.diff",
  "session.status",
])

const TOOL_HOOK_TYPES = new Set([
  "tool.execute.after",
  "tool.executed",
  "tool.completed",
])

const SESSION_HOOK_TYPES = new Set([
  "session.created",
  "session.updated",
  "session.idle",
  "session.deleted",
])

function eventTypeFromHook(type: string): JourneyEventType {
  if (type === "session.created") return "session_start"
  if (type === "session.updated") return "session_updated"
  if (type === "session.idle") return "session_idle"
  if (type === "session.deleted") return "session_end"
  return "session_event"
}

function shouldIgnoreHookType(type: string): boolean {
  return IGNORED_HOOK_TYPES.has(type)
}

function isToolHookType(type: string): boolean {
  return TOOL_HOOK_TYPES.has(type)
}

export function shouldTrackEventTrackerEvent(event: unknown): boolean {
  const hookType = resolveHookType(event)
  if (shouldIgnoreHookType(hookType)) return false
  if (SESSION_HOOK_TYPES.has(hookType)) return true
  if (isToolHookType(hookType)) return Boolean(resolveSessionId(event))
  return false
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

function resolveRootSessionId(event: unknown): string {
  return (asString(getNestedValue(event, ["properties", "info", "rootID"]))
    || asString(getNestedValue(event, ["properties", "info", "rootId"]))
    || asString(getNestedValue(event, ["properties", "info", "rootSessionID"]))
    || asString(getNestedValue(event, ["properties", "info", "rootSessionId"]))
    || asString(getNestedValue(event, ["properties", "info", "mainSessionID"]))
    || asString(getNestedValue(event, ["properties", "info", "mainSessionId"]))
    || getEventParentID(event)
    || asString(getNestedValue(event, ["properties", "rootSessionID"]))
    || asString(getNestedValue(event, ["properties", "rootSessionId"]))
    || asString(getNestedValue(event, ["properties", "parentID"]))
    || asString(getNestedValue(event, ["properties", "parentId"]))
    || asString(getNestedValue(event, ["rootSessionID"]))
    || asString(getNestedValue(event, ["rootSessionId"]))
    || asString(getNestedValue(event, ["parentID"]))
    || asString(getNestedValue(event, ["parentId"]))
    || "")
}

function resolveHookType(event: unknown): string {
  return asString(getNestedValue(event, ["type"])) || "unknown"
}

function resolveToolName(event: unknown): string {
  return (asString(getNestedValue(event, ["properties", "tool"]))
    || asString(getNestedValue(event, ["properties", "toolName"]))
    || asString(getNestedValue(event, ["tool"]))
    || asString(getNestedValue(event, ["toolName"]))
    || "")
}

function resolveToolStatus(event: unknown): string {
  return (asString(getNestedValue(event, ["properties", "status"]))
    || asString(getNestedValue(event, ["properties", "state"]))
    || asString(getNestedValue(event, ["status"]))
    || "completed")
}

function summarizeToolReturn(event: unknown): string {
  const candidate = (asString(getNestedValue(event, ["properties", "summary"]))
    || asString(getNestedValue(event, ["properties", "resultSummary"]))
    || asString(getNestedValue(event, ["properties", "outputSummary"]))
    || asString(getNestedValue(event, ["summary"]))
    || asString(getNestedValue(event, ["properties", "output"]))
    || asString(getNestedValue(event, ["output"]))
    || "completed")
  const normalized = candidate.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
  return normalized.length <= MAX_TOOL_SUMMARY_LENGTH ? normalized : `${normalized.slice(0, MAX_TOOL_SUMMARY_LENGTH - 1)}…`
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
  const toolName = isToolHookType(hookType) ? resolveToolName(input.event) : ""
  const title = toolName ? `Tool ${toolName}` : titleFromType(type)
  const rootSessionId = resolveRootSessionId(input.event)
  const artifactStem = sanitizeSessionArtifactStem(rootSessionId || sessionId)
  const toolUsage = toolName ? {
    toolName,
    status: resolveToolStatus(input.event),
    summary: summarizeToolReturn(input.event),
    timestamp,
  } satisfies SessionJourneyToolUsage : undefined
  return {
    id: buildEventId(artifactStem, type, timestamp),
    sessionId,
    ...(rootSessionId ? { rootSessionId } : {}),
    artifactStem,
    type,
    actor: toolName ? "tool" : "system",
    title,
    summary: toolUsage ? `Tool ${toolUsage.toolName} ${toolUsage.status}: ${toolUsage.summary}` : `${title} (${hookType})`,
    timestamp,
    source: input.source ?? "opencode.event",
    stateRole: "audit trail",
    ...(toolUsage ? { toolUsage } : {}),
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

function createEmptyDocument(event: SessionJourneyEvent, targetSessionId = event.rootSessionId ?? event.sessionId): SessionJourneyDocument {
  const artifactStem = sanitizeSessionArtifactStem(targetSessionId)
  return {
    _schema: "harness/event-tracker/v1",
    sessionId: targetSessionId,
    semanticSessionId: artifactStem,
    artifactStem,
    mainSessionId: targetSessionId,
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

function isJourneyDocument(value: unknown): value is SessionJourneyDocument {
  return typeof value === "object" && value !== null
    && (value as { _schema?: unknown })._schema === "harness/event-tracker/v1"
    && Array.isArray((value as { events?: unknown }).events)
}

function readDocument(fs: EventTrackerFileSystem, jsonPath: string, event: SessionJourneyEvent, targetSessionId?: string): SessionJourneyDocument {
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

function normalizeDocument(document: SessionJourneyDocument): SessionJourneyDocument {
  return {
    ...document,
    mainSessionId: document.mainSessionId ?? document.sessionId,
    actors: Array.isArray(document.actors) ? document.actors : [],
    subSessions: Array.isArray(document.subSessions) ? document.subSessions : [],
    delegations: Array.isArray(document.delegations) ? document.delegations : [],
    toolsUsed: Array.isArray(document.toolsUsed) ? document.toolsUsed : [],
    lastMessageOutput: typeof document.lastMessageOutput === "string" ? document.lastMessageOutput : "",
    exportMeta: document.exportMeta ?? null,
  }
}

function readExistingDocumentForScan(fs: EventTrackerFileSystem, jsonPath: string): SessionJourneyDocument | null {
  const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as unknown
  return isJourneyDocument(parsed) ? normalizeDocument(parsed) : null
}

function documentContainsSession(document: SessionJourneyDocument, sessionId: string): boolean {
  return document.sessionId === sessionId
    || document.mainSessionId === sessionId
    || document.subSessions.some((subSession) => subSession.sessionId === sessionId)
    || document.events.some((event) => event.sessionId === sessionId)
}

function findKnownRootSessionId(fs: EventTrackerFileSystem, projectRoot: string, sessionId: string): string | null {
  const dir = getEventTrackerArtifactPaths(projectRoot, sessionId).dir
  if (!fs.existsSync(dir) || !fs.readdirSync) return null
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".json")).sort()
  for (const file of files) {
    const document = readExistingDocumentForScan(fs, join(dir, file))
    if (document && documentContainsSession(document, sessionId)) {
      return document.mainSessionId ?? document.sessionId
    }
  }
  return null
}

function resolveTargetSessionId(fs: EventTrackerFileSystem, projectRoot: string, event: SessionJourneyEvent): string | null {
  if (event.rootSessionId) return event.rootSessionId

  const knownRoot = findKnownRootSessionId(fs, projectRoot, event.sessionId)
  if (knownRoot) return knownRoot

  const ownPaths = getEventTrackerArtifactPaths(projectRoot, event.sessionId)
  if (fs.existsSync(ownPaths.jsonPath)) return event.sessionId

  return event.type === "session_start" ? event.sessionId : null
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
    `**Delegations:** ${document.delegations.length}`,
    `**Tools Used:** ${sanitizeMarkdownScalar(document.toolsUsed.map((tool) => tool.toolName).join(", "))}`,
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

function mergeExportMetadata(document: SessionJourneyDocument, event: SessionJourneyEvent, markdown: string): SessionJourneyDocument {
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
    lastMessageOutput: parsed.lastMessageOutput,
    exportMeta: parsed.meta,
  }
}

/** Write JSON and Markdown event-tracker artifacts under `.hivemind/event-tracker`. */
export function writeSessionJourneyArtifacts(input: WriteSessionJourneyArtifactsInput): WriteSessionJourneyArtifactsResult {
  const fs = input.fs ?? nodeFs
  const targetSessionId = resolveTargetSessionId(fs, input.projectRoot, input.event)
  const paths = getEventTrackerArtifactPaths(input.projectRoot, targetSessionId ?? input.event.sessionId)
  if (!targetSessionId) {
    return { paths, document: createEmptyDocument(input.event), written: false }
  }
  try {
    fs.mkdirSync(paths.dir, { recursive: true })
  } catch (error) {
    throw new Error(`[Harness] Failed to create event-tracker directory: ${error instanceof Error ? error.message : String(error)}`)
  }
  const current = readDocument(fs, paths.jsonPath, input.event, targetSessionId)
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
  const hookType = resolveHookType(input.hook.event)
  if (!shouldTrackEventTrackerEvent(input.hook.event)) {
    const skippedSessionId = resolveRootSessionId(input.hook.event) || resolveSessionId(input.hook.event) || "pending"
    const timestamp = input.hook.timestamp ?? Date.now()
    const artifactStem = sanitizeSessionArtifactStem(skippedSessionId)
    const skippedEvent: SessionJourneyEvent = {
      id: buildEventId(artifactStem, "session_event", timestamp),
      sessionId: skippedSessionId,
      artifactStem,
      type: "session_event",
      actor: "system",
      title: "Skipped event",
      summary: `Skipped noisy event (${hookType})`,
      timestamp,
      source: input.hook.source ?? "opencode.event",
      stateRole: "audit trail",
    }
    return { paths: getEventTrackerArtifactPaths(input.projectRoot, skippedSessionId), document: createEmptyDocument(skippedEvent), written: false }
  }
  const event = createJourneyEventFromHook(input.hook)
  return writeSessionJourneyArtifacts({ projectRoot: input.projectRoot, event, fs: input.fs })
}

export function cleanupEventTrackerArtifacts(input: CleanupEventTrackerArtifactsInput): CleanupEventTrackerArtifactsResult {
  const dir = getEventTrackerArtifactPaths(input.projectRoot, input.keepArtifactStems[0] ?? "pending").dir
  const keep = new Set(input.keepArtifactStems.flatMap((stem) => [`${stem}.json`, `${stem}.md`]))
  if (!existsSync(dir)) {
    return { dir, kept: [], removed: [] }
  }

  const kept: string[] = []
  const removed: string[] = []
  for (const file of readdirSync(dir).filter((name) => /^ses_[A-Za-z0-9]{4}\.(json|md)$/.test(name)).sort()) {
    if (keep.has(file)) {
      kept.push(file)
      continue
    }
    unlinkSync(join(dir, file))
    removed.push(file)
  }
  return { dir, kept, removed }
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
