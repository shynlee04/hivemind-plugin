import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  attachTrajectoryEvidence,
  checkpointTrajectory,
  closeTrajectory,
  createTrajectoryLedger,
  eventTrajectory,
  inspectTrajectoryLedger,
  traverseTrajectory,
} from "../../../src/task-management/trajectory/store-operations.js"

import { readTrajectoryLedger, writeTrajectoryLedger } from "../../../src/task-management/trajectory/ledger.js"

function makeRoot(): string {
  return join(tmpdir(), `trajectory-store-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

function seedTrajectory(root: string, id = "traj-1", rootSessionId = "ses-root"): void {
  const ledger = readTrajectoryLedger(root)
  ledger.trajectories[id] = {
    id,
    rootSessionId,
    sessionId: null,
    parentTrajectoryId: null,
    status: "planning",
    evidenceRefs: [],
    checkpoints: [],
    events: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  writeTrajectoryLedger(root, ledger)
}

function seedClosedTrajectory(root: string, id = "traj-closed", rootSessionId = "ses-root"): void {
  const ledger = readTrajectoryLedger(root)
  ledger.trajectories[id] = {
    id,
    rootSessionId,
    sessionId: null,
    parentTrajectoryId: null,
    status: "closed",
    evidenceRefs: ["existing-ref"],
    checkpoints: [],
    events: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    closeSummary: "closed for testing",
  }
  writeTrajectoryLedger(root, ledger)
}

describe("trajectory store operations", () => {
  let root: string

  beforeEach(() => {
    root = makeRoot()
    mkdirSync(root, { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("inspectTrajectoryLedger returns empty ledger when no file exists", () => {
    const { ledger } = inspectTrajectoryLedger({ projectRoot: root })
    expect(ledger.version).toBe(1)
    expect(Object.keys(ledger.trajectories)).toHaveLength(0)
  })

  it("inspectTrajectoryLedger returns specific trajectory when trajectoryId provided", () => {
    seedTrajectory(root, "traj-1", "ses-root")
    const { trajectory } = inspectTrajectoryLedger({ projectRoot: root, trajectoryId: "traj-1" })
    expect(trajectory).toBeDefined()
    expect(trajectory!.id).toBe("traj-1")
  })

  it("attachTrajectoryEvidence creates trajectory if not exists", () => {
    const { trajectory } = attachTrajectoryEvidence({
      projectRoot: root,
      trajectoryId: "traj-new",
      rootSessionId: "ses-root",
      evidenceRef: "ref-1",
    })
    expect(trajectory.id).toBe("traj-new")
    expect(trajectory.evidenceRefs).toContain("ref-1")
  })

  it("attachTrajectoryEvidence merges evidence refs (deduplicates)", () => {
    seedTrajectory(root, "traj-1", "ses-root")
    attachTrajectoryEvidence({ projectRoot: root, trajectoryId: "traj-1", evidenceRef: "ref-1" })
    const { trajectory } = attachTrajectoryEvidence({ projectRoot: root, trajectoryId: "traj-1", evidenceRef: "ref-1" })
    expect(trajectory.evidenceRefs.filter((r: string) => r === "ref-1")).toHaveLength(1)
  })

  it("eventTrajectory creates event with auto-generated eventId", () => {
    seedTrajectory(root, "traj-1", "ses-root")
    const { event } = eventTrajectory({
      projectRoot: root,
      trajectoryId: "traj-1",
      eventType: "recovery",
      summary: "test event",
    })
    expect(event.eventId).toMatch(/^event-/)
    expect(event.eventType).toBe("recovery")
    expect(event.summary).toBe("test event")
  })

  it("eventTrajectory preserves custom eventId when provided", () => {
    seedTrajectory(root, "traj-1", "ses-root")
    const { event } = eventTrajectory({
      projectRoot: root,
      trajectoryId: "traj-1",
      eventId: "custom-event-1",
      eventType: "recovery",
      summary: "test event",
    })
    expect(event.eventId).toBe("custom-event-1")
  })

  it("checkpointTrajectory creates checkpoint with auto-generated checkpointId", () => {
    seedTrajectory(root, "traj-1", "ses-root")
    const { checkpoint } = checkpointTrajectory({
      projectRoot: root,
      trajectoryId: "traj-1",
      summary: "test checkpoint",
    })
    expect(checkpoint.checkpointId).toMatch(/^checkpoint-/)
    expect(checkpoint.summary).toBe("test checkpoint")
  })

  it("closeTrajectory sets status to 'closed'", () => {
    seedTrajectory(root, "traj-1", "ses-root")
    const { trajectory } = closeTrajectory({ projectRoot: root, trajectoryId: "traj-1" })
    expect(trajectory.status).toBe("closed")
  })

  it("closeTrajectory throws for non-existent trajectory", () => {
    expect(() => closeTrajectory({ projectRoot: root, trajectoryId: "nonexistent" })).toThrow("[Harness]")
  })

  it("traverseTrajectory filters by rootSessionId", () => {
    seedTrajectory(root, "traj-1", "ses-root")
    seedTrajectory(root, "traj-2", "ses-other")
    const result = traverseTrajectory({ projectRoot: root, rootSessionId: "ses-root" })
    expect(result.trajectories).toHaveLength(1)
    expect(result.trajectories[0]!.rootSessionId).toBe("ses-root")
  })

  it("traverseTrajectory filters by sessionId", () => {
    const ledger = readTrajectoryLedger(root)
    ledger.trajectories["traj-1"] = {
      id: "traj-1",
      rootSessionId: "ses-root",
      sessionId: "ses-concrete",
      parentTrajectoryId: null,
      status: "planning",
      evidenceRefs: [],
      checkpoints: [],
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    writeTrajectoryLedger(root, ledger)

    const result = traverseTrajectory({ projectRoot: root, sessionId: "ses-concrete" })
    expect(result.trajectories).toHaveLength(1)
    expect(result.trajectories[0]!.sessionId).toBe("ses-concrete")
  })

  it("traverseTrajectory filters by trajectoryId (includes children)", () => {
    const ledger = readTrajectoryLedger(root)
    ledger.trajectories["parent"] = {
      id: "parent",
      rootSessionId: "ses-root",
      sessionId: null,
      parentTrajectoryId: null,
      status: "planning",
      evidenceRefs: [],
      checkpoints: [],
      events: [],
      createdAt: 100,
      updatedAt: 100,
    }
    ledger.trajectories["child"] = {
      id: "child",
      rootSessionId: "ses-root",
      sessionId: null,
      parentTrajectoryId: "parent",
      status: "planning",
      evidenceRefs: [],
      checkpoints: [],
      events: [],
      createdAt: 200,
      updatedAt: 200,
    }
    writeTrajectoryLedger(root, ledger)

    const result = traverseTrajectory({ projectRoot: root, trajectoryId: "parent" })
    expect(result.trajectories).toHaveLength(2)
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0]!.from).toBe("parent")
    expect(result.edges[0]!.to).toBe("child")
  })

  it("createTrajectoryLedger returns empty ledger", () => {
    const ledger = createTrajectoryLedger()
    expect(ledger.version).toBe(1)
    expect(Object.keys(ledger.trajectories)).toHaveLength(0)
  })

  it("attachTrajectoryEvidence requires rootSessionId for new trajectories", () => {
    expect(() => attachTrajectoryEvidence({
      projectRoot: root,
      trajectoryId: "traj-new",
      // No rootSessionId provided
    })).toThrow("[Harness] rootSessionId is required")
  })

  it("attachTrajectoryEvidence updates existing trajectory lineage fields", () => {
    seedTrajectory(root, "traj-1", "ses-root")
    const { trajectory } = attachTrajectoryEvidence({
      projectRoot: root,
      trajectoryId: "traj-1",
      sessionId: "ses-new",
      parentTrajectoryId: "parent-1",
      evidenceRef: "ref-lineage",
    })
    expect(trajectory.sessionId).toBe("ses-new")
    expect(trajectory.parentTrajectoryId).toBe("parent-1")
  })

  describe("immutability guard — closed trajectories", () => {
    it("eventTrajectory throws on closed trajectory", () => {
      seedClosedTrajectory(root, "traj-closed")
      expect(() => eventTrajectory({
        projectRoot: root,
        trajectoryId: "traj-closed",
        eventType: "recovery",
        summary: "should fail",
      })).toThrow("[Harness] trajectory is closed: traj-closed")
    })

    it("attachTrajectoryEvidence throws on closed trajectory", () => {
      seedClosedTrajectory(root, "traj-closed")
      expect(() => attachTrajectoryEvidence({
        projectRoot: root,
        trajectoryId: "traj-closed",
        evidenceRef: "new-ref",
      })).toThrow("[Harness] trajectory is closed: traj-closed")
    })

    it("checkpointTrajectory throws on closed trajectory", () => {
      seedClosedTrajectory(root, "traj-closed")
      expect(() => checkpointTrajectory({
        projectRoot: root,
        trajectoryId: "traj-closed",
        summary: "should fail",
      })).toThrow("[Harness] trajectory is closed: traj-closed")
    })

    it("closeTrajectory throws on already-closed trajectory", () => {
      seedClosedTrajectory(root, "traj-closed")
      expect(() => closeTrajectory({
        projectRoot: root,
        trajectoryId: "traj-closed",
        summary: "closing again",
      })).toThrow("[Harness] trajectory is already closed: traj-closed")
    })

    it("read operations succeed on closed trajectory", () => {
      seedClosedTrajectory(root, "traj-closed")

      const { trajectory } = inspectTrajectoryLedger({ projectRoot: root, trajectoryId: "traj-closed" })
      expect(trajectory).toBeDefined()
      expect(trajectory!.status).toBe("closed")

      const traversal = traverseTrajectory({ projectRoot: root, trajectoryId: "traj-closed" })
      expect(traversal.trajectories).toHaveLength(1)
      expect(traversal.trajectories[0]!.status).toBe("closed")
    })

    it("mutations still work on active trajectories (no regression)", () => {
      seedTrajectory(root, "traj-active")

      const { trajectory: traj1 } = attachTrajectoryEvidence({
        projectRoot: root,
        trajectoryId: "traj-active",
        evidenceRef: "ref-active",
      })
      expect(traj1.evidenceRefs).toContain("ref-active")

      const { event } = eventTrajectory({
        projectRoot: root,
        trajectoryId: "traj-active",
        eventType: "recovery",
        summary: "active event",
      })
      expect(event.eventType).toBe("recovery")

      const { checkpoint } = checkpointTrajectory({
        projectRoot: root,
        trajectoryId: "traj-active",
        summary: "active checkpoint",
      })
      expect(checkpoint.summary).toBe("active checkpoint")

      const { trajectory: closed } = closeTrajectory({
        projectRoot: root,
        trajectoryId: "traj-active",
      })
      expect(closed.status).toBe("closed")
    })
  })
})
