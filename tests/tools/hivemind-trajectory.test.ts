import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createHivemindTrajectoryTool } from "../../src/tools/hivemind-trajectory.js"

const mockCtx = {
  sessionID: "parent-session",
  agent: "gsd-executor",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

describe("hivemind-trajectory tool", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "hivemind-trajectory-tool-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("attaches evidence, checkpoints, emits events, traverses, inspects, and closes trajectories", async () => {
    const tool = createHivemindTrajectoryTool(root)

    const attach = parseResult(await tool.execute({ action: "attach", trajectoryId: "traj-1", rootSessionId: "ses_root", evidenceRef: "journal:1" } as never, mockCtx))
    const checkpoint = parseResult(await tool.execute({ action: "checkpoint", trajectoryId: "traj-1", checkpointId: "cp-1", summary: "checkpoint", evidenceRefs: ["doc:1"] } as never, mockCtx))
    const event = parseResult(await tool.execute({ action: "event", trajectoryId: "traj-1", eventId: "evt-1", eventType: "note", summary: "event", evidenceRefs: ["journal:2"] } as never, mockCtx))
    const traverse = parseResult(await tool.execute({ action: "traverse", rootSessionId: "ses_root" } as never, mockCtx))
    const inspect = parseResult(await tool.execute({ action: "inspect", trajectoryId: "traj-1" } as never, mockCtx))
    const close = parseResult(await tool.execute({ action: "close", trajectoryId: "traj-1", summary: "done" } as never, mockCtx))

    expect(attach.kind).toBe("success")
    expect(checkpoint.kind).toBe("success")
    expect(event.kind).toBe("success")
    expect(traverse.kind).toBe("success")
    expect(inspect.data).toMatchObject({ trajectory: { id: "traj-1", evidenceRefs: ["journal:1", "doc:1", "journal:2"] } })
    expect(close.data).toMatchObject({ trajectory: { id: "traj-1", status: "closed" } })
    expect(existsSync(join(root, ".hivemind", "state", "trajectory-ledger.json"))).toBe(true)
    expect(existsSync(join(root, ".hivemind", "state", "delegations.json"))).toBe(false)
    expect(readFileSync(join(root, ".hivemind", "state", "trajectory-ledger.json"), "utf-8")).toContain("journal:1")
  })

  it("returns error envelopes for invalid action payloads", async () => {
    const tool = createHivemindTrajectoryTool(root)
    const raw = await tool.execute({ action: "checkpoint", trajectoryId: "traj-1" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(String(result.message)).toContain("summary")
  })
})
