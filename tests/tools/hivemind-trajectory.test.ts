import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createHivemindTrajectoryTool } from "../../src/tools/hivemind/hivemind-trajectory.js"

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

  it("action='create' with phaseNumber + rootSessionId creates phase trajectory", async () => {
    const tool = createHivemindTrajectoryTool(root)
    const result = parseResult(await tool.execute({
      action: "create",
      phaseNumber: "25.5",
      rootSessionId: "ses_root",
    } as never, mockCtx))
    expect(result.kind).toBe("success")
    const data = result.data as { trajectory: { id: string; status: string } }
    expect(data.trajectory.id).toBe("traj-phase-25.5")
    expect(data.trajectory.status).toBe("planning")
  })

  it("action='traverse' with depth='summary' returns summary projection", async () => {
    const tool = createHivemindTrajectoryTool(root)
    // Create trajectory first
    await tool.execute({ action: "create", phaseNumber: "25.5", rootSessionId: "ses_root" } as never, mockCtx)
    // Traverse with summary depth
    const result = parseResult(await tool.execute({
      action: "traverse",
      trajectoryId: "traj-phase-25.5",
      depth: "summary",
    } as never, mockCtx))
    expect(result.kind).toBe("success")
    expect((result.data as Record<string, unknown>).summaries).toBeDefined()
  })

  it("action='traverse' with depth='detailed' returns detailed projection", async () => {
    const tool = createHivemindTrajectoryTool(root)
    await tool.execute({ action: "create", phaseNumber: "25.5", rootSessionId: "ses_root" } as never, mockCtx)
    const result = parseResult(await tool.execute({
      action: "traverse",
      trajectoryId: "traj-phase-25.5",
      depth: "detailed",
    } as never, mockCtx))
    expect(result.kind).toBe("success")
    expect((result.data as Record<string, unknown>).trajectories).toBeDefined()
  })

  it("action='traverse' with depth='full' returns full data", async () => {
    const tool = createHivemindTrajectoryTool(root)
    await tool.execute({ action: "create", phaseNumber: "25.5", rootSessionId: "ses_root" } as never, mockCtx)
    const result = parseResult(await tool.execute({
      action: "traverse",
      trajectoryId: "traj-phase-25.5",
      depth: "full",
    } as never, mockCtx))
    expect(result.kind).toBe("success")
    const data = result.data as { trajectories: Array<Record<string, unknown>> }
    expect(data.trajectories).toBeDefined()
    expect(data.trajectories[0]!.events).toBeDefined()
  })

  it("action='event' calls event on trajectory", async () => {
    const tool = createHivemindTrajectoryTool(root)
    await tool.execute({ action: "create", phaseNumber: "25.5", rootSessionId: "ses_root" } as never, mockCtx)
    const result = parseResult(await tool.execute({
      action: "event",
      trajectoryId: "traj-phase-25.5",
      eventType: "note",
      summary: "test milestone",
    } as never, mockCtx))
    expect(result.kind).toBe("success")
  })

  it("action='close' closes trajectory", async () => {
    const tool = createHivemindTrajectoryTool(root)
    await tool.execute({ action: "create", phaseNumber: "25.5", rootSessionId: "ses_root" } as never, mockCtx)
    const result = parseResult(await tool.execute({
      action: "close",
      trajectoryId: "traj-phase-25.5",
      summary: "phase complete",
    } as never, mockCtx))
    expect(result.kind).toBe("success")
    const data = result.data as { trajectory: { status: string } }
    expect(data.trajectory.status).toBe("closed")
  })

  it("existing operations still work (attach, checkpoint, inspect)", async () => {
    const tool = createHivemindTrajectoryTool(root)
    const attach = parseResult(await tool.execute({ action: "attach", trajectoryId: "traj-1", rootSessionId: "ses_root", evidenceRef: "journal:1" } as never, mockCtx))
    const checkpoint = parseResult(await tool.execute({ action: "checkpoint", trajectoryId: "traj-1", checkpointId: "cp-1", summary: "checkpoint" } as never, mockCtx))
    const inspect = parseResult(await tool.execute({ action: "inspect", trajectoryId: "traj-1" } as never, mockCtx))

    expect(attach.kind).toBe("success")
    expect(checkpoint.kind).toBe("success")
    expect(inspect.kind).toBe("success")
    expect(existsSync(join(root, ".hivemind", "state", "trajectory-ledger.json"))).toBe(true)
  })
})
