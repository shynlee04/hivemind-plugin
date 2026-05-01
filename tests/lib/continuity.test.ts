import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Delegation, SessionContinuityRecord } from "../../src/lib/types.js"

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
    vi.unmock("node:fs")
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
    const continuity = await import("../../src/lib/continuity.js")
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

    const continuity = await import("../../src/lib/continuity.js")
    continuity.recordSessionContinuity(makeRecord("ses-one"))
    continuity.recordSessionContinuity(makeRecord("ses-two"))

    expect(tempPaths).toHaveLength(2)
    expect(new Set(tempPaths).size).toBe(2)
    expect(tempPaths.every((name) => name !== "session-continuity.json.tmp")).toBe(true)
    const parsed = JSON.parse(readFileSync(continuity.getContinuityStoragePath(), "utf-8")) as { sessions?: Record<string, unknown> }
    expect(Object.keys(parsed.sessions ?? {})).toEqual(expect.arrayContaining(["ses-one", "ses-two"]))
  })

  it("redacts continuity text fields while preserving session identifiers", async () => {
    const continuity = await import("../../src/lib/continuity.js")
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

    const continuity = await import("../../src/lib/continuity.js")
    const delegationPersistence = await import("../../src/lib/delegation-persistence.js")

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
})
