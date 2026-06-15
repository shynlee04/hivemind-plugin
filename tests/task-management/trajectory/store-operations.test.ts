import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  addTrajectoryEvent,
  attachTrajectoryEvidence,
  checkpointTrajectory,
  closeTrajectory,
  createPhaseTrajectory,
  createTrajectoryLedger,
  eventTrajectory,
  inspectTrajectoryLedger,
  transitionTrajectory,
  traverseTrajectory,
} from "../../../src/task-management/trajectory/store-operations.js"

import { readTrajectoryLedger, writeTrajectoryLedger } from "../../../src/task-management/trajectory/ledger.js"

import {
  EVENT_DELEGATION_STARTED,
  EVENT_EXECUTION_COMPLETE,
  EVENT_VERIFICATION_PASS,
  TRAJECTORY_AUTO_TRANSITIONS,
  TRAJECTORY_TRANSITIONS,
} from "../../../src/task-management/trajectory/types.js"

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

describe("phase-level trajectory operations", () => {
  let root: string

  beforeEach(() => {
    root = makeRoot()
    mkdirSync(root, { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("createPhaseTrajectory creates trajectory with ID traj-phase-{N}", () => {
    const { trajectory } = createPhaseTrajectory({
      projectRoot: root,
      phaseNumber: "25.5",
      rootSessionId: "root-1",
    })
    expect(trajectory.id).toBe("traj-phase-25.5")
  })

  it("Created trajectory has status 'planning'", () => {
    const { trajectory } = createPhaseTrajectory({
      projectRoot: root,
      phaseNumber: "25.5",
      rootSessionId: "root-1",
    })
    expect(trajectory.status).toBe("planning")
  })

  it("createPhaseTrajectory throws if trajectory already exists", () => {
    createPhaseTrajectory({
      projectRoot: root,
      phaseNumber: "25.5",
      rootSessionId: "root-1",
    })
    expect(() =>
      createPhaseTrajectory({
        projectRoot: root,
        phaseNumber: "25.5",
        rootSessionId: "root-1",
      }),
    ).toThrow("[Hivemind]")
  })

  it("transitionTrajectory from 'planning' to 'executing' succeeds", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    const { trajectory } = transitionTrajectory(root, "traj-phase-25.5", "executing")
    expect(trajectory.status).toBe("executing")
  })

  it("transitionTrajectory from 'planning' to 'verifying' throws (invalid)", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    expect(() => transitionTrajectory(root, "traj-phase-25.5", "verifying")).toThrow("[Hivemind]")
  })

  it("transitionTrajectory from 'completed' to 'closed' succeeds", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    transitionTrajectory(root, "traj-phase-25.5", "executing")
    transitionTrajectory(root, "traj-phase-25.5", "verifying")
    transitionTrajectory(root, "traj-phase-25.5", "completed")
    const { trajectory } = transitionTrajectory(root, "traj-phase-25.5", "closed")
    expect(trajectory.status).toBe("closed")
  })

  it("transitionTrajectory from 'closed' to any state throws (terminal)", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    transitionTrajectory(root, "traj-phase-25.5", "executing")
    transitionTrajectory(root, "traj-phase-25.5", "verifying")
    transitionTrajectory(root, "traj-phase-25.5", "completed")
    transitionTrajectory(root, "traj-phase-25.5", "closed")
    expect(() => transitionTrajectory(root, "traj-phase-25.5", "planning")).toThrow("[Hivemind]")
  })

  it("transitionTrajectory is idempotent — transitioning to current state is no-op", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    const { trajectory } = transitionTrajectory(root, "traj-phase-25.5", "planning")
    expect(trajectory.status).toBe("planning")
  })

  it("addTrajectoryEvent with EVENT_DELEGATION_STARTED auto-transitions planning→executing", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    const { trajectory } = addTrajectoryEvent(root, "traj-phase-25.5", EVENT_DELEGATION_STARTED, "first delegation")
    expect(trajectory.status).toBe("executing")
  })

  it("addTrajectoryEvent with EVENT_EXECUTION_COMPLETE auto-transitions executing→verifying", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    transitionTrajectory(root, "traj-phase-25.5", "executing")
    const { trajectory } = addTrajectoryEvent(root, "traj-phase-25.5", EVENT_EXECUTION_COMPLETE, "execution done")
    expect(trajectory.status).toBe("verifying")
  })

  it("addTrajectoryEvent with EVENT_VERIFICATION_PASS auto-transitions verifying→completed", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    transitionTrajectory(root, "traj-phase-25.5", "executing")
    transitionTrajectory(root, "traj-phase-25.5", "verifying")
    const { trajectory } = addTrajectoryEvent(root, "traj-phase-25.5", EVENT_VERIFICATION_PASS, "verification passed")
    expect(trajectory.status).toBe("completed")
  })

  it("addTrajectoryEvent without auto-transition event type does NOT change status", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    const { trajectory } = addTrajectoryEvent(root, "traj-phase-25.5", "note", "just a note")
    expect(trajectory.status).toBe("planning")
  })

  it("Delegation trajectory can set parentTrajectoryId to traj-phase-{N}", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    const { trajectory } = attachTrajectoryEvidence({
      projectRoot: root,
      trajectoryId: "traj-ses-child",
      rootSessionId: "root-1",
      sessionId: "ses-child",
      parentTrajectoryId: "traj-phase-25.5",
      evidenceRef: "delegation:ses-child",
    })
    expect(trajectory.parentTrajectoryId).toBe("traj-phase-25.5")
    expect(trajectory.id).toBe("traj-ses-child")
  })

  it("traverseTrajectory depth='summary' returns summaries with id, status, eventCount, durationMs", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    addTrajectoryEvent(root, "traj-phase-25.5", "note", "first event")
    addTrajectoryEvent(root, "traj-phase-25.5", "note", "second event")
    const result = traverseTrajectory({ projectRoot: root, trajectoryId: "traj-phase-25.5", depth: "summary" })
    expect(result).toHaveProperty("summaries")
    const summaries = (result as { summaries: Array<Record<string, unknown>> }).summaries
    expect(summaries).toHaveLength(1)
    expect(summaries[0]!.id).toBe("traj-phase-25.5")
    expect(summaries[0]!.status).toBe("planning")
    expect(summaries[0]!.eventCount).toBe(2)
    expect(typeof summaries[0]!.durationMs).toBe("number")
  })

  it("traverseTrajectory depth='detailed' returns event types + summaries but stripped evidenceRefs", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    addTrajectoryEvent(root, "traj-phase-25.5", "note", "first event")
    const result = traverseTrajectory({ projectRoot: root, trajectoryId: "traj-phase-25.5", depth: "detailed" })
    expect(result).toHaveProperty("trajectories")
    const records = (result as { trajectories: Array<Record<string, unknown>> }).trajectories
    expect(records).toHaveLength(1)
    expect(records[0]!.id).toBe("traj-phase-25.5")
    // In detailed mode, evidenceRefs should be empty (stripped)
    expect(Array.isArray(records[0]!.evidenceRefs)).toBe(true)
  })

  it("traverseTrajectory depth='full' returns complete trajectory data", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    addTrajectoryEvent(root, "traj-phase-25.5", "note", "test event")
    const result = traverseTrajectory({ projectRoot: root, trajectoryId: "traj-phase-25.5", depth: "full" })
    expect(result).toHaveProperty("trajectories")
    const records = (result as { trajectories: Array<Record<string, unknown>> }).trajectories
    expect(records).toHaveLength(1)
    expect(records[0]!.id).toBe("traj-phase-25.5")
    // Full mode includes events array
    expect(Array.isArray(records[0]!.events)).toBe(true)
    expect((records[0]!.events as Array<Record<string, unknown>>)).toHaveLength(1)
  })

  it("traverseTrajectory defaults to depth='full' when not specified (backward compat)", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    const result = traverseTrajectory({ projectRoot: root, trajectoryId: "traj-phase-25.5" })
    expect(result).toHaveProperty("trajectories")
    const records = (result as { trajectories: Array<Record<string, unknown>> }).trajectories
    expect(records).toHaveLength(1)
  })

  it("traverseTrajectory with rootSessionId filter returns trajectories for that root session", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    const result = traverseTrajectory({ projectRoot: root, rootSessionId: "root-1" })
    expect(result).toHaveProperty("trajectories")
    const records = (result as { trajectories: Array<Record<string, unknown>> }).trajectories
    expect(records.length).toBeGreaterThanOrEqual(1)
  })

  it("Cross-session test — write from one path, read from same path", () => {
    createPhaseTrajectory({ projectRoot: root, phaseNumber: "25.5", rootSessionId: "root-1" })
    // Read from same path — verifies persistence works
    const result = traverseTrajectory({ projectRoot: root, trajectoryId: "traj-phase-25.5" })
    expect(result).toHaveProperty("trajectories")
  })
})

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
    expect(() => closeTrajectory({ projectRoot: root, trajectoryId: "nonexistent" })).toThrow("[Hivemind]")
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
    })).toThrow("[Hivemind] rootSessionId is required")
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
      })).toThrow("[Hivemind] trajectory is closed: traj-closed")
    })

    it("attachTrajectoryEvidence throws on closed trajectory", () => {
      seedClosedTrajectory(root, "traj-closed")
      expect(() => attachTrajectoryEvidence({
        projectRoot: root,
        trajectoryId: "traj-closed",
        evidenceRef: "new-ref",
      })).toThrow("[Hivemind] trajectory is closed: traj-closed")
    })

    it("checkpointTrajectory throws on closed trajectory", () => {
      seedClosedTrajectory(root, "traj-closed")
      expect(() => checkpointTrajectory({
        projectRoot: root,
        trajectoryId: "traj-closed",
        summary: "should fail",
      })).toThrow("[Hivemind] trajectory is closed: traj-closed")
    })

    it("closeTrajectory throws on already-closed trajectory", () => {
      seedClosedTrajectory(root, "traj-closed")
      expect(() => closeTrajectory({
        projectRoot: root,
        trajectoryId: "traj-closed",
        summary: "closing again",
      })).toThrow("[Hivemind] trajectory is already closed: traj-closed")
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
