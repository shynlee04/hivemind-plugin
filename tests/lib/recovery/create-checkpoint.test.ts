/**
 * @fileoverview Tests for recovery checkpoint creator (REC-03).
 *
 * Validates `createRecoveryCheckpoint` — captures a snapshot of canonical
 * harness state for later restoration.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

let projectRoot: string

beforeEach(async () => {
  projectRoot = await mkdtemp(resolve(tmpdir(), "hivemind-recovery-checkpoint-"))
  mkdirSync(resolve(projectRoot, ".hivemind", "state"), { recursive: true })
})

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true })
})

describe("createRecoveryCheckpoint", () => {
  it("persists a checkpoint that captures continuity contents", async () => {
    seedContinuity(projectRoot, {
      sessions: { "alpha": { sessionID: "alpha", createdAt: 1, updatedAt: 2 } },
    })

    const { createRecoveryCheckpoint } = await import("../../../src/task-management/recovery/create-checkpoint.js")
    const checkpoint = await createRecoveryCheckpoint("alpha", projectRoot)

    expect(checkpoint.sessionId).toBe("alpha")
    expect(checkpoint.stateVersion).toBe("1")
    expect(checkpoint.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/)
    expect(existsSync(checkpoint.snapshotPath)).toBe(true)

    const persisted = JSON.parse(readFileSync(checkpoint.snapshotPath, "utf-8")) as {
      sessionId: string
      timestamp: string
      stateVersion: string
      snapshot: { sessions?: Record<string, unknown> }
    }
    expect(persisted.sessionId).toBe("alpha")
    expect(persisted.snapshot.sessions?.alpha).toBeDefined()
  })

  it("places the checkpoint under .hivemind/state/checkpoints/", async () => {
    seedContinuity(projectRoot, { sessions: { beta: { sessionID: "beta" } } })
    const { createRecoveryCheckpoint } = await import("../../../src/task-management/recovery/create-checkpoint.js")
    const checkpoint = await createRecoveryCheckpoint("beta", projectRoot)
    expect(checkpoint.snapshotPath).toContain(`${".hivemind"}`)
    expect(checkpoint.snapshotPath).toContain("checkpoints")
    expect(checkpoint.snapshotPath.endsWith(".json")).toBe(true)
  })

  it("captures empty snapshot when no continuity file exists", async () => {
    const { createRecoveryCheckpoint } = await import("../../../src/task-management/recovery/create-checkpoint.js")
    const checkpoint = await createRecoveryCheckpoint("ghost", projectRoot)
    const persisted = JSON.parse(readFileSync(checkpoint.snapshotPath, "utf-8")) as {
      snapshot: { sessions: Record<string, unknown> }
    }
    expect(persisted.snapshot.sessions).toEqual({})
  })

  it("creates unique checkpoint paths for back-to-back calls", async () => {
    seedContinuity(projectRoot, { sessions: {} })
    const { createRecoveryCheckpoint } = await import("../../../src/task-management/recovery/create-checkpoint.js")
    const a = await createRecoveryCheckpoint("g", projectRoot)
    const b = await createRecoveryCheckpoint("g", projectRoot)
    expect(a.snapshotPath).not.toBe(b.snapshotPath)
  })

  it("rejects path traversal in projectRoot", async () => {
    const { createRecoveryCheckpoint } = await import("../../../src/task-management/recovery/create-checkpoint.js")
    await expect(
      createRecoveryCheckpoint("../escape", projectRoot),
    ).rejects.toThrow(/sessionId/i)
  })

  it("emits an ISO-8601 timestamp", async () => {
    seedContinuity(projectRoot, { sessions: {} })
    const { createRecoveryCheckpoint } = await import("../../../src/task-management/recovery/create-checkpoint.js")
    const checkpoint = await createRecoveryCheckpoint("ts-check", projectRoot)
    expect(() => new Date(checkpoint.timestamp).toISOString()).not.toThrow()
  })
})

function seedContinuity(root: string, payload: Record<string, unknown>): void {
  const stateDir = resolve(root, ".hivemind", "state")
  mkdirSync(stateDir, { recursive: true })
  writeFileSync(
    resolve(stateDir, "session-continuity.json"),
    JSON.stringify({ version: 1, ...payload }, null, 2),
    "utf-8",
  )
}
