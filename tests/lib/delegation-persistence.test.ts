import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Delegation } from "../../src/shared/types.js"

function makeDelegation(id: string): Delegation {
  return {
    id,
    parentSessionId: `parent-${id}`,
    childSessionId: `child-${id}`,
    agent: "builder",
    status: "dispatched",
    createdAt: Date.now(),
    lastMessageCount: 0,
    stablePollCount: 0,
    lastMessageCountChangeAt: Date.now(),
    executionMode: "sdk",
    workingDirectory: process.cwd(),
    queueKey: "agent:builder",
    nestingDepth: 1,
  }
}

describe("delegation persistence", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.resetModules()
    vi.unmock("node:fs")
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "delegation-persistence-"))
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

  it("does not throw ENOENT when persistence writes overlap the same target file", async () => {
    let nestedPersist: ((delegations: Delegation[]) => void) | undefined
    let triggeredNestedWrite = false

    vi.doMock("node:fs", async () => {
      const actual = await vi.importActual<typeof import("node:fs")>("node:fs")
      return {
        ...actual,
        writeFileSync: vi.fn<typeof actual.writeFileSync>((...args) => {
          actual.writeFileSync(...args)
          const [file] = args
          const filePath = String(file)
          if (!triggeredNestedWrite && filePath.includes("delegations.json") && filePath.endsWith(".tmp")) {
            triggeredNestedWrite = true
            nestedPersist?.([makeDelegation("nested")])
          }
        }),
      }
    })

    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    nestedPersist = persistence.persistDelegations

    expect(() => persistence.persistDelegations([makeDelegation("outer")])).not.toThrow()

    const persisted = JSON.parse(readFileSync(persistence.getDelegationsFilePath(), "utf-8")) as Delegation[]
    expect(persisted).toEqual(expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]))
  })

  it("quarantines corrupt delegations.json and throws a visible harness error", async () => {
    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    writeFileSync(persistence.getDelegationsFilePath(), "NOT VALID JSON {{{", "utf-8")

    expect(() => persistence.readPersistedDelegations()).toThrow(/^\[Harness\]/)
    expect(existsSync(persistence.getDelegationsFilePath())).toBe(false)
    expect(readdirSync(stateDir).some((name) => name.startsWith("delegations.json.corrupt-"))).toBe(true)
  })

  it("reports non-array delegations.json as invalid persisted shape", async () => {
    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    writeFileSync(persistence.getDelegationsFilePath(), JSON.stringify({ invalid: true }), "utf-8")

    expect(() => persistence.readPersistedDelegations()).toThrow(/^\[Harness\].*array/)
  })

  it("normalizes invalid persisted status values to explicit error metadata", async () => {
    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    writeFileSync(
      persistence.getDelegationsFilePath(),
      `${JSON.stringify([{ ...makeDelegation("invalid-status"), status: "unknown-success" }])}\n`,
      "utf-8",
    )

    const delegations = persistence.readPersistedDelegations()
    expect(delegations[0]).toEqual(expect.objectContaining({
      status: "error",
      terminalKind: "error",
      error: expect.stringContaining("Invalid persisted delegation status"),
    }))
  })

  it("redacts delegation result, error, and fallbackReason while preserving operational identifiers", async () => {
    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    persistence.persistDelegations([
      {
        ...makeDelegation("redacted"),
        parentSessionId: "ses-parent-redacted",
        childSessionId: "ses-child-redacted",
        queueKey: "category:command",
        ptySessionId: "pty-redacted",
        result: "OPENAI_API_KEY=sk-test-123",
        error: "Authorization: Bearer abc.def.ghi",
        fallbackReason: "PASSWORD=hunter2",
      },
    ])

    const raw = readFileSync(persistence.getDelegationsFilePath(), "utf-8")
    expect(raw).toContain("OPENAI_API_KEY=[REDACTED:API_KEY]")
    expect(raw).toContain("Authorization: Bearer [REDACTED:TOKEN]")
    expect(raw).toContain("PASSWORD=[REDACTED:PASSWORD]")
    expect(raw).toContain("ses-parent-redacted")
    expect(raw).toContain("ses-child-redacted")
    expect(raw).toContain("category:command")
    expect(raw).toContain("pty-redacted")
    expect(raw).not.toContain("sk-test-123")
    expect(raw).not.toContain("abc.def.ghi")
    expect(raw).not.toContain("hunter2")
  })
})

// ---------------------------------------------------------------------------
// CA-03: commit_docs toggle
// ---------------------------------------------------------------------------

describe("commit_docs toggle", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.resetModules()
    vi.unmock("node:fs")
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "delegation-commit-docs-"))
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

  it("writes delegations.json to disk when commit_docs is true (default)", async () => {
    const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/lib/config-subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(
        HivemindConfigsSchema.parse({ commit_docs: true, workflow: { use_worktrees: false } }),
      ),
      invalidateConfigCache: vi.fn(),
    }))

    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    const filePath = persistence.getDelegationsFilePath()

    persistence.persistDelegations([makeDelegation("del-commit-true")])

    // File should exist on disk
    expect(existsSync(filePath)).toBe(true)
    const persisted = JSON.parse(readFileSync(filePath, "utf-8")) as Delegation[]
    expect(persisted).toEqual(expect.arrayContaining([expect.objectContaining({ id: "del-commit-true" })]))
  })

  it("skips disk write when commit_docs is false", async () => {
    const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/lib/config-subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(
        HivemindConfigsSchema.parse({ commit_docs: false, workflow: { use_worktrees: false } }),
      ),
      invalidateConfigCache: vi.fn(),
    }))

    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    const filePath = persistence.getDelegationsFilePath()

    persistence.persistDelegations([makeDelegation("del-commit-false")])

    // No file should be created on disk when commit_docs is false
    expect(existsSync(filePath)).toBe(false)
  })

  it("writes to disk with default config (commit_docs defaults to true)", async () => {
    const { getDefaultConfigs } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/lib/config-subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(getDefaultConfigs()),
      invalidateConfigCache: vi.fn(),
    }))

    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    const filePath = persistence.getDelegationsFilePath()

    persistence.persistDelegations([makeDelegation("del-commit-defaults")])

    // File should exist on disk (commit_docs defaults to true)
    expect(existsSync(filePath)).toBe(true)
  })
})
