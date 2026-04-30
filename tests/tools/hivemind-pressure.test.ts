import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createHivemindPressureTool } from "../../src/tools/hivemind-pressure.js"

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

describe("hivemind-pressure tool", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "hivemind-pressure-tool-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("classifies, detects, and inspects the tool catalog", async () => {
    const pressureTool = createHivemindPressureTool(root)

    const classification = parseResult(await pressureTool.execute({ action: "classify", score: 6 } as never, mockCtx))
    const decision = parseResult(await pressureTool.execute({ action: "detect", tier: 9, toolName: "delegate-task" } as never, mockCtx))
    const catalog = parseResult(await pressureTool.execute({ action: "inspect_tool_catalog" } as never, mockCtx))

    expect(classification).toMatchObject({ kind: "success", data: { tier: 6, band: "gated" } })
    expect(decision).toMatchObject({ kind: "success", data: { outcome: "block", tool: { name: "delegate-task" } } })
    expect(catalog.data).toMatchObject({ tools: expect.arrayContaining([expect.objectContaining({ name: "hivemind-pressure" })]) })
  })

  it("attaches pressure evidence only to the trajectory ledger", async () => {
    const pressureTool = createHivemindPressureTool(root)

    const raw = await pressureTool.execute({
      action: "attach_event",
      trajectoryId: "phase-56-traj",
      rootSessionId: "ses_root",
      eventId: "pressure-1",
      summary: "runtime pressure detected",
      tier: 6,
      toolName: "session-patch",
      evidenceRef: "event-tracker:ses_root",
    } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(result.data).toMatchObject({ event: { eventType: "runtime-pressure", evidenceRefs: ["event-tracker:ses_root"] } })
    expect(existsSync(join(root, ".hivemind", "state", "trajectory-ledger.json"))).toBe(true)
    expect(existsSync(join(root, ".hivemind", "state", "delegations.json"))).toBe(false)
    expect(existsSync(join(root, ".hivemind", "state", "session-continuity.json"))).toBe(false)
    expect(readFileSync(join(root, ".hivemind", "state", "trajectory-ledger.json"), "utf-8")).toContain("runtime-pressure")
  })
})
