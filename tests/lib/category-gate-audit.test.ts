import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("category gate audit", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.resetModules()
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "category-gate-audit-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    vi.resetModules()
    if (previousStateDir === undefined) delete process.env.OPENCODE_HARNESS_STATE_DIR
    else process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    rmSync(stateDir, { recursive: true, force: true })
  })

  it("persists compact category gate deny evidence", async () => {
    const audit = await import("../../src/lib/category-gate-audit.js")
    const continuity = await import("../../src/lib/continuity.js")

    expect(audit.recordCategoryGateDeny({
      callerSessionId: "ses-parent",
      requestedAgent: "critic",
      requestedCategory: "review",
      surface: "agent-delegation",
      denyReason: "category \"review\" cannot use write-capable tools",
    })).toBe(true)

    expect(continuity.getGovernancePersistenceState().violations).toEqual([
      expect.objectContaining({
        ruleId: "category-gate",
        sessionID: "ses-parent",
        detail: "category \"review\" cannot use write-capable tools",
        escalation: expect.objectContaining({ requestedAgent: "critic", requestedCategory: "review" }),
      }),
    ])
  })
})
