import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { SessionContinuityRecord } from "../../src/lib/types.js"

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
})
