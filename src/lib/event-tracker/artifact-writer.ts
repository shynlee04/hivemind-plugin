import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { assertPathWithinRoot } from "../security/path-scope.js"
import { parseProductDetoxSessionMarkdown } from "./parser.js"
import { createJourneyEventFromHook, sanitizeSessionArtifactStem, shouldTrackEventTrackerEvent } from "./hook-event.js"
import { addEvent, createEmptyDocument, documentContainsSession, mergeExportMetadata, readDocument, readExistingDocumentForScan } from "./document-store.js"
import { renderDocumentMarkdown } from "./markdown-renderer.js"
import type {
  CleanupEventTrackerArtifactsInput,
  CleanupEventTrackerArtifactsResult,
  CreateEventTrackerArtifactsFromHookInput,
  EventTrackerArtifactPaths,
  EventTrackerFileSystem,
  JourneyEventType,
  MergeSessionExportMarkdownArtifactsInput,
  SessionJourneyEvent,
  WriteSessionJourneyArtifactsInput,
  WriteSessionJourneyArtifactsResult,
} from "./types.js"

const nodeFs: EventTrackerFileSystem = { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync }

/**
 * Resolves canonical event-tracker artifact paths under `.hivemind/event-tracker`.
 *
 * @param projectRoot - Project root that owns the `.hivemind` internal state directory.
 * @param sessionId - Session or root-session identifier used to derive the artifact stem.
 * @returns Directory, JSON path, Markdown path, and artifact stem for the session journey.
 *
 * @example
 * ```ts
 * const paths = getEventTrackerArtifactPaths(projectRoot, "ses_demo")
 * paths.jsonPath.endsWith(".json") // true
 * ```
 */
export function getEventTrackerArtifactPaths(projectRoot: string, sessionId: string): EventTrackerArtifactPaths {
  const artifactStem = sanitizeSessionArtifactStem(sessionId)
  const dir = assertPathWithinRoot(projectRoot, join(".hivemind", "event-tracker"), "event tracker")
  return {
    dir,
    artifactStem,
    jsonPath: join(dir, `${artifactStem}.json`),
    markdownPath: join(dir, `${artifactStem}.md`),
  }
}

/**
 * Writes event-tracker JSON and Markdown artifacts for a journey event.
 *
 * @param input - Project root, event payload, and optional filesystem adapter.
 * @returns Paths, evolved document, and whether the event changed the document.
 * @throws {Error} When directory creation or artifact writing fails.
 *
 * @example
 * ```ts
 * const result = writeSessionJourneyArtifacts({ projectRoot, event })
 * result.written // true when the event was new
 * ```
 */
export function writeSessionJourneyArtifacts(input: WriteSessionJourneyArtifactsInput): WriteSessionJourneyArtifactsResult {
  const fs = input.fs ?? nodeFs
  const targetSessionId = resolveTargetSessionId(fs, input.projectRoot, input.event)
  const paths = getEventTrackerArtifactPaths(input.projectRoot, targetSessionId ?? input.event.sessionId)
  if (!targetSessionId) {
    return { paths, document: createEmptyDocument(input.event), written: false }
  }
  createEventTrackerDirectory(fs, paths.dir)
  const current = readDocument(fs, paths.jsonPath, input.event, targetSessionId)
  const { document, written } = addEvent(current, input.event)
  writeDocumentArtifacts(fs, paths, document)
  return { paths, document, written }
}

/**
 * Converts a hook payload into event-tracker artifacts when the hook is in scope.
 *
 * @param input - Project root, hook input, and optional filesystem adapter.
 * @returns Written artifacts or deterministic skipped paths/document for noisy events.
 *
 * @example
 * ```ts
 * const result = createEventTrackerArtifactsFromHook({ projectRoot, hook })
 * ```
 */
export function createEventTrackerArtifactsFromHook(
  input: CreateEventTrackerArtifactsFromHookInput,
): WriteSessionJourneyArtifactsResult {
  const hookType = resolveHookType(input.hook.event)
  if (!shouldTrackEventTrackerEvent(input.hook.event)) {
    const skippedSessionId = resolveNestedString(input.hook.event, ["properties", "rootSessionID"])
      || resolveNestedString(input.hook.event, ["properties", "rootSessionId"])
      || resolveNestedString(input.hook.event, ["sessionID"])
      || resolveNestedString(input.hook.event, ["sessionId"])
      || "pending"
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

/**
 * Removes stale event-tracker artifacts while preserving requested stems.
 *
 * @param input - Project root and artifact stems that must remain on disk.
 * @returns Directory scanned plus kept and removed filenames.
 *
 * @example
 * ```ts
 * cleanupEventTrackerArtifacts({ projectRoot, keepArtifactStems: ["ses_demo"] })
 * ```
 */
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

/**
 * Parses a Markdown session export and writes merged event-tracker artifacts.
 *
 * @param input - Project root, export Markdown, optional source label, and optional filesystem adapter.
 * @returns Paths and a document containing parsed export metadata.
 *
 * @example
 * ```ts
 * const result = mergeSessionExportMarkdownArtifacts({ projectRoot, markdown })
 * result.document.exportMeta !== null // true
 * ```
 */
export function mergeSessionExportMarkdownArtifacts(
  input: MergeSessionExportMarkdownArtifactsInput,
): WriteSessionJourneyArtifactsResult {
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
  createEventTrackerDirectory(fs, paths.dir)
  const current = readDocument(fs, paths.jsonPath, event)
  const document = mergeExportMetadata(current, event, input.markdown)
  writeDocumentArtifacts(fs, paths, document)
  return { paths, document, written: true }
}

function createEventTrackerDirectory(fs: EventTrackerFileSystem, dir: string): void {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (error) {
    throw new Error(`[Harness] Failed to create event-tracker directory: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function writeDocumentArtifacts(
  fs: EventTrackerFileSystem,
  paths: EventTrackerArtifactPaths,
  document: WriteSessionJourneyArtifactsResult["document"],
): void {
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
}

function resolveTargetSessionId(fs: EventTrackerFileSystem, projectRoot: string, event: SessionJourneyEvent): string | null {
  if (event.rootSessionId) return event.rootSessionId
  const knownRoot = findKnownRootSessionId(fs, projectRoot, event.sessionId)
  if (knownRoot) return knownRoot
  const ownPaths = getEventTrackerArtifactPaths(projectRoot, event.sessionId)
  if (fs.existsSync(ownPaths.jsonPath)) return event.sessionId
  return event.type === "session_start" ? event.sessionId : null
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

function buildEventId(artifactStem: string, type: JourneyEventType, timestamp: number): string {
  return [artifactStem, type, String(timestamp)].join("::")
}

function resolveHookType(event: unknown): string {
  return resolveNestedString(event, ["type"]) || "unknown"
}

function resolveNestedString(value: unknown, path: string[]): string {
  let current = value
  for (const key of path) {
    if (typeof current !== "object" || current === null) return ""
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === "string" ? current : ""
}
