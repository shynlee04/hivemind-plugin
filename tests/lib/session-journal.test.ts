import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  appendJournalEntry,
  createJournalEntry,
  renderJournalEntryMarkdown,
  serializeJournalEntryJson,
} from "../../src/lib/session-journal.js"

describe("session journal contract", () => {
  it("serializes all required journal fields as JSON", () => {
    const entry = createJournalEntry({
      sessionId: "ses-parent",
      turnId: "turn-1",
      parentSessionId: "ses-root",
      childSessionId: "ses-child",
      actor: "agent",
      eventType: "session.turn.completed",
      timestamp: 1_714_000_000_000,
      source: "unit-test",
      summary: "Delegated turn completed with evidence.",
      stateRole: "audit trail",
    })

    expect(serializeJournalEntryJson(entry)).toMatchObject({
      sessionId: "ses-parent",
      turnId: "turn-1",
      parentSessionId: "ses-root",
      childSessionId: "ses-child",
      actor: "agent",
      eventType: "session.turn.completed",
      timestamp: 1_714_000_000_000,
      source: "unit-test",
      summary: "Delegated turn completed with evidence.",
      stateRole: "audit trail",
    })
  })

  it("rejects state roles outside the locked marker values", () => {
    expect(() => createJournalEntry({
      sessionId: "ses-parent",
      actor: "agent",
      eventType: "session.turn.completed",
      timestamp: 1_714_000_000_000,
      source: "unit-test",
      summary: "Invalid marker should fail.",
      // @ts-expect-error verifies runtime validation rejects untrusted input too.
      stateRole: "canonical-ish",
    })).toThrow("[Harness]")
  })

  it("renders bounded Markdown summary labels", () => {
    const entry = createJournalEntry({
      sessionId: "ses-parent",
      actor: "human",
      eventType: "prompt.received",
      timestamp: 1_714_000_000_000,
      source: "unit-test",
      summary: "Human requested Phase 25 completion.",
      stateRole: "audit trail",
    })

    const markdown = renderJournalEntryMarkdown(entry)

    expect(markdown).toContain("Session")
    expect(markdown).toContain("Actor")
    expect(markdown).toContain("Event")
    expect(markdown).toContain("Source")
    expect(markdown).toContain("State role")
    expect(markdown).toContain("Summary")
  })

  it("appends exactly one JSONL entry for a repeated idempotency key", () => {
    const dir = mkdtempSync(join(tmpdir(), "hivemind-journal-"))
    const filePath = join(dir, "journal.jsonl")

    try {
      const entry = createJournalEntry({
        sessionId: "ses-parent",
        actor: "agent",
        eventType: "session.idle",
        timestamp: 1_714_000_000_000,
        source: "unit-test",
        summary: "Idle event projected once.",
        stateRole: "audit trail",
      })

      appendJournalEntry({ entry, filePath, idempotencyKey: "ses-parent:idle" })
      appendJournalEntry({ entry, filePath, idempotencyKey: "ses-parent:idle" })

      const lines = readFileSync(filePath, "utf-8").trim().split("\n")
      expect(lines).toHaveLength(1)
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({ idempotencyKey: "ses-parent:idle" })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("redacts summary secrets in appended JSONL while preserving journal identifiers", () => {
    const dir = mkdtempSync(join(tmpdir(), "hivemind-journal-redaction-"))
    const filePath = join(dir, "journal.jsonl")

    try {
      const entry = createJournalEntry({
        sessionId: "ses-parent-redaction",
        childSessionId: "ses-child-redaction",
        actor: "agent",
        eventType: "session.idle",
        timestamp: 1_714_000_000_000,
        source: "unit-test",
        summary: "Output contained Authorization: Bearer abc.def.ghi",
        stateRole: "audit trail",
      })

      appendJournalEntry({ entry, filePath, idempotencyKey: "ses-parent-redaction:idle" })

      const raw = readFileSync(filePath, "utf-8")
      expect(raw).toContain("ses-parent-redaction")
      expect(raw).toContain("ses-child-redaction")
      expect(raw).toContain("Authorization: Bearer [REDACTED:TOKEN]")
      expect(raw).not.toContain("abc.def.ghi")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe(".hivemind journal and lineage taxonomy", () => {
  it("declares journal category ownership and Q6 state-root boundaries", () => {
    const readme = readFileSync(".hivemind/journal/README.md", "utf-8")

    for (const heading of ["## Owner", "## Role", "## Schema", "## Index", "## Retention", "## Rebuild", "## Marker"]) {
      expect(readme).toContain(heading)
    }

    expect(readme).toContain("audit trail")
    expect(readme).toContain(".hivemind/")
    expect(readme).toContain("not terminal runtime status")
  })

  it("declares lineage category ownership and rebuild behavior", () => {
    const readme = readFileSync(".hivemind/lineage/README.md", "utf-8")

    for (const heading of ["## Owner", "## Role", "## Schema", "## Index", "## Retention", "## Rebuild", "## Marker"]) {
      expect(readme).toContain(heading)
    }

    expect(readme).toContain("derived projection")
    expect(readme).toContain("rebuilt from continuity, delegation records, and journal entries")
  })
})
