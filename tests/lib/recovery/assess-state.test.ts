/**
 * @fileoverview Tests for recovery state assessor (REC-02).
 *
 * Validates `assessRecoveryState` — evaluates a session's persisted state and
 * recommends a recovery action.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

let projectRoot: string

beforeEach(async () => {
  projectRoot = await mkdtemp(resolve(tmpdir(), "hivemind-recovery-assess-"))
  mkdirSync(resolve(projectRoot, ".hivemind", "state"), { recursive: true })
})

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true })
})

describe("assessRecoveryState", () => {
  it("flags a missing-session scenario as fresh-start", async () => {
    const { assessRecoveryState } = await import("../../../src/task-management/recovery/assess-state.js")
    const assessment = await assessRecoveryState("missing-session", projectRoot)
    expect(assessment.sessionId).toBe("missing-session")
    expect(assessment.failureClass).toBe("unknown")
    expect(assessment.severity).toBe("unrecoverable")
    expect(assessment.recommendedAction).toBe("fresh-start")
    expect(assessment.affectedResources).toEqual([])
  })

  it("returns recoverable + retry when continuity has session and no error", async () => {
    seedContinuity(projectRoot, {
      sessions: { "alive-session": minimalSessionRecord("alive-session") },
    })
    const { assessRecoveryState } = await import("../../../src/task-management/recovery/assess-state.js")
    const assessment = await assessRecoveryState("alive-session", projectRoot)
    expect(assessment.failureClass).toBe("unknown")
    expect(assessment.severity).toBe("recoverable")
    expect(assessment.recommendedAction).toBe("retry")
    expect(assessment.affectedResources).toContain("session-continuity.json")
  })

  it("classifies state-corruption when continuity file is corrupt JSON", async () => {
    const stateDir = resolve(projectRoot, ".hivemind", "state")
    writeFileSync(resolve(stateDir, "session-continuity.json"), "{not valid json", "utf-8")
    const { assessRecoveryState } = await import("../../../src/task-management/recovery/assess-state.js")
    const assessment = await assessRecoveryState("any-session", projectRoot)
    expect(assessment.failureClass).toBe("state-corruption")
    expect(assessment.severity).toBe("partial-loss")
    expect(assessment.recommendedAction).toBe("checkpoint-restore")
    expect(assessment.affectedResources).toContain("session-continuity.json")
  })

  it("recommends checkpoint-restore when an existing checkpoint matches the session", async () => {
    seedContinuity(projectRoot, { sessions: {} })
    const checkpointDir = resolve(projectRoot, ".hivemind", "state", "checkpoints")
    mkdirSync(checkpointDir, { recursive: true })
    writeFileSync(
      resolve(checkpointDir, "checkpoint-with-data.json"),
      JSON.stringify({
        sessionId: "checkpoint-session",
        timestamp: new Date().toISOString(),
        stateVersion: "1",
        snapshot: { sessions: { "checkpoint-session": minimalSessionRecord("checkpoint-session") } },
      }),
      "utf-8",
    )
    const { assessRecoveryState } = await import("../../../src/task-management/recovery/assess-state.js")
    const assessment = await assessRecoveryState("checkpoint-session", projectRoot)
    expect(assessment.severity).toBe("partial-loss")
    expect(assessment.recommendedAction).toBe("checkpoint-restore")
    expect(assessment.affectedResources).toEqual(expect.arrayContaining([
      expect.stringContaining("checkpoint"),
    ]))
  })

  it("returns manual-intervention when no recovery path is viable", async () => {
    const stateDir = resolve(projectRoot, ".hivemind", "state")
    writeFileSync(resolve(stateDir, "session-continuity.json"), "{not valid json", "utf-8")
    const { assessRecoveryState } = await import("../../../src/task-management/recovery/assess-state.js")
    const assessment = await assessRecoveryState("ghost-session", projectRoot, {
      considerCheckpoints: false,
    })
    expect(assessment.severity).toBe("unrecoverable")
    expect(assessment.recommendedAction).toBe("manual-intervention")
  })
})

function seedContinuity(root: string, payload: Record<string, unknown>): void {
  const stateDir = resolve(root, ".hivemind", "state")
  mkdirSync(stateDir, { recursive: true })
  const file = resolve(stateDir, "session-continuity.json")
  writeFileSync(file, JSON.stringify({ version: 1, ...payload }, null, 2), "utf-8")
}

function minimalSessionRecord(sessionID: string): Record<string, unknown> {
  return {
    sessionID,
    parentID: undefined,
    rootSessionID: sessionID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: { recordedAt: Date.now() },
  }
}
