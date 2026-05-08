/**
 * @fileoverview Tests for recovery state repairer (REC-04).
 *
 * Validates `repairRecoveryState` — restores or repairs corrupted/inconsistent
 * canonical state under `.hivemind/state/`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

let projectRoot: string

beforeEach(async () => {
  projectRoot = await mkdtemp(resolve(tmpdir(), "hivemind-recovery-repair-"))
  mkdirSync(resolve(projectRoot, ".hivemind", "state"), { recursive: true })
})

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true })
})

describe("repairRecoveryState", () => {
  it("quarantines corrupt continuity and writes fresh empty store", async () => {
    const stateDir = resolve(projectRoot, ".hivemind", "state")
    const continuityPath = resolve(stateDir, "session-continuity.json")
    writeFileSync(continuityPath, "{not valid", "utf-8")

    const { repairRecoveryState } = await import("../../../src/task-management/recovery/repair-state.js")
    const result = await repairRecoveryState({ sessionId: "any", projectRoot })

    expect(result.status).toBe("repaired")
    expect(result.recoveredFrom).toBe("quarantine-and-reset")
    expect(result.repairedFiles).toContain("session-continuity.json")
    const after = JSON.parse(readFileSync(continuityPath, "utf-8")) as { sessions: Record<string, unknown> }
    expect(after.sessions).toEqual({})
  })

  it("restores continuity from a checkpoint when one is provided", async () => {
    const checkpointDir = resolve(projectRoot, ".hivemind", "state", "checkpoints")
    mkdirSync(checkpointDir, { recursive: true })
    const checkpointPath = resolve(checkpointDir, "snap.json")
    writeFileSync(
      checkpointPath,
      JSON.stringify({
        sessionId: "kept",
        timestamp: new Date().toISOString(),
        stateVersion: "1",
        snapshot: { sessions: { kept: { sessionID: "kept" } } },
      }),
      "utf-8",
    )

    const { repairRecoveryState } = await import("../../../src/task-management/recovery/repair-state.js")
    const result = await repairRecoveryState({
      sessionId: "kept",
      projectRoot,
      checkpointPath,
    })

    expect(result.status).toBe("repaired")
    expect(result.recoveredFrom).toBe("checkpoint")
    expect(result.repairedFiles).toContain("session-continuity.json")
    const continuityPath = resolve(projectRoot, ".hivemind", "state", "session-continuity.json")
    const restored = JSON.parse(readFileSync(continuityPath, "utf-8")) as { sessions: Record<string, unknown> }
    expect(restored.sessions.kept).toBeDefined()
  })

  it("returns a no-op when state is healthy and no checkpoint is provided", async () => {
    const stateDir = resolve(projectRoot, ".hivemind", "state")
    writeFileSync(
      resolve(stateDir, "session-continuity.json"),
      JSON.stringify({ version: 1, sessions: { ok: { sessionID: "ok" } } }),
      "utf-8",
    )
    const { repairRecoveryState } = await import("../../../src/task-management/recovery/repair-state.js")
    const result = await repairRecoveryState({ sessionId: "ok", projectRoot })
    expect(result.status).toBe("noop")
    expect(result.repairedFiles).toEqual([])
  })

  it("rejects checkpoint paths outside the state directory", async () => {
    const stateDir = resolve(projectRoot, ".hivemind", "state")
    writeFileSync(resolve(stateDir, "session-continuity.json"), "{not valid", "utf-8")

    const { repairRecoveryState } = await import("../../../src/task-management/recovery/repair-state.js")
    await expect(
      repairRecoveryState({
        sessionId: "x",
        projectRoot,
        checkpointPath: "/etc/passwd",
      }),
    ).rejects.toThrow(/checkpoint/i)
  })

  it("returns failed when checkpoint file is unreadable", async () => {
    const stateDir = resolve(projectRoot, ".hivemind", "state")
    writeFileSync(resolve(stateDir, "session-continuity.json"), "{not valid", "utf-8")
    const checkpointDir = resolve(projectRoot, ".hivemind", "state", "checkpoints")
    mkdirSync(checkpointDir, { recursive: true })
    const ckpt = resolve(checkpointDir, "broken.json")
    writeFileSync(ckpt, "{also not valid", "utf-8")
    const { repairRecoveryState } = await import("../../../src/task-management/recovery/repair-state.js")
    const result = await repairRecoveryState({
      sessionId: "x",
      projectRoot,
      checkpointPath: ckpt,
    })
    expect(result.status).toBe("failed")
    expect(result.errors?.[0]).toBeDefined()
  })

  it("creates state directory if missing", async () => {
    await rm(resolve(projectRoot, ".hivemind"), { recursive: true, force: true })
    const { repairRecoveryState } = await import("../../../src/task-management/recovery/repair-state.js")
    const result = await repairRecoveryState({ sessionId: "fresh", projectRoot })
    expect(result.status === "repaired" || result.status === "noop").toBe(true)
    expect(existsSync(resolve(projectRoot, ".hivemind", "state"))).toBe(true)
  })
})
