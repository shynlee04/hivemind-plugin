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
    vi.doUnmock("node:fs")
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

  it("does not create delegations.json on disk (persistDelegations is no-op for file writes)", async () => {
    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")

    expect(() => persistence.persistDelegations([makeDelegation("outer")])).not.toThrow()

    // No file created on disk (REQ-P41D-01)
    expect(existsSync(persistence.getDelegationsFilePath())).toBe(false)
  })

  it("returns empty array from readPersistedDelegations even if corrupt file exists on disk", async () => {
    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    writeFileSync(persistence.getDelegationsFilePath(), "NOT VALID JSON {{{", "utf-8")

    // readPersistedDelegations returns [] regardless of file state (P41-D-01)
    expect(persistence.readPersistedDelegations()).toEqual([])
  })

  it("returns empty array from readPersistedDelegations regardless of file content shape", async () => {
    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    writeFileSync(persistence.getDelegationsFilePath(), JSON.stringify({ invalid: true }), "utf-8")

    expect(persistence.readPersistedDelegations()).toEqual([])
  })

  it("returns empty array from readPersistedDelegations even with valid delegations on disk", async () => {
    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    writeFileSync(
      persistence.getDelegationsFilePath(),
      `${JSON.stringify([{ ...makeDelegation("invalid-status"), status: "unknown-success" }])}\n`,
      "utf-8",
    )

    const delegations = persistence.readPersistedDelegations()
    expect(delegations).toEqual([])
  })

  it("does not persist delegations to delegations.json (file not created)", async () => {
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

    // No file written to disk — persistence is no-op (P41-D-01)
    expect(existsSync(persistence.getDelegationsFilePath())).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// G-4: Delegation persistence is unconditional (commit_docs gate removed)
// ---------------------------------------------------------------------------

describe("delegation persistence unconditional (G-4)", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.resetModules()
    vi.doUnmock("node:fs")
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "delegation-unconditional-"))
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

  it("does not create delegations.json on disk regardless of commit_docs config (P41-D-01)", async () => {
    const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/config/subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(
        HivemindConfigsSchema.parse({ commit_docs: false, workflow: { use_worktrees: false } }),
      ),
      invalidateConfigCache: vi.fn(),
    }))

    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    const filePath = persistence.getDelegationsFilePath()

    persistence.persistDelegations([makeDelegation("del-g4-test")])

    // File is NOT written to disk — persistDelegations no longer produces delegations.json
    expect(existsSync(filePath)).toBe(false)
  })

  it("does not create delegations.json with default config (persistStore is no-op)", async () => {
    const { getDefaultConfigs } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
    vi.doMock("../../src/config/subscriber.js", () => ({
      getConfig: vi.fn(),
      getCachedConfig: vi.fn().mockReturnValue(getDefaultConfigs()),
      invalidateConfigCache: vi.fn(),
    }))

    const persistence = await import("../../src/task-management/continuity/delegation-persistence.js")
    const filePath = persistence.getDelegationsFilePath()

    persistence.persistDelegations([makeDelegation("del-commit-defaults")])

    // File is NOT created on disk (P41-D-01)
    expect(existsSync(filePath)).toBe(false)
  })
})
