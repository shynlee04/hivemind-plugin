import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Delegation, SessionContinuityRecord } from "../../src/shared/types.js"

/** Creates a minimal continuity record for persistence regression tests. */
function makeRecord(sessionID: string): SessionContinuityRecord {
  return {
    sessionID,
    promptParams: {},
    metadata: {
      status: "running",
      description: `record ${sessionID}`,
      delegation: null,
      constraints: [],
      pendingNotifications: [],
      updatedAt: Date.now(),
    },
  }
}

describe("continuity persistence", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.resetModules()
    vi.doUnmock("node:fs")
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "continuity-test-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    vi.doUnmock("node:fs")
    vi.resetModules()
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
    rmSync(stateDir, { recursive: true, force: true })
  })

  it("quarantines corrupt canonical session-continuity.json and throws visibly", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()
    writeFileSync(filePath, "NOT JSON {{{", "utf-8")

    expect(() => continuity.listSessionContinuity()).toThrow(/^\[Harness\]/)
    expect(existsSync(filePath)).toBe(false)
    expect(readdirSync(stateDir).some((name) => name.startsWith("session-continuity.json.corrupt-"))).toBe(true)
  })

  it("records continuity in memory without creating temp or final files", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    continuity.recordSessionContinuity(makeRecord("ses-one"))
    continuity.recordSessionContinuity(makeRecord("ses-two"))

    // In-memory state is correct
    const records = continuity.listSessionContinuity()
    expect(records).toHaveLength(2)
    expect(records.map((r) => r.sessionID)).toEqual(expect.arrayContaining(["ses-one", "ses-two"]))

    // No .tmp files are created on disk (persistStore is no-op)
    const dirContents = readdirSync(stateDir)
    const tmpFiles = dirContents.filter((name) => name.includes("session-continuity") && name.endsWith(".tmp"))
    expect(tmpFiles).toEqual([])
  })

  it("records continuity in memory with session identifiers preserved", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    continuity.recordSessionContinuity({
      ...makeRecord("ses-redaction"),
      metadata: {
        ...makeRecord("ses-redaction").metadata,
        description: "summary includes HIVEMIND_FAKE_TOKEN=secret-value-1234567890",
      },
    })

    // In-memory record has the raw description (redaction happens at session-tracker write layer)
    const record = continuity.getSessionContinuity("ses-redaction")
    expect(record?.sessionID).toBe("ses-redaction")
    expect(record?.metadata.description).toContain("secret-value-1234567890")
    expect(record?.metadata.description).toContain("HIVEMIND_FAKE_TOKEN")
  })

  /**
   * FRESH-INSTALL-RECOVERY-01 (Phase 38.1)
   *
   * Verifies that on a clean install — no `.hivemind/state/` directory at
   * all — in-memory continuity works without producing state files on disk.
   *
   * Also asserts HIVEMIND-ROOT-08: no `brain.json` artifact is produced.
   *
   * NOTE: With P41-D-01/D-02, persistStore and persistDelegations are no-ops.
   * State state files are no longer created — session-tracker is canonical.
   */
  it("works in-memory on a fresh install without creating state files (no brain.json)", async () => {
    const freshStateDir = join(stateDir, "nested", ".hivemind", "state")
    process.env.OPENCODE_HARNESS_STATE_DIR = freshStateDir
    expect(existsSync(freshStateDir)).toBe(false)

    const continuity = await import("../../src/task-management/continuity/index.js")
    const delegationPersistence = await import("../../src/task-management/continuity/delegation-persistence.js")

    continuity.recordSessionContinuity(makeRecord("ses-fresh-install"))

    // In-memory state works
    const records = continuity.listSessionContinuity()
    expect(records.map((r) => r.sessionID)).toContain("ses-fresh-install")

    // No continuity file is created on disk (persistStore no-op)
    expect(existsSync(continuity.getContinuityStoragePath())).toBe(false)

    const delegation: Delegation = {
      id: "deleg-fresh-install",
      parentSessionId: "ses-fresh-install",
      childSessionId: "child-fresh-install",
      agent: "builder",
      status: "dispatched",
      createdAt: Date.now(),
      lastMessageCount: 0,
      stablePollCount: 0,
      executionMode: "sdk",
      workingDirectory: process.cwd(),
      queueKey: "agent:builder",
      nestingDepth: 1,
    }
    delegationPersistence.persistDelegations([delegation])

    // No delegations file is created on disk (persistDelegations no-op for file writes)
    const delegationsPath = delegationPersistence.getDelegationsFilePath()
    expect(existsSync(delegationsPath)).toBe(false)
    expect(delegationPersistence.readPersistedDelegations()).toEqual([])

    // HIVEMIND-ROOT-08 — no `brain.json` should ever appear in canonical state.
    expect(existsSync(join(freshStateDir, "brain.json"))).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Recovery tests — restart rehydration, corrupt-file handling, atomic write
  // -------------------------------------------------------------------------

  it("should maintain in-memory continuity across consecutive writes (cross-instance handled by session-tracker)", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    continuity.recordSessionContinuity(makeRecord("ses-mem-1"))
    continuity.recordSessionContinuity(makeRecord("ses-mem-2"))

    // In-memory state is maintained across writes
    const ids = continuity.listSessionContinuity().map((r) => r.sessionID).sort()
    expect(ids).toContain("ses-mem-1")
    expect(ids).toContain("ses-mem-2")

    // No continuity file is produced on disk (persistStore is no-op)
    expect(existsSync(continuity.getContinuityStoragePath())).toBe(false)
  })

  it("should handle corrupt continuity file by quarantining and throwing", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()

    // Write garbage to the file
    writeFileSync(filePath, "NOT JSON {{{ GARBAGE }}}", "utf-8")
    expect(existsSync(filePath)).toBe(true)

    // Accessing the store should throw a descriptive [Hivemind] error
    expect(() => continuity.listSessionContinuity()).toThrow(/^\[Harness\]/)

    // The corrupt file should have been moved aside (quarantined)
    expect(existsSync(filePath)).toBe(false)
    const quarantineFiles = readdirSync(stateDir).filter((name) =>
      name.startsWith("session-continuity.json.corrupt-"),
    )
    expect(quarantineFiles.length).toBeGreaterThanOrEqual(1)
  })

  it("should handle missing continuity file gracefully", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()

    // No file exists at the canonical path — but the loader will fall
    // through to the legacy path which may have real data.  To isolate
    // the "no sessions on disk" case, write a valid but empty store.
    writeFileSync(filePath, "{}", "utf-8")
    expect(existsSync(filePath)).toBe(true)

    // Should initialize with empty state, not throw
    const records = continuity.listSessionContinuity()
    expect(records).toEqual([])
  })

  it("should handle empty continuity file", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()

    // Write a valid but empty JSON object — parsed as an empty store,
    // preventing legacy fallback.
    writeFileSync(filePath, "{}", "utf-8")
    expect(existsSync(filePath)).toBe(true)

    // Should initialize with empty state
    const records = continuity.listSessionContinuity()
    expect(records).toEqual([])
  })

  it("should preserve delegation metadata in memory across consecutive calls", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    const baseRecord = makeRecord("ses-deleg-1")
    continuity.recordSessionContinuity({
      ...baseRecord,
      metadata: {
        ...baseRecord.metadata,
        delegation: {
          rootID: "root-abc",
          depth: 2,
          budgetUsed: 1,
          agent: "builder",
          category: "implementation",
          queueKey: "agent:builder",
        },
        delegationPacket: {
          id: "pkt-001",
          createdAt: Date.now(),
          spec: "Build the thing",
          artifacts: ["src/foo.ts"],
          commits: ["abc123"],
          parentChain: ["root-abc", "parent-xyz"],
          status: "running",
          updatedAt: Date.now(),
        },
      },
    })

    const baseRecord2 = makeRecord("ses-deleg-2")
    continuity.recordSessionContinuity({
      ...baseRecord2,
      metadata: {
        ...baseRecord2.metadata,
        delegation: {
          rootID: "root-def",
          depth: 1,
          budgetUsed: 0,
          agent: "reviewer",
          category: "review",
          queueKey: "agent:reviewer",
        },
      },
    })

    // Verify delegation metadata is preserved in-memory
    const rec1 = continuity.getSessionContinuity("ses-deleg-1")
    expect(rec1?.metadata.delegation).toEqual({
      rootID: "root-abc",
      depth: 2,
      budgetUsed: 1,
      agent: "builder",
      category: "implementation",
      queueKey: "agent:builder",
    })
    expect(rec1?.metadata.delegationPacket?.id).toBe("pkt-001")
    expect(rec1?.metadata.delegationPacket?.artifacts).toEqual(["src/foo.ts"])
    expect(rec1?.metadata.delegationPacket?.commits).toEqual(["abc123"])
    expect(rec1?.metadata.delegationPacket?.parentChain).toEqual(["root-abc", "parent-xyz"])

    const rec2 = continuity.getSessionContinuity("ses-deleg-2")
    expect(rec2?.metadata.delegation?.rootID).toBe("root-def")
    expect(rec2?.metadata.delegation?.agent).toBe("reviewer")

    // No file written to disk
    expect(existsSync(continuity.getContinuityStoragePath())).toBe(false)
  })

  it("should survive concurrent read/write in-memory without corruption", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")

    // Rapidly interleave writes and reads
    const sessionIDs = Array.from({ length: 20 }, (_, i) => `ses-concurrent-${i}`)

    for (const id of sessionIDs) {
      continuity.recordSessionContinuity(makeRecord(id))
      // Immediately read back
      const record = continuity.getSessionContinuity(id)
      expect(record?.sessionID).toBe(id)
    }

    // Final verification: all sessions present
    const allRecords = continuity.listSessionContinuity()
    const allIDs = allRecords.map((r) => r.sessionID).sort()
    for (const id of sessionIDs) {
      expect(allIDs).toContain(id)
    }
  })

  it("should deep-clone on read to prevent mutation", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    continuity.recordSessionContinuity(makeRecord("ses-clone-test"))

    // Read the record
    const record = continuity.getSessionContinuity("ses-clone-test")
    expect(record).toBeDefined()

    // Mutate the returned record
    const originalDescription = record!.metadata.description
    record!.metadata.description = "MUTATED"
    record!.metadata.constraints.push("fake-constraint")

    // Re-read and verify original is unchanged
    const reRead = continuity.getSessionContinuity("ses-clone-test")
    expect(reRead?.metadata.description).toBe(originalDescription)
    expect(reRead?.metadata.constraints).toEqual([])

    // Also verify listSessionContinuity returns independent clones
    const list1 = continuity.listSessionContinuity()
    const list2 = continuity.listSessionContinuity()
    expect(list1).not.toBe(list2) // different array references
    // Mutate list1
    if (list1.length > 0) {
      list1[0]!.metadata.description = "MUTATED_LIST"
    }
    // list2 should be unaffected
    const list2Item = list2.find((r) => r.sessionID === "ses-clone-test")
    expect(list2Item?.metadata.description).toBe(originalDescription)
  })

  it("should maintain in-memory consistency across sequential writes (no file I/O)", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")

    // Write in-memory data
    continuity.recordSessionContinuity(makeRecord("ses-mem-atomic-1"))
    continuity.recordSessionContinuity(makeRecord("ses-mem-atomic-2"))
    continuity.recordSessionContinuity(makeRecord("ses-mem-atomic-3"))

    // Verify all records are accessible in-memory
    const allRecords = continuity.listSessionContinuity()
    const allIDs = allRecords.map((r) => r.sessionID)
    expect(allIDs).toContain("ses-mem-atomic-1")
    expect(allIDs).toContain("ses-mem-atomic-2")
    expect(allIDs).toContain("ses-mem-atomic-3")

    // No leftover .tmp files or continuity files on disk
    const dirContents = readdirSync(stateDir)
    const tmpFiles = dirContents.filter((name) => name.endsWith(".tmp"))
    expect(tmpFiles).toEqual([])
    expect(existsSync(continuity.getContinuityStoragePath())).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CA-03: atomic_commit toggle
// ---------------------------------------------------------------------------

describe("atomic_commit toggle", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.resetModules()
    vi.doUnmock("node:fs")
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "continuity-atomic-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    vi.doUnmock("node:fs")
    vi.resetModules()
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
    rmSync(stateDir, { recursive: true, force: true })
  })

  it("does not write to disk regardless of atomic_commit config (persistStore is no-op)", async () => {
    const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/config/subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(
        HivemindConfigsSchema.parse({ atomic_commit: true, workflow: { use_worktrees: false } }),
      ),
      invalidateConfigCache: vi.fn(),
    }))

    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()

    continuity.recordSessionContinuity(makeRecord("ses-atomic-noop"))

    // No file should be created on disk — persistStore is no-op (P41-D-01)
    expect(existsSync(filePath)).toBe(false)
  })

  it("does not write to disk when atomic_commit is false", async () => {
    const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/config/subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(
        HivemindConfigsSchema.parse({ atomic_commit: false, workflow: { use_worktrees: false } }),
      ),
      invalidateConfigCache: vi.fn(),
    }))

    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()

    continuity.recordSessionContinuity(makeRecord("ses-atomic-false"))

    // No file should be created on disk
    expect(existsSync(filePath)).toBe(false)
  })

  it("does not write to disk with default config", async () => {
    const { getDefaultConfigs } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/config/subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(getDefaultConfigs()),
      invalidateConfigCache: vi.fn(),
    }))

    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()

    continuity.recordSessionContinuity(makeRecord("ses-atomic-defaults"))

    // No file should be created on disk (persistStore is no-op)
    expect(existsSync(filePath)).toBe(false)
  })
})


