import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { appendJournalEntry, createJournalEntry } from "../../src/lib/session-journal.js"
import {
  queryByEventType,
  queryBySession,
  queryByTimeRange,
  queryJournal,
  readJournalEntries,
} from "../../src/lib/journal-query.js"

function makeEntry(overrides: {
  sessionId: string
  eventType: string
  timestamp: number
  summary?: string
  stateRole?: "canonical runtime state" | "audit trail" | "derived projection"
}) {
  return createJournalEntry({
    sessionId: overrides.sessionId,
    actor: "agent",
    eventType: overrides.eventType,
    timestamp: overrides.timestamp,
    source: "unit-test",
    summary: overrides.summary ?? `event ${overrides.eventType}`,
    stateRole: overrides.stateRole ?? "audit trail",
  })
}

describe("journal-query — JOURNAL-02", () => {
  let dir: string
  let filePath: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "hivemind-journal-query-"))
    filePath = join(dir, "journal.jsonl")
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  describe("readJournalEntries", () => {
    it("returns empty array when file does not exist", () => {
      expect(readJournalEntries(join(dir, "missing.jsonl"))).toEqual([])
    })

    it("parses JSONL entries in file order", () => {
      const e1 = makeEntry({ sessionId: "ses-A", eventType: "evt-1", timestamp: 1000 })
      const e2 = makeEntry({ sessionId: "ses-A", eventType: "evt-2", timestamp: 2000 })
      appendJournalEntry({ entry: e1, filePath, idempotencyKey: "k1" })
      appendJournalEntry({ entry: e2, filePath, idempotencyKey: "k2" })

      const out = readJournalEntries(filePath)

      expect(out).toHaveLength(2)
      expect(out[0]?.eventType).toBe("evt-1")
      expect(out[1]?.eventType).toBe("evt-2")
    })

    it("skips corrupt JSONL lines and returns the rest", () => {
      const e1 = makeEntry({ sessionId: "ses-A", eventType: "evt-1", timestamp: 1000 })
      appendJournalEntry({ entry: e1, filePath, idempotencyKey: "k1" })
      writeFileSync(filePath, `${require("node:fs").readFileSync(filePath, "utf-8")}{not-json\n`, "utf-8")
      const e2 = makeEntry({ sessionId: "ses-A", eventType: "evt-2", timestamp: 2000 })
      appendJournalEntry({ entry: e2, filePath, idempotencyKey: "k2" })

      const out = readJournalEntries(filePath)

      expect(out).toHaveLength(2)
      expect(out.map((e) => e.eventType)).toEqual(["evt-1", "evt-2"])
    })
  })

  describe("queryBySession", () => {
    it("returns only entries matching sessionId", () => {
      const entries = [
        makeEntry({ sessionId: "ses-A", eventType: "evt-1", timestamp: 1000 }),
        makeEntry({ sessionId: "ses-B", eventType: "evt-2", timestamp: 2000 }),
        makeEntry({ sessionId: "ses-A", eventType: "evt-3", timestamp: 3000 }),
      ]

      const out = queryBySession(entries, "ses-A")

      expect(out).toHaveLength(2)
      expect(out.every((e) => e.sessionId === "ses-A")).toBe(true)
    })

    it("returns empty array when sessionId is not present", () => {
      const entries = [makeEntry({ sessionId: "ses-A", eventType: "evt-1", timestamp: 1000 })]
      expect(queryBySession(entries, "ses-Z")).toEqual([])
    })
  })

  describe("queryByEventType", () => {
    it("filters by single event-type string", () => {
      const entries = [
        makeEntry({ sessionId: "ses-A", eventType: "session.idle", timestamp: 1000 }),
        makeEntry({ sessionId: "ses-A", eventType: "session.turn.completed", timestamp: 2000 }),
        makeEntry({ sessionId: "ses-A", eventType: "session.idle", timestamp: 3000 }),
      ]

      const out = queryByEventType(entries, "session.idle")

      expect(out).toHaveLength(2)
      expect(out.every((e) => e.eventType === "session.idle")).toBe(true)
    })

    it("filters by event-type array (any-of)", () => {
      const entries = [
        makeEntry({ sessionId: "ses-A", eventType: "session.idle", timestamp: 1000 }),
        makeEntry({ sessionId: "ses-A", eventType: "session.turn.completed", timestamp: 2000 }),
        makeEntry({ sessionId: "ses-A", eventType: "delegation.dispatched", timestamp: 3000 }),
      ]

      const out = queryByEventType(entries, ["session.idle", "delegation.dispatched"])

      expect(out).toHaveLength(2)
      expect(out.map((e) => e.eventType).sort()).toEqual(["delegation.dispatched", "session.idle"])
    })
  })

  describe("queryByTimeRange", () => {
    it("filters entries inclusive of fromMs and toMs", () => {
      const entries = [
        makeEntry({ sessionId: "ses-A", eventType: "evt-1", timestamp: 1000 }),
        makeEntry({ sessionId: "ses-A", eventType: "evt-2", timestamp: 2000 }),
        makeEntry({ sessionId: "ses-A", eventType: "evt-3", timestamp: 3000 }),
        makeEntry({ sessionId: "ses-A", eventType: "evt-4", timestamp: 4000 }),
      ]

      const out = queryByTimeRange(entries, { fromMs: 2000, toMs: 3000 })

      expect(out.map((e) => e.eventType)).toEqual(["evt-2", "evt-3"])
    })

    it("treats fromMs as open-ended when omitted", () => {
      const entries = [
        makeEntry({ sessionId: "ses-A", eventType: "evt-1", timestamp: 1000 }),
        makeEntry({ sessionId: "ses-A", eventType: "evt-2", timestamp: 2000 }),
      ]

      const out = queryByTimeRange(entries, { toMs: 1500 })

      expect(out.map((e) => e.eventType)).toEqual(["evt-1"])
    })

    it("treats toMs as open-ended when omitted", () => {
      const entries = [
        makeEntry({ sessionId: "ses-A", eventType: "evt-1", timestamp: 1000 }),
        makeEntry({ sessionId: "ses-A", eventType: "evt-2", timestamp: 2000 }),
      ]

      const out = queryByTimeRange(entries, { fromMs: 1500 })

      expect(out.map((e) => e.eventType)).toEqual(["evt-2"])
    })

    it("rejects inverted ranges with a [Harness] error", () => {
      expect(() =>
        queryByTimeRange([], { fromMs: 5000, toMs: 1000 }),
      ).toThrow("[Harness]")
    })
  })

  describe("queryJournal — composition over file path", () => {
    it("composes session + event-type + time-range filters in one call", () => {
      appendJournalEntry({
        entry: makeEntry({ sessionId: "ses-A", eventType: "session.idle", timestamp: 1000 }),
        filePath,
        idempotencyKey: "k1",
      })
      appendJournalEntry({
        entry: makeEntry({ sessionId: "ses-B", eventType: "session.idle", timestamp: 2000 }),
        filePath,
        idempotencyKey: "k2",
      })
      appendJournalEntry({
        entry: makeEntry({ sessionId: "ses-A", eventType: "delegation.dispatched", timestamp: 3000 }),
        filePath,
        idempotencyKey: "k3",
      })
      appendJournalEntry({
        entry: makeEntry({ sessionId: "ses-A", eventType: "session.idle", timestamp: 5000 }),
        filePath,
        idempotencyKey: "k4",
      })

      const out = queryJournal(filePath, {
        sessionId: "ses-A",
        eventType: "session.idle",
        fromMs: 500,
        toMs: 4000,
      })

      expect(out).toHaveLength(1)
      expect(out[0]?.timestamp).toBe(1000)
    })

    it("filters by stateRole when provided", () => {
      appendJournalEntry({
        entry: makeEntry({
          sessionId: "ses-A",
          eventType: "evt-canonical",
          timestamp: 1000,
          stateRole: "canonical runtime state",
        }),
        filePath,
        idempotencyKey: "k1",
      })
      appendJournalEntry({
        entry: makeEntry({
          sessionId: "ses-A",
          eventType: "evt-audit",
          timestamp: 2000,
          stateRole: "audit trail",
        }),
        filePath,
        idempotencyKey: "k2",
      })

      const out = queryJournal(filePath, { stateRole: "canonical runtime state" })

      expect(out).toHaveLength(1)
      expect(out[0]?.eventType).toBe("evt-canonical")
    })
  })
})
