import { createJournalEntry, type SessionJournalEntry } from "../../src/task-management/journal/index.js"
import {
  reconstructStateAt,
  reduceJournalEntries,
  replayChronological,
} from "../../src/task-management/journal/replay.js"

function makeEntry(overrides: {
  sessionId: string
  eventType: string
  timestamp: number
  summary?: string
  stateRole?: SessionJournalEntry["stateRole"]
}): SessionJournalEntry {
  return createJournalEntry({
    sessionId: overrides.sessionId,
    actor: "agent",
    eventType: overrides.eventType,
    timestamp: overrides.timestamp,
    source: "unit-test",
    summary: overrides.summary ?? `event ${overrides.eventType}`,
    stateRole: overrides.stateRole ?? "canonical runtime state",
  })
}

describe("journal-replay — JOURNAL-03", () => {
  describe("replayChronological", () => {
    it("returns entries sorted by timestamp ascending", () => {
      const entries = [
        makeEntry({ sessionId: "s", eventType: "c", timestamp: 3000 }),
        makeEntry({ sessionId: "s", eventType: "a", timestamp: 1000 }),
        makeEntry({ sessionId: "s", eventType: "b", timestamp: 2000 }),
      ]

      const out = replayChronological(entries)

      expect(out.map((e) => e.eventType)).toEqual(["a", "b", "c"])
    })

    it("breaks ties on timestamp using the journal id (stable, deterministic)", () => {
      const equalTs = 1000
      const a = makeEntry({ sessionId: "s", eventType: "evt-a", timestamp: equalTs })
      const b = makeEntry({ sessionId: "s", eventType: "evt-b", timestamp: equalTs })

      const sortedAsc = replayChronological([b, a])
      const sortedDesc = replayChronological([a, b])

      // Same input set with different orderings must produce the same chronological order.
      expect(sortedAsc.map((e) => e.id)).toEqual(sortedDesc.map((e) => e.id))
    })

    it("does not mutate the input array", () => {
      const entries = [
        makeEntry({ sessionId: "s", eventType: "c", timestamp: 3000 }),
        makeEntry({ sessionId: "s", eventType: "a", timestamp: 1000 }),
      ]
      const before = entries.map((e) => e.eventType)

      replayChronological(entries)

      expect(entries.map((e) => e.eventType)).toEqual(before)
    })
  })

  describe("reconstructStateAt — past-state reconstruction", () => {
    it("returns canonical-runtime entries up to atMs (inclusive) by default", () => {
      const entries = [
        makeEntry({ sessionId: "s", eventType: "evt-1", timestamp: 1000, stateRole: "canonical runtime state" }),
        makeEntry({ sessionId: "s", eventType: "evt-2", timestamp: 2000, stateRole: "audit trail" }),
        makeEntry({ sessionId: "s", eventType: "evt-3", timestamp: 3000, stateRole: "canonical runtime state" }),
        makeEntry({ sessionId: "s", eventType: "evt-4", timestamp: 5000, stateRole: "canonical runtime state" }),
      ]

      const out = reconstructStateAt(entries, { atMs: 3000 })

      expect(out.map((e) => e.eventType)).toEqual(["evt-1", "evt-3"])
    })

    it("optionally filters by sessionId", () => {
      const entries = [
        makeEntry({ sessionId: "ses-A", eventType: "evt-A1", timestamp: 1000 }),
        makeEntry({ sessionId: "ses-B", eventType: "evt-B1", timestamp: 2000 }),
        makeEntry({ sessionId: "ses-A", eventType: "evt-A2", timestamp: 3000 }),
      ]

      const out = reconstructStateAt(entries, { atMs: 5000, sessionId: "ses-A" })

      expect(out.map((e) => e.eventType)).toEqual(["evt-A1", "evt-A2"])
    })

    it("supports custom stateRoles filter (intersection of allowed roles)", () => {
      const entries = [
        makeEntry({ sessionId: "s", eventType: "evt-canon", timestamp: 1000, stateRole: "canonical runtime state" }),
        makeEntry({ sessionId: "s", eventType: "evt-audit", timestamp: 2000, stateRole: "audit trail" }),
        makeEntry({ sessionId: "s", eventType: "evt-derived", timestamp: 3000, stateRole: "derived projection" }),
      ]

      const out = reconstructStateAt(entries, {
        atMs: 5000,
        stateRoles: ["audit trail", "derived projection"],
      })

      expect(out.map((e) => e.eventType)).toEqual(["evt-audit", "evt-derived"])
    })

    it("returns empty array when no entries are at-or-before atMs", () => {
      const entries = [makeEntry({ sessionId: "s", eventType: "future", timestamp: 9000 })]
      expect(reconstructStateAt(entries, { atMs: 1000 })).toEqual([])
    })
  })

  describe("reduceJournalEntries — generic fold for caller-defined state", () => {
    it("applies the reducer left-to-right in chronological order", () => {
      const entries = [
        makeEntry({ sessionId: "s", eventType: "c", timestamp: 3000 }),
        makeEntry({ sessionId: "s", eventType: "a", timestamp: 1000 }),
        makeEntry({ sessionId: "s", eventType: "b", timestamp: 2000 }),
      ]

      const out = reduceJournalEntries<string[]>(entries, [], (acc, entry) => [...acc, entry.eventType])

      expect(out).toEqual(["a", "b", "c"])
    })

    it("does not call the reducer when the input is empty", () => {
      const reducer = vi.fn()
      reduceJournalEntries([], { count: 0 }, reducer)
      expect(reducer).not.toHaveBeenCalled()
    })
  })
})
