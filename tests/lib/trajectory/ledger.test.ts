import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  attachTrajectoryEvidence,
  checkpointTrajectory,
  closeTrajectory,
  eventTrajectory,
  getTrajectoryLedgerPath,
  inspectTrajectoryLedger,
  traverseTrajectory,
} from "../../../src/lib/trajectory/index.js"

function tempProjectRoot(): string {
  return mkdtempSync(join(tmpdir(), "harness-trajectory-"))
}

describe("trajectory ledger", () => {
  it("stores evidence references in the canonical .hivemind state ledger without mutating runtime authorities", () => {
    const projectRoot = tempProjectRoot()

    try {
      const result = attachTrajectoryEvidence({
        projectRoot,
        trajectoryId: "traj-root",
        rootSessionId: "ses_root",
        sessionId: "ses_root",
        evidenceRefs: [
          ".hivemind/journal/2026-04-30.jsonl#L1",
          ".hivemind/state/delegations.json#delegation-1",
        ],
      })

      expect(result.trajectory.evidenceRefs).toEqual([
        ".hivemind/journal/2026-04-30.jsonl#L1",
        ".hivemind/state/delegations.json#delegation-1",
      ])
      expect(getTrajectoryLedgerPath(projectRoot)).toBe(join(projectRoot, ".hivemind", "state", "trajectory-ledger.json"))
      expect(existsSync(getTrajectoryLedgerPath(projectRoot))).toBe(true)
      expect(existsSync(join(projectRoot, ".hivemind", "state", "session-continuity.json"))).toBe(false)
      expect(existsSync(join(projectRoot, ".hivemind", "state", "delegations.json"))).toBe(false)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("records checkpoints, events, close status, and traverses root lineage", () => {
    const projectRoot = tempProjectRoot()

    try {
      attachTrajectoryEvidence({ projectRoot, trajectoryId: "root", rootSessionId: "ses_root", evidenceRef: "journal:root" })
      attachTrajectoryEvidence({ projectRoot, trajectoryId: "child", rootSessionId: "ses_root", parentTrajectoryId: "root", sessionId: "ses_child", evidenceRef: "delegation:child" })
      checkpointTrajectory({ projectRoot, trajectoryId: "child", checkpointId: "cp-1", summary: "Human verified recovery point", evidenceRefs: ["doc:cp"] })
      eventTrajectory({ projectRoot, trajectoryId: "child", eventId: "evt-1", eventType: "recovery", summary: "Recovery evidence captured", evidenceRefs: ["journal:evt"] })
      const closeResult = closeTrajectory({ projectRoot, trajectoryId: "child", summary: "Trajectory closed after verification" })
      const traversal = traverseTrajectory({ projectRoot, rootSessionId: "ses_root" })

      expect(closeResult.trajectory.status).toBe("closed")
      expect(closeResult.trajectory.checkpoints).toEqual([expect.objectContaining({ checkpointId: "cp-1" })])
      expect(closeResult.trajectory.events).toEqual([expect.objectContaining({ eventId: "evt-1", eventType: "recovery" })])
      expect(traversal.trajectories.map((trajectory) => trajectory.id)).toEqual(["root", "child"])
      expect(traversal.edges).toEqual([{ from: "root", to: "child" }])
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("quarantines corrupt ledgers instead of silently resetting evidence", () => {
    const projectRoot = tempProjectRoot()

    try {
      const ledgerPath = getTrajectoryLedgerPath(projectRoot)
      mkdirSync(join(projectRoot, ".hivemind", "state"), { recursive: true })
      writeFileSync(ledgerPath, "{not json", "utf-8")

      expect(() => inspectTrajectoryLedger({ projectRoot })).toThrow("Failed to parse trajectory ledger")
      expect(existsSync(ledgerPath)).toBe(false)
      expect(readdirSync(join(projectRoot, ".hivemind", "state")).some((entry) => entry.startsWith("trajectory-ledger.json.corrupt-"))).toBe(true)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
