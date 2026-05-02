/**
 * @fileoverview Integration tests for the recovery-engine facade (Phase 66).
 *
 * Exercises the composite end-to-end flow: classify → assess → checkpoint →
 * repair, ensuring the four REC requirements compose correctly.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createRecoveryEngine } from "../../src/lib/recovery-engine.js"

let projectRoot: string

beforeEach(async () => {
  projectRoot = await mkdtemp(resolve(tmpdir(), "hivemind-recovery-engine-"))
  mkdirSync(resolve(projectRoot, ".hivemind", "state"), { recursive: true })
})

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true })
})

describe("recovery-engine facade", () => {
  it("exposes all four REC operations", () => {
    const engine = createRecoveryEngine()
    expect(typeof engine.classifyFailure).toBe("function")
    expect(typeof engine.assessRecoveryState).toBe("function")
    expect(typeof engine.createRecoveryCheckpoint).toBe("function")
    expect(typeof engine.repairRecoveryState).toBe("function")
  })

  it("composes assess → checkpoint → repair end-to-end", async () => {
    const stateDir = resolve(projectRoot, ".hivemind", "state")
    writeFileSync(
      resolve(stateDir, "session-continuity.json"),
      JSON.stringify({ version: 1, sessions: { eng: { sessionID: "eng" } } }),
      "utf-8",
    )

    const engine = createRecoveryEngine()
    const assessment = await engine.assessRecoveryState("eng", projectRoot)
    expect(assessment.severity).toBe("recoverable")
    expect(assessment.recommendedAction).toBe("retry")

    const checkpoint = await engine.createRecoveryCheckpoint("eng", projectRoot)
    expect(checkpoint.snapshotPath).toContain("checkpoints")

    writeFileSync(resolve(stateDir, "session-continuity.json"), "{not valid", "utf-8")

    const restored = await engine.repairRecoveryState({
      sessionId: "eng",
      projectRoot,
      checkpointPath: checkpoint.snapshotPath,
    })
    expect(restored.status).toBe("repaired")
    expect(restored.recoveredFrom).toBe("checkpoint")

    const after = JSON.parse(
      readFileSync(resolve(stateDir, "session-continuity.json"), "utf-8"),
    ) as { sessions: Record<string, unknown> }
    expect(after.sessions.eng).toBeDefined()
  })

  it("classifyFailure routes 'EACCES' to permission-denied", () => {
    const engine = createRecoveryEngine()
    expect(engine.classifyFailure("EACCES: permission denied")).toBe("permission-denied")
  })
})
