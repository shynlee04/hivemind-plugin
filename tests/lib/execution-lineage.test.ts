import type { Delegation, SessionContinuityRecord } from "../../src/lib/types.js"
import type { SessionJournalEntry } from "../../src/lib/session-journal.js"
import {
  buildExecutionLineage,
  renderExecutionLineageMarkdown,
} from "../../src/lib/execution-lineage.js"

function continuityRecord(): SessionContinuityRecord {
  return {
    sessionID: "ses-parent",
    promptParams: {},
    metadata: {
      status: "running",
      description: "Parent session",
      delegation: null,
      constraints: [],
      pendingNotifications: [],
      delegationPacket: {
        id: "packet-1",
        createdAt: 1,
        spec: "Do Phase 25 work",
        plan: "25-02",
        artifacts: ["artifact.md"],
        commits: ["abc1234"],
        parentChain: ["root", "ses-parent"],
        status: "running",
        updatedAt: 2,
      },
      updatedAt: 2,
    },
  }
}

function delegation(): Delegation {
  return {
    id: "del-1",
    parentSessionId: "ses-parent",
    childSessionId: "ses-child",
    agent: "gsd-executor",
    status: "running",
    createdAt: 3,
    lastMessageCount: 4,
    stablePollCount: 1,
    nestingDepth: 1,
    executionMode: "sdk",
    workingDirectory: process.cwd(),
    queueKey: "opus:gsd-executor:execution",
  }
}

function journalEntry(): SessionJournalEntry {
  return {
    id: "journal-1",
    sessionId: "ses-child",
    parentSessionId: "ses-parent",
    actor: "agent",
    eventType: "session.turn.completed",
    timestamp: 5,
    source: "journal-test",
    summary: "Bounded journal evidence.",
    stateRole: "audit trail",
  }
}

describe("execution lineage projection", () => {
  it("builds derived projection records from delegation inputs", () => {
    const records = buildExecutionLineage({
      continuityRecords: [continuityRecord()],
      delegations: [delegation()],
      journalEntries: [journalEntry()],
    })

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      delegationId: "del-1",
      parentSessionId: "ses-parent",
      childSessionId: "ses-child",
      agent: "gsd-executor",
      status: "running",
      executionMode: "sdk",
      queueKey: "opus:gsd-executor:execution",
      stateRole: "derived projection",
    })
  })

  it("preserves packet evidence without mutating continuity input objects", () => {
    const continuity = continuityRecord()
    const before = JSON.stringify(continuity)
    const records = buildExecutionLineage({
      continuityRecords: [continuity],
      delegations: [delegation()],
      journalEntries: [journalEntry()],
    })

    expect(JSON.stringify(continuity)).toBe(before)
    expect(records[0]?.planId).toBe("25-02")
    expect(records[0]?.evidenceRefs).toEqual(expect.arrayContaining([
      "continuity:ses-parent",
      "delegation:del-1",
      "artifact:artifact.md",
      "commit:abc1234",
      "journal:journal-1",
    ]))
  })

  it("includes pipelineKey only when supplied", () => {
    const input = { continuityRecords: [continuityRecord()], delegations: [delegation()], journalEntries: [] }

    expect(buildExecutionLineage(input)[0]).not.toHaveProperty("pipelineKey")
    expect(buildExecutionLineage(input, { pipelineKey: "phase-25" })[0]).toMatchObject({ pipelineKey: "phase-25" })
  })

  it("renders concise Markdown summaries without raw result firehose", () => {
    const delegated = delegation()
    delegated.result = "RAW RESULT FIREHOSE SHOULD NOT APPEAR"
    const records = buildExecutionLineage({ continuityRecords: [continuityRecord()], delegations: [delegated], journalEntries: [] })
    records[0] = { ...records[0]!, summary: "Bounded lineage summary." }

    const markdown = renderExecutionLineageMarkdown(records)

    for (const heading of ["Delegation", "Parent", "Child", "Agent", "Status", "Pipeline", "Evidence"]) {
      expect(markdown).toContain(heading)
    }
    expect(markdown).toContain("Bounded lineage summary.")
    expect(markdown).not.toContain("RAW RESULT FIREHOSE")
  })

  it("returns an explicit empty-state summary", () => {
    expect(renderExecutionLineageMarkdown([])).toBe("No execution lineage records available.")
  })
})
