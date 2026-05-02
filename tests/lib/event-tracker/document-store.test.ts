/**
 * @fileoverview Tests for event-tracker/document-store.ts — document CRUD,
 * query operations, error paths, and concurrent access patterns.
 *
 * Test size: small (pure logic, in-memory filesystem adapter)
 * Evidence: runtime-truthful (exercises real public interfaces with in-memory FS)
 */
import { describe, it, expect } from "vitest"
import {
  createEmptyDocument,
  readDocument,
  readExistingDocumentForScan,
  documentContainsSession,
  addEvent,
  mergeExportMetadata,
} from "../../../src/lib/event-tracker/document-store.js"
import type {
  EventTrackerFileSystem,
  SessionJourneyDocument,
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
    summary: "Session started",
    timestamp: 1700000000000,
    source: "opencode.event",
    stateRole: "audit trail",
    ...overrides,
  }
}

/**
 * Helper: creates an in-memory filesystem adapter for isolated testing.
 */
function makeMemFs(files: Map<string, string> = new Map()): EventTrackerFileSystem {
  return {
    existsSync: (path: string) => files.has(path),
    mkdirSync: () => {},
    readFileSync: (path: string) => {
      const content = files.get(path)
      if (content === undefined) throw new Error(`ENOENT: ${path}`)
      return content
    },
    writeFileSync: (path: string, data: string) => { files.set(path, data) },
  }
}

/**
 * Helper: serializes a document to JSON for in-memory FS storage.
 */
function serializeDocument(doc: SessionJourneyDocument): string {
  return JSON.stringify(doc, null, 2)
}

// ─── createEmptyDocument ─────────────────────────────────────────────────────

describe("createEmptyDocument", () => {
  it("creates a v1 schema document with correct default metadata", () => {
    const event = makeEvent()
    const doc = createEmptyDocument(event)

    expect(doc._schema).toBe("harness/event-tracker/v1")
    expect(doc.sessionId).toBe("ses-test-0001")
    expect(doc.semanticSessionId).toBe("ses_test")
    expect(doc.artifactStem).toBe("ses_test")
    expect(doc.status).toBe("active")
    expect(doc.events).toEqual([])
    expect(doc.counters.eventCount).toBe(0)
    expect(doc.counters.sessionStartCount).toBe(0)
    expect(doc.counters.sessionEndCount).toBe(0)
    expect(doc.resumable).toBe(true)
    expect(doc.exportMeta).toBeNull()
    expect(doc.updatedAt).toBe(1700000000000)
  })

  it("uses targetSessionId override when provided", () => {
    const event = makeEvent({ rootSessionId: "ses-root-0001" })
    const doc = createEmptyDocument(event, "ses-over-ride1")

    expect(doc.sessionId).toBe("ses-over-ride1")
    expect(doc.mainSessionId).toBe("ses-over-ride1")
  })

  it("defaults mainSessionId to rootSessionId when present", () => {
    const event = makeEvent({ rootSessionId: "ses-root-0001" })
    const doc = createEmptyDocument(event)

    expect(doc.mainSessionId).toBe("ses-root-0001")
  })

  it("initializes all collections as empty arrays", () => {
    const doc = createEmptyDocument(makeEvent())

    expect(doc.lineage).toEqual([])
    expect(doc.keyFindings).toEqual([])
    expect(doc.actors).toEqual([])
    expect(doc.subSessions).toEqual([])
    expect(doc.delegations).toEqual([])
    expect(doc.toolsUsed).toEqual([])
    expect(doc.toc).toEqual([])
  })
})

// ─── readDocument ────────────────────────────────────────────────────────────

describe("readDocument", () => {
  it("returns a new document when JSON file does not exist", () => {
    const fs = makeMemFs()
    const event = makeEvent()
    const doc = readDocument(fs, "/nonexistent.json", event)

    expect(doc._schema).toBe("harness/event-tracker/v1")
    expect(doc.events).toEqual([])
  })

  it("reads and normalizes an existing valid document", () => {
    const existing = createEmptyDocument(makeEvent())
    existing.events = [makeEvent()]
    const fs = makeMemFs(new Map([["/test.json", serializeDocument(existing)]]))

    const doc = readDocument(fs, "/test.json", makeEvent())

    expect(doc._schema).toBe("harness/event-tracker/v1")
    expect(doc.events).toHaveLength(1)
  })

  it("throws [Harness] error for invalid JSON content", () => {
    const fs = makeMemFs(new Map([["/bad.json", "not json at all"]]))

    expect(() => readDocument(fs, "/bad.json", makeEvent())).toThrow(
      /\[Harness\].*Failed to parse event-tracker JSON/
    )
  })

  it("throws [Harness] error for JSON with wrong schema", () => {
    const wrongSchema = { _schema: "wrong/schema/v2", events: [] }
    const fs = makeMemFs(new Map([["/wrong.json", JSON.stringify(wrongSchema)]]))

    expect(() => readDocument(fs, "/wrong.json", makeEvent())).toThrow(
      /\[Harness\].*Failed to parse event-tracker JSON/
    )
  })
})

// ─── readExistingDocumentForScan ──────────────────────────────────────────────

describe("readExistingDocumentForScan", () => {
  it("returns null for document with invalid schema", () => {
    const fs = makeMemFs(new Map([["/bad.json", JSON.stringify({ foo: "bar" })]]))

    const result = readExistingDocumentForScan(fs, "/bad.json")

    expect(result).toBeNull()
  })

  it("returns normalized document for valid schema", () => {
    const existing = createEmptyDocument(makeEvent())
    const fs = makeMemFs(new Map([["/good.json", serializeDocument(existing)]]))

    const result = readExistingDocumentForScan(fs, "/good.json")

    expect(result).not.toBeNull()
    expect(result!._schema).toBe("harness/event-tracker/v1")
  })
})

// ─── documentContainsSession ─────────────────────────────────────────────────

describe("documentContainsSession", () => {
  it("returns true when sessionId matches document root", () => {
    const doc = createEmptyDocument(makeEvent())

    expect(documentContainsSession(doc, "ses-test-0001")).toBe(true)
  })

  it("returns true when sessionId matches mainSessionId", () => {
    const doc = createEmptyDocument(makeEvent({ rootSessionId: "ses-root" }))

    expect(documentContainsSession(doc, "ses-root")).toBe(true)
  })

  it("returns true when sessionId matches a subSession", () => {
    const doc = createEmptyDocument(makeEvent())
    doc.subSessions = [{ sessionId: "ses-child-01", role: "delegate", delegatedTo: "agent", sourceSessionId: "ses-test-0001", description: "task" }]

    expect(documentContainsSession(doc, "ses-child-01")).toBe(true)
  })

  it("returns true when sessionId appears in an event", () => {
    const doc = createEmptyDocument(makeEvent())
    const { document: withEvent } = addEvent(doc, makeEvent({ sessionId: "ses-evt-01" }))

    expect(documentContainsSession(withEvent, "ses-evt-01")).toBe(true)
  })

  it("returns false when sessionId is not found anywhere", () => {
    const doc = createEmptyDocument(makeEvent())

    expect(documentContainsSession(doc, "ses-nonexistent")).toBe(false)
  })
})

// ─── addEvent ────────────────────────────────────────────────────────────────

describe("addEvent", () => {
  it("adds a new event and sets written to true", () => {
    const doc = createEmptyDocument(makeEvent())
    const event = makeEvent({ id: "ses_test::session_idle::2000", type: "session_idle", timestamp: 2000 })

    const { document: next, written } = addEvent(doc, event)

    expect(written).toBe(true)
    expect(next.events).toHaveLength(1)
    expect(next.counters.eventCount).toBe(1)
  })

  it("deduplicates events by ID and sets written to false", () => {
    const doc = createEmptyDocument(makeEvent())
    const event = makeEvent({ id: "ses_test::session_start::1000", type: "session_start", timestamp: 1000 })

    // Add the event first, then attempt to add the same event again
    const { document: withEvent } = addEvent(doc, event)
    expect(withEvent.events).toHaveLength(1)

    const { written, document: result } = addEvent(withEvent, event)
    expect(written).toBe(false)
    expect(result.events).toHaveLength(1)
  })

  it("updates counters for session_start and session_end types", () => {
    const doc = createEmptyDocument(makeEvent())

    const { document: withStart } = addEvent(doc,
      makeEvent({ id: "ses_test::session_start::1000", type: "session_start", timestamp: 1000 })
    )
    expect(withStart.counters.sessionStartCount).toBe(1)

    const { document: withEnd } = addEvent(withStart,
      makeEvent({ id: "ses_test::session_end::2000", type: "session_end", timestamp: 2000 })
    )
    expect(withEnd.counters.sessionEndCount).toBe(1)
    expect(withEnd.counters.eventCount).toBe(2)
  })

  it("sorts events by timestamp", () => {
    const doc = createEmptyDocument(makeEvent())

    const { document: withSecond } = addEvent(doc,
      makeEvent({ id: "ses_test::session_idle::3000", type: "session_idle", timestamp: 3000 })
    )
    const { document: withFirst } = addEvent(withSecond,
      makeEvent({ id: "ses_test::session_start::1000", type: "session_start", timestamp: 1000 })
    )

    const timestamps = withFirst.events.map((e) => e.timestamp)
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b))
  })

  it("derives status from events: completed when session_end present", () => {
    const doc = createEmptyDocument(makeEvent())

    const { document: result } = addEvent(doc,
      makeEvent({ id: "ses_test::session_end::9999", type: "session_end", timestamp: 9999 })
    )

    expect(result.status).toBe("completed")
  })

  it("derives status from events: idle when session_idle present", () => {
    const doc = createEmptyDocument(makeEvent())

    const { document: result } = addEvent(doc,
      makeEvent({ id: "ses_test::session_idle::5000", type: "session_idle", timestamp: 5000 })
    )

    expect(result.status).toBe("idle")
  })

  it("builds TOC entries from events", () => {
    const doc = createEmptyDocument(makeEvent())

    const { document: result } = addEvent(doc,
      makeEvent({ id: "ses_test::session_start::1000", type: "session_start", timestamp: 1000 })
    )

    expect(result.toc).toHaveLength(1)
    expect(result.toc[0].index).toBe(1)
    expect(result.toc[0].type).toBe("session_start")
  })

  it("sets startedAt from first session_start event", () => {
    const doc = createEmptyDocument(makeEvent())
    doc.startedAt = null

    const { document: result } = addEvent(doc,
      makeEvent({ id: "ses_test::session_start::1000", type: "session_start", timestamp: 1000 })
    )

    expect(result.startedAt).toBe(1000)
  })

  it("preserves existing startedAt when event is not session_start", () => {
    const doc = createEmptyDocument(makeEvent())
    doc.startedAt = 500

    const { document: result } = addEvent(doc,
      makeEvent({ id: "ses_test::session_idle::1000", type: "session_idle", timestamp: 1000 })
    )

    expect(result.startedAt).toBe(500)
  })

  it("merges toolUsage from event into document toolsUsed", () => {
    const doc = createEmptyDocument(makeEvent())
    const event = makeEvent({
      id: "ses_test::session_event::1000",
      toolUsage: { toolName: "delegate-task", status: "completed", summary: "done", timestamp: 1000 },
    })

    const { document: result } = addEvent(doc, event)

    expect(result.toolsUsed).toHaveLength(1)
    expect(result.toolsUsed[0].toolName).toBe("delegate-task")
  })

  it("merges delegation from event into document delegations", () => {
    const doc = createEmptyDocument(makeEvent())
    const event = makeEvent({
      id: "ses_test::session_event::1000",
      delegation: {
        packetId: "pkt-001",
        subSessionId: "ses-child",
        delegatedTo: "gsd-executor",
        description: "implement feature",
        subagentType: "gsd-executor",
        status: "linked",
      },
    })

    const { document: result } = addEvent(doc, event)

    expect(result.delegations).toHaveLength(1)
    expect(result.delegations[0].packetId).toBe("pkt-001")
  })
})

// ─── mergeExportMetadata ─────────────────────────────────────────────────────

describe("mergeExportMetadata", () => {
  it("merges parsed Markdown export metadata into the document", () => {
    const doc = createEmptyDocument(makeEvent())
    const event = makeEvent({ id: "ses_test::session_updated::2000", type: "session_updated", timestamp: 2000 })

    // Valid session export markdown with proper turn format for parser
    const markdown = [
      "# Session: ses_test — Test Merge",
      "",
      "**Session ID:** ses_test",
      "**Created:** 2026-01-01T00:00:00Z",
      "**Updated:** 2026-01-01T01:00:00Z",
      "",
      "## User",
      "",
      "Implement the caching layer",
      "",
      "---",
      "",
      "## Assistant (gsd-executor·claude-4·1.2s)",
      "",
      "I will implement the caching layer now.",
      "",
      "**Tool: delegate-task**",
      "",
      "**Input:**",
      "```json",
      `{"agent": "gsd-executor", "subagent_type": "gsd-executor", "description": "implement caching"}`,
      "```",
      "",
      "**Output:**",
      "```",
      "task_id: ses_abcd completed",
      "```",
      "",
      "---",
      "",
      "## User",
      "",
      "Verify the result",
      "",
      "---",
      "",
      "## Assistant (hm-l2-critic·claude-4·0.5s)",
      "",
      "Verification complete. Result text output.",
    ].join("\n")

    const result = mergeExportMetadata(doc, event, markdown)

    expect(result.exportMeta).not.toBeNull()
    expect(result.exportMeta!.artifactStem).toBe("ses_test")
    // Actors are extracted from ## Assistant headers
    expect(result.actors).toContain("gsd-executor")
    expect(result.actors).toContain("hm-l2-critic")
    expect(result.lastMessageOutput).toContain("Result text")
  })
})

// ─── Concurrent access patterns ──────────────────────────────────────────────

describe("concurrent access patterns", () => {
  it("handles multiple sequential addEvent calls without data corruption", () => {
    const doc = createEmptyDocument(makeEvent({ rootSessionId: "ses-conc" }))
    const events = [
      makeEvent({ id: "ses_conc::session_start::1000", type: "session_start", timestamp: 1000 }),
      makeEvent({ id: "ses_conc::session_idle::2000", type: "session_idle", timestamp: 2000 }),
      makeEvent({ id: "ses_conc::session_event::3000", type: "session_event", timestamp: 3000 }),
      makeEvent({ id: "ses_conc::session_end::4000", type: "session_end", timestamp: 4000 }),
    ]

    let current = doc
    for (const event of events) {
      const result = addEvent(current, event)
      expect(result.written).toBe(true)
      current = result.document
    }

    expect(current.events).toHaveLength(4)
    expect(current.counters.eventCount).toBe(4)
    expect(current.counters.sessionStartCount).toBe(1)
    expect(current.counters.sessionEndCount).toBe(1)
    expect(current.status).toBe("completed")
  })

  it("handles deduplication across multiple sequential adds", () => {
    const doc = createEmptyDocument(makeEvent())
    const event = makeEvent({ id: "ses_test::session_start::1000", type: "session_start", timestamp: 1000 })

    const { document: first } = addEvent(doc, event)
    const { written, document: second } = addEvent(first, event)

    expect(written).toBe(false)
    expect(second.events).toHaveLength(1)
  })
})

// ─── Bounded retention ───────────────────────────────────────────────────────

describe("bounded retention", () => {
  it("retains only the most recent MAX_EVENTS_PER_DOCUMENT events", () => {
    const doc = createEmptyDocument(makeEvent())

    // Add 110 events (MAX is 100)
    let current = doc
    for (let i = 0; i < 110; i++) {
      const result = addEvent(current, makeEvent({
        id: `ses_test::session_event::${i}`,
        type: "session_event",
        timestamp: i,
      }))
      current = result.document
    }

    // Should be capped at 100
    expect(current.events.length).toBeLessThanOrEqual(100)
    // The oldest events should have been trimmed
    expect(current.events[0].timestamp).toBeGreaterThan(0)
  })
})
