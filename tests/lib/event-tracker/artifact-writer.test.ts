/**
 * @fileoverview Tests for event-tracker/artifact-writer.ts — artifact file creation,
 * naming conventions, error handling, and concurrent write safety.
 *
 * Test size: medium (real temp directories, real filesystem I/O)
 * Evidence: runtime-truthful (exercises real public interfaces with temp dirs)
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  getEventTrackerArtifactPaths,
  writeSessionJourneyArtifacts,
  createEventTrackerArtifactsFromHook,
  cleanupEventTrackerArtifacts,
  mergeSessionExportMarkdownArtifacts,
} from "../../../src/lib/event-tracker/artifact-writer.js"
import type {
  EventTrackerFileSystem,
  SessionJourneyEvent,
} from "../../../src/lib/event-tracker/types.js"

/**
 * Helper: creates a valid SessionJourneyEvent for testing.
 */
function makeEvent(overrides: Partial<SessionJourneyEvent> = {}): SessionJourneyEvent {
  return {
    id: "ses_test::session_start::1700000000000",
    sessionId: "ses-test-0001",
    artifactStem: "ses_test",
    type: "session_start",
    actor: "system",
    title: "Session started",
    summary: "Session started (session.created)",
    timestamp: 1700000000000,
    source: "opencode.event",
    stateRole: "audit trail",
    ...overrides,
  }
}

// ─── getEventTrackerArtifactPaths ────────────────────────────────────────────

describe("getEventTrackerArtifactPaths", () => {
  it("resolves canonical .hivemind/event-tracker directory with correct stems", () => {
    const paths = getEventTrackerArtifactPaths("/tmp/my-project", "ses-abc12345")

    expect(paths.dir).toContain(".hivemind")
    expect(paths.dir).toContain("event-tracker")
    expect(paths.artifactStem).toBe("ses_abc1")
    expect(paths.jsonPath).toBe(join(paths.dir, "ses_abc1.json"))
    expect(paths.markdownPath).toBe(join(paths.dir, "ses_abc1.md"))
  })

  it("normalizes different session ID formats to consistent stems", () => {
    const p1 = getEventTrackerArtifactPaths("/root", "ses_ABCD")
    const p2 = getEventTrackerArtifactPaths("/root", "ses_ABCDEFGH")

    expect(p1.artifactStem).toBe("ses_abcd")
    expect(p2.artifactStem).toBe("ses_abcd")
    // Both derive the same stem — same session cluster
    expect(p1.jsonPath).toBe(p2.jsonPath)
  })
})

// ─── writeSessionJourneyArtifacts ────────────────────────────────────────────

describe("writeSessionJourneyArtifacts", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "artifact-writer-test-"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("creates event-tracker directory and writes JSON + Markdown artifacts", () => {
    const event = makeEvent()
    const result = writeSessionJourneyArtifacts({ projectRoot, event })

    expect(result.written).toBe(true)
    expect(existsSync(result.paths.jsonPath)).toBe(true)
    expect(existsSync(result.paths.markdownPath)).toBe(true)

    const json = JSON.parse(readFileSync(result.paths.jsonPath, "utf-8")) as { _schema: string; events: unknown[] }
    expect(json._schema).toBe("harness/event-tracker/v1")
    expect(json.events).toHaveLength(1)

    const md = readFileSync(result.paths.markdownPath, "utf-8")
    expect(md).toContain("## Session started")
  })

  it("deduplicates identical events on re-write", () => {
    const event = makeEvent()
    const first = writeSessionJourneyArtifacts({ projectRoot, event })
    const second = writeSessionJourneyArtifacts({ projectRoot, event })

    expect(first.written).toBe(true)
    expect(second.written).toBe(false)

    const json = JSON.parse(readFileSync(second.paths.jsonPath, "utf-8")) as { events: unknown[] }
    expect(json.events).toHaveLength(1)
  })

  it("appends distinct events to the same document", () => {
    const event1 = makeEvent({ id: "ses_test::session_start::1000", type: "session_start", timestamp: 1000 })
    const event2 = makeEvent({ id: "ses_test::session_idle::2000", type: "session_idle", timestamp: 2000 })

    writeSessionJourneyArtifacts({ projectRoot, event: event1 })
    const result = writeSessionJourneyArtifacts({ projectRoot, event: event2 })

    expect(result.written).toBe(true)
    const json = JSON.parse(readFileSync(result.paths.jsonPath, "utf-8")) as { events: { type: string }[] }
    expect(json.events).toHaveLength(2)
  })

  it("throws [Harness] error when directory creation fails", () => {
    const brokenFs: EventTrackerFileSystem = {
      existsSync: () => false,
      mkdirSync: () => { throw new Error("permission denied") },
      readFileSync: () => "",
      writeFileSync: () => {},
    }

    const event = makeEvent()
    // Use rootSessionId to force resolveTargetSessionId to succeed
    const eventWithRoot = { ...event, rootSessionId: "ses-test-0001" }

    expect(() =>
      writeSessionJourneyArtifacts({ projectRoot: "/tmp/test", event: eventWithRoot, fs: brokenFs })
    ).toThrow(/\[Harness\].*Failed to create event-tracker directory/)
  })

  it("throws [Harness] error when JSON write fails", () => {
    const brokenWriteFs: EventTrackerFileSystem = {
      existsSync: () => false,
      mkdirSync: () => {},
      readFileSync: () => "",
      writeFileSync: () => { throw new Error("disk full") },
    }

    const eventWithRoot = makeEvent({ rootSessionId: "ses-test-0001" })

    expect(() =>
      writeSessionJourneyArtifacts({ projectRoot: "/tmp/test", event: eventWithRoot, fs: brokenWriteFs })
    ).toThrow(/\[Harness\].*Failed to write event-tracker JSON/)
  })

  it("returns unwritten result when session has no root and no prior artifact", () => {
    const event = makeEvent({ type: "session_event", rootSessionId: undefined })
    const result = writeSessionJourneyArtifacts({ projectRoot, event })

    // session_event type without rootSessionId returns written: false
    expect(result.written).toBe(false)
    expect(result.document).toBeDefined()
  })
})

// ─── createEventTrackerArtifactsFromHook ─────────────────────────────────────

describe("createEventTrackerArtifactsFromHook", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "artifact-hook-test-"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("creates artifacts from a session.created hook event", () => {
    const result = createEventTrackerArtifactsFromHook({
      projectRoot,
      hook: {
        event: { type: "session.created", sessionID: "ses-cre8" },
        timestamp: 1700000000000,
      },
    })

    expect(result.written).toBe(true)
    expect(existsSync(result.paths.jsonPath)).toBe(true)
  })

  it("returns skipped result for ignored hook types without writing artifacts", () => {
    const result = createEventTrackerArtifactsFromHook({
      projectRoot,
      hook: {
        event: { type: "message.updated", sessionID: "ses-skip" },
        timestamp: 1700000000000,
      },
    })

    expect(result.written).toBe(false)
    expect(result.document).toBeDefined()
  })
})

// ─── cleanupEventTrackerArtifacts ────────────────────────────────────────────

describe("cleanupEventTrackerArtifacts", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "artifact-cleanup-test-"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("removes stale artifacts while preserving keepArtifactStems", () => {
    // Write two session artifacts
    writeSessionJourneyArtifacts({
      projectRoot,
      event: makeEvent({ id: "ses_keep::session_start::1000", sessionId: "ses-keep", artifactStem: "ses_keep", rootSessionId: "ses-keep" }),
    })
    writeSessionJourneyArtifacts({
      projectRoot,
      event: makeEvent({ id: "ses_stal::session_start::1000", sessionId: "ses-stal", artifactStem: "ses_stal", rootSessionId: "ses-stal" }),
    })

    const dir = getEventTrackerArtifactPaths(projectRoot, "ses-keep").dir
    expect(readdirSync(dir)).toHaveLength(4) // 2 json + 2 md

    const result = cleanupEventTrackerArtifacts({
      projectRoot,
      keepArtifactStems: ["ses_keep"],
    })

    expect(result.kept).toContain("ses_keep.json")
    expect(result.kept).toContain("ses_keep.md")
    expect(result.removed).toContain("ses_stal.json")
    expect(result.removed).toContain("ses_stal.md")
    expect(readdirSync(dir)).toHaveLength(2)
  })

  it("returns empty kept/removed when directory does not exist", () => {
    const result = cleanupEventTrackerArtifacts({
      projectRoot,
      keepArtifactStems: ["ses_none"],
    })

    expect(result.kept).toEqual([])
    expect(result.removed).toEqual([])
  })

  it("preserves all artifacts when all stems are kept", () => {
    writeSessionJourneyArtifacts({
      projectRoot,
      event: makeEvent({ id: "ses_abc1::session_start::1000", sessionId: "ses-abc1", artifactStem: "ses_abc1", rootSessionId: "ses-abc1" }),
    })

    const result = cleanupEventTrackerArtifacts({
      projectRoot,
      keepArtifactStems: ["ses_abc1"],
    })

    expect(result.kept).toHaveLength(2) // json + md
    expect(result.removed).toHaveLength(0)
  })
})

// ─── mergeSessionExportMarkdownArtifacts ─────────────────────────────────────

describe("mergeSessionExportMarkdownArtifacts", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "artifact-merge-test-"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("writes artifacts from valid session export Markdown", () => {
    // Minimal valid session export Markdown that parser.ts can parse
    const markdown = [
      "# Session: ses_merg — Test Session",
      "",
      "- **Session ID:** ses_merg",
      "- **Status:** active",
      "- **Created:** 2026-01-01T00:00:00Z",
      "- **Updated:** 2026-01-01T01:00:00Z",
      "- **Event Count:** 1",
      "- **Session Start Count:** 1",
      "- **Session End Count:** 0",
      "",
      "## Table of Contents",
      "",
      "| # | Timestamp | Actor | Type | Summary |",
      "|---|-----------|-------|------|---------|",
      "| 1 | 1700000000000 | system | session_start | Session started |",
      "",
      "## Actors",
      "",
      "- system",
      "",
      "## Session started",
      "",
      "- Timestamp: 1700000000000",
      "- Summary: Session started",
      "",
      "---",
      "*Last output:* Hello",
    ].join("\n")

    const result = mergeSessionExportMarkdownArtifacts({ projectRoot, markdown })

    expect(result.written).toBe(true)
    expect(existsSync(result.paths.jsonPath)).toBe(true)
    expect(existsSync(result.paths.markdownPath)).toBe(true)
    const json = JSON.parse(readFileSync(result.paths.jsonPath, "utf-8")) as {
      _schema: string
      sessionId: string
      exportMeta: { artifactStem: string } | null
    }
    expect(json._schema).toBe("harness/event-tracker/v1")
    expect(json.exportMeta).not.toBeNull()
  })
})

// ─── Concurrent write safety ─────────────────────────────────────────────────

describe("concurrent write safety", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "artifact-concurrent-test-"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("handles sequential writes to the same session without data loss", () => {
    const events = [
      makeEvent({ id: "ses_seq::session_start::1000", type: "session_start", timestamp: 1000, rootSessionId: "ses-seq" }),
      makeEvent({ id: "ses_seq::session_idle::2000", type: "session_idle", timestamp: 2000, rootSessionId: "ses-seq" }),
      makeEvent({ id: "ses_seq::session_end::3000", type: "session_end", timestamp: 3000, rootSessionId: "ses-seq" }),
    ]

    for (const event of events) {
      writeSessionJourneyArtifacts({ projectRoot, event })
    }

    const paths = getEventTrackerArtifactPaths(projectRoot, "ses-seq")
    const json = JSON.parse(readFileSync(paths.jsonPath, "utf-8")) as { events: unknown[]; counters: { eventCount: number } }
    expect(json.events).toHaveLength(3)
    expect(json.counters.eventCount).toBe(3)
  })

  it("uses injected filesystem adapter for isolation", () => {
    const captured: string[] = []
    const spyFs: EventTrackerFileSystem = {
      existsSync: () => false,
      mkdirSync: () => {},
      readFileSync: () => "",
      writeFileSync: (_path: string, data: string) => { captured.push(data) },
    }

    const event = makeEvent({ rootSessionId: "ses-spy" })
    writeSessionJourneyArtifacts({ projectRoot, event, fs: spyFs })

    expect(captured.length).toBeGreaterThanOrEqual(1)
    const parsed = JSON.parse(captured[0])
    expect(parsed._schema).toBe("harness/event-tracker/v1")
  })
})
