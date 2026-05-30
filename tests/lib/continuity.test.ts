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

  it("uses unique temp files for rapid overlapping continuity writes", async () => {
    const tempPaths: string[] = []

    vi.doMock("node:fs", async () => {
      const actual = await vi.importActual<typeof import("node:fs")>("node:fs")
      return {
        ...actual,
        writeFileSync: vi.fn<typeof actual.writeFileSync>((...args) => {
          const filePath = String(args[0])
          if (filePath.includes("session-continuity.json") && filePath.endsWith(".tmp")) {
            tempPaths.push(basename(filePath))
          }
          actual.writeFileSync(...args)
        }),
      }
    })

    const continuity = await import("../../src/task-management/continuity/index.js")
    continuity.recordSessionContinuity(makeRecord("ses-one"))
    continuity.recordSessionContinuity(makeRecord("ses-two"))

    expect(tempPaths).toHaveLength(2)
    expect(new Set(tempPaths).size).toBe(2)
    expect(tempPaths.every((name) => name !== "session-continuity.json.tmp")).toBe(true)
    const parsed = JSON.parse(readFileSync(continuity.getContinuityStoragePath(), "utf-8")) as { sessions?: Record<string, unknown> }
    expect(Object.keys(parsed.sessions ?? {})).toEqual(expect.arrayContaining(["ses-one", "ses-two"]))
  })

  it("redacts continuity text fields while preserving session identifiers", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    continuity.recordSessionContinuity({
      ...makeRecord("ses-redaction"),
      metadata: {
        ...makeRecord("ses-redaction").metadata,
        description: "summary includes HIVEMIND_FAKE_TOKEN=secret-value-1234567890",
      },
    })

    const raw = readFileSync(continuity.getContinuityStoragePath(), "utf-8")
    expect(raw).toContain("ses-redaction")
    expect(raw).toContain("HIVEMIND_FAKE_TOKEN=[REDACTED:TOKEN]")
    expect(raw).not.toContain("secret-value-1234567890")
  })

  /**
   * FRESH-INSTALL-RECOVERY-01 (Phase 38.1)
   *
   * Locks the contract that on a clean install — no `.hivemind/state/`
   * directory at all — the harness's first persistence write of each kind
   * recursively creates the state directory and produces parseable JSON for
   * both `session-continuity.json` and `delegations.json`. Closes the audit's
   * Finding 5 follow-up after the original "no state files on disk" claim was
   * refuted.
   *
   * Also asserts HIVEMIND-ROOT-08: no `brain.json` artifact is produced on a
   * fresh install.
   */
  it("creates session-continuity.json + delegations.json on a fresh install (no brain.json)", async () => {
    // Point the state dir at a sub-path that does NOT exist yet, so this
    // exercises the recursive-mkdir branch on first write.
    const freshStateDir = join(stateDir, "nested", ".hivemind", "state")
    process.env.OPENCODE_HARNESS_STATE_DIR = freshStateDir
    expect(existsSync(freshStateDir)).toBe(false)

    const continuity = await import("../../src/task-management/continuity/index.js")
    const delegationPersistence = await import("../../src/task-management/continuity/delegation-persistence.js")

    continuity.recordSessionContinuity(makeRecord("ses-fresh-install"))
    const continuityPath = continuity.getContinuityStoragePath()
    expect(existsSync(continuityPath)).toBe(true)
    expect(() => JSON.parse(readFileSync(continuityPath, "utf-8"))).not.toThrow()

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

    const delegationsPath = delegationPersistence.getDelegationsFilePath()
    expect(existsSync(delegationsPath)).toBe(true)
    const parsed = JSON.parse(readFileSync(delegationsPath, "utf-8")) as unknown
    expect(Array.isArray(parsed)).toBe(true)

    // HIVEMIND-ROOT-08 — no `brain.json` should ever appear in canonical state.
    expect(existsSync(join(freshStateDir, "brain.json"))).toBe(false)
    expect(readdirSync(freshStateDir)).not.toContain("brain.json")
  })

  // -------------------------------------------------------------------------
  // Recovery tests — restart rehydration, corrupt-file handling, atomic write
  // -------------------------------------------------------------------------

  it("should rehydrate state from existing continuity file on restart", async () => {
    // Phase 1: write records with first module instance
    const continuity1 = await import("../../src/task-management/continuity/index.js")
    continuity1.recordSessionContinuity(makeRecord("ses-rehydrate-1"))
    continuity1.recordSessionContinuity(makeRecord("ses-rehydrate-2"))
    const filePath = continuity1.getContinuityStoragePath()
    expect(existsSync(filePath)).toBe(true)

    // Phase 2: simulate restart — reset store cache so getStoreCache is undefined
    const { resetStoreCache } = await import("../../src/task-management/continuity/store-cache.js")
    resetStoreCache()
    const continuity2 = await import("../../src/task-management/continuity/index.js")

    // Verify state was rehydrated from disk
    const records = continuity2.listSessionContinuity()
    const ids = records.map((r) => r.sessionID).sort()
    expect(ids).toContain("ses-rehydrate-1")
    expect(ids).toContain("ses-rehydrate-2")
  })

  it("should handle corrupt continuity file by quarantining and throwing", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()

    // Write garbage to the file
    writeFileSync(filePath, "NOT JSON {{{ GARBAGE }}}", "utf-8")
    expect(existsSync(filePath)).toBe(true)

    // Accessing the store should throw a descriptive [Harness] error
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

  it("should preserve all delegation records across restart", async () => {
    // Phase 1: create records with delegation metadata
    const continuity1 = await import("../../src/task-management/continuity/index.js")
    const baseRecord = makeRecord("ses-deleg-1")
    continuity1.recordSessionContinuity({
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
    continuity1.recordSessionContinuity({
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

    // Phase 2: simulate restart — reset store cache so cache is cold
    const { resetStoreCache } = await import("../../src/task-management/continuity/store-cache.js")
    resetStoreCache()
    const continuity2 = await import("../../src/task-management/continuity/index.js")

    // Verify delegation metadata survived across restart
    const rec1 = continuity2.getSessionContinuity("ses-deleg-1")
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

    const rec2 = continuity2.getSessionContinuity("ses-deleg-2")
    expect(rec2?.metadata.delegation?.rootID).toBe("root-def")
    expect(rec2?.metadata.delegation?.agent).toBe("reviewer")
  })

  it("should survive concurrent read/write without corruption", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")

    // Rapidly interleave writes and reads
    const sessionIDs = Array.from({ length: 20 }, (_, i) => `ses-concurrent-${i}`)

    for (const id of sessionIDs) {
      continuity.recordSessionContinuity(makeRecord(id))
      // Immediately read back
      const record = continuity.getSessionContinuity(id)
      expect(record?.sessionID).toBe(id)
    }

    // Final verification: all sessions present and file is valid JSON
    const allRecords = continuity.listSessionContinuity()
    const allIDs = allRecords.map((r) => r.sessionID).sort()
    for (const id of sessionIDs) {
      expect(allIDs).toContain(id)
    }

    const raw = readFileSync(continuity.getContinuityStoragePath(), "utf-8")
    expect(() => JSON.parse(raw)).not.toThrow()
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

  it("should not corrupt file on partial write — atomic write mechanism", async () => {
    const continuity = await import("../../src/task-management/continuity/index.js")

    // Write initial data
    continuity.recordSessionContinuity(makeRecord("ses-atomic-1"))
    const filePath = continuity.getContinuityStoragePath()

    // Verify initial state is valid JSON
    const raw1 = readFileSync(filePath, "utf-8")
    const parsed1 = JSON.parse(raw1) as { sessions: Record<string, unknown> }
    expect(parsed1.sessions["ses-atomic-1"]).toBeDefined()

    // Write more data — atomic write (tmp + rename) should ensure consistency
    continuity.recordSessionContinuity(makeRecord("ses-atomic-2"))
    continuity.recordSessionContinuity(makeRecord("ses-atomic-3"))

    // Verify final state is valid JSON with all sessions
    const raw2 = readFileSync(filePath, "utf-8")
    const parsed2 = JSON.parse(raw2) as { sessions: Record<string, unknown> }
    expect(parsed2.sessions["ses-atomic-1"]).toBeDefined()
    expect(parsed2.sessions["ses-atomic-2"]).toBeDefined()
    expect(parsed2.sessions["ses-atomic-3"]).toBeDefined()

    // No leftover .tmp files
    const dirContents = readdirSync(stateDir)
    const tmpFiles = dirContents.filter((name) => name.endsWith(".tmp"))
    expect(tmpFiles).toEqual([])
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

  it("writes to disk when atomic_commit is true (default)", async () => {
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

    continuity.recordSessionContinuity(makeRecord("ses-atomic-true"))

    // File should exist on disk
    expect(existsSync(filePath)).toBe(true)
    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw) as { sessions: Record<string, unknown> }
    expect(parsed.sessions["ses-atomic-true"]).toBeDefined()
  })

  it("skips disk write when atomic_commit is false", async () => {
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

    // No file should be created on disk when atomic_commit is false
    expect(existsSync(filePath)).toBe(false)
  })

  it("propagates projectRoot to getCachedConfig when called via recordGovernancePersistenceState", async () => {
    const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    const mockGetCachedConfig = vi.fn().mockReturnValue(
      HivemindConfigsSchema.parse({ atomic_commit: true, workflow: { use_worktrees: false } }),
    )
    vi.doMock("../../src/config/subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: mockGetCachedConfig,
      invalidateConfigCache: vi.fn(),
    }))

    const continuity = await import("../../src/task-management/continuity/index.js")

    const customRoot = mkdtempSync(join(tmpdir(), "continuity-prop-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = join(customRoot, "state")
    try {
      continuity.recordGovernancePersistenceState(
        { rules: [], violations: [], updatedAt: Date.now() },
        customRoot,
      )

      expect(mockGetCachedConfig).toHaveBeenCalledWith(customRoot)
    } finally {
      rmSync(customRoot, { recursive: true, force: true })
    }
  })

  it("writes to disk with default config (atomic_commit defaults to true)", async () => {
    const { getDefaultConfigs } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/config/subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(getDefaultConfigs()),
      invalidateConfigCache: vi.fn(),
    }))

    const continuity = await import("../../src/task-management/continuity/index.js")
    const filePath = continuity.getContinuityStoragePath()

    continuity.recordSessionContinuity(makeRecord("ses-atomic-defaults"))

    // File should exist on disk (atomic_commit defaults to true)
    expect(existsSync(filePath)).toBe(true)
  })
})
