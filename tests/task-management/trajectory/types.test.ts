import { describe, expect, it } from "vitest"

import {
  TRAJECTORY_AUTO_TRANSITIONS,
  TRAJECTORY_LEDGER_VERSION,
  TRAJECTORY_TRANSITIONS,
} from "../../../src/task-management/trajectory/types.js"

import type {
  EvidenceRef,
  JumpLink,
  PhaseTrajectoryRecord,
  TrajectoryCheckpoint,
  TrajectoryEvent,
  TrajectoryLedger,
  TrajectoryMutationInput,
  TrajectoryRecord,
  TrajectoryStatus,
} from "../../../src/task-management/trajectory/types.js"

describe("trajectory types", () => {
  it("TRAJECTORY_LEDGER_VERSION is 1 (const assertion)", () => {
    expect(TRAJECTORY_LEDGER_VERSION).toBe(1)
    const version: 1 = TRAJECTORY_LEDGER_VERSION
    expect(version).toBe(1)
  })

  it("TrajectoryStatus has exactly 5 members: planning, executing, verifying, completed, closed", () => {
    const statuses: TrajectoryStatus[] = ["planning", "executing", "verifying", "completed", "closed"]
    expect(statuses).toHaveLength(5)
    // Verify each is a valid TrajectoryStatus
    for (const s of statuses) {
      const typed: TrajectoryStatus = s
      expect(typeof typed).toBe("string")
    }
  })

  it("TRAJECTORY_TRANSITIONS['planning'] includes 'executing' and 'closed'", () => {
    expect(TRAJECTORY_TRANSITIONS["planning"]).toContain("executing")
    expect(TRAJECTORY_TRANSITIONS["planning"]).toContain("closed")
  })

  it("TRAJECTORY_TRANSITIONS['executing'] includes 'verifying' and 'closed'", () => {
    expect(TRAJECTORY_TRANSITIONS["executing"]).toContain("verifying")
    expect(TRAJECTORY_TRANSITIONS["executing"]).toContain("closed")
  })

  it("TRAJECTORY_TRANSITIONS['verifying'] includes 'completed' and 'closed'", () => {
    expect(TRAJECTORY_TRANSITIONS["verifying"]).toContain("completed")
    expect(TRAJECTORY_TRANSITIONS["verifying"]).toContain("closed")
  })

  it("TRAJECTORY_TRANSITIONS['completed'] includes 'closed' only", () => {
    expect(TRAJECTORY_TRANSITIONS["completed"]).toEqual(["closed"])
  })

  it("TRAJECTORY_TRANSITIONS['closed'] is empty array (terminal state)", () => {
    expect(TRAJECTORY_TRANSITIONS["closed"]).toEqual([])
  })

  it("PhaseTrajectoryRecord extends TrajectoryRecord with phaseNumber and optional phaseName", () => {
    const phaseRecord: PhaseTrajectoryRecord = {
      id: "traj-phase-25.5",
      rootSessionId: "ses-root",
      sessionId: null,
      parentTrajectoryId: null,
      status: "planning",
      evidenceRefs: [],
      checkpoints: [],
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      phaseNumber: "25.5",
      phaseName: "Trajectory + Contract Redesign",
    }
    expect(phaseRecord.phaseNumber).toBe("25.5")
    expect(phaseRecord.phaseName).toBe("Trajectory + Contract Redesign")
    // Verify it satisfies TrajectoryRecord shape
    expect(phaseRecord.id).toBe("traj-phase-25.5")
    expect(phaseRecord.status).toBe("planning")
  })

  it("JumpLink type enforces delegation:{childSessionID} format", () => {
    const jumpLink: JumpLink = "delegation:ses_child_123"
    expect(jumpLink).toMatch(/^delegation:/)
    // Verify it's a string (runtime check for template literal)
    expect(typeof jumpLink).toBe("string")
    expect(jumpLink.startsWith("delegation:")).toBe(true)
  })

  it("TrajectoryRecord.parentTrajectoryId accepts string | null", () => {
    const withParent: TrajectoryRecord = {
      id: "traj-ses-child",
      rootSessionId: "ses-root",
      sessionId: "ses-child",
      parentTrajectoryId: "traj-phase-25.5",
      status: "executing",
      evidenceRefs: [],
      checkpoints: [],
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    expect(withParent.parentTrajectoryId).toBe("traj-phase-25.5")

    const withoutParent: TrajectoryRecord = {
      id: "traj-phase-25.5",
      rootSessionId: "ses-root",
      sessionId: null,
      parentTrajectoryId: null,
      status: "planning",
      evidenceRefs: [],
      checkpoints: [],
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    expect(withoutParent.parentTrajectoryId).toBeNull()
  })

  it("TRAJECTORY_AUTO_TRANSITIONS maps event types to target states", () => {
    expect(TRAJECTORY_AUTO_TRANSITIONS["delegation:started"]).toBe("executing")
    expect(TRAJECTORY_AUTO_TRANSITIONS["execution:complete"]).toBe("verifying")
    expect(TRAJECTORY_AUTO_TRANSITIONS["verification:pass"]).toBe("completed")
  })

  it("EvidenceRef is string type", () => {
    const ref: EvidenceRef = "test-evidence-ref"
    expect(typeof ref).toBe("string")
  })

  it("TrajectoryCheckpoint shape has required fields", () => {
    const checkpoint: TrajectoryCheckpoint = {
      checkpointId: "cp-1",
      summary: "test checkpoint",
      evidenceRefs: ["ref-1"],
      createdAt: Date.now(),
    }
    expect(checkpoint.checkpointId).toBe("cp-1")
    expect(checkpoint.summary).toBe("test checkpoint")
    expect(checkpoint.evidenceRefs).toEqual(["ref-1"])
    expect(typeof checkpoint.createdAt).toBe("number")
  })

  it("TrajectoryEvent shape has required fields", () => {
    const event: TrajectoryEvent = {
      eventId: "evt-1",
      eventType: "recovery",
      summary: "test event",
      evidenceRefs: ["ref-1"],
      createdAt: Date.now(),
    }
    expect(event.eventId).toBe("evt-1")
    expect(event.eventType).toBe("recovery")
    expect(event.summary).toBe("test event")
    expect(event.evidenceRefs).toEqual(["ref-1"])
    expect(typeof event.createdAt).toBe("number")
  })

  it("TrajectoryLedger shape has version, updatedAt, trajectories", () => {
    const ledger: TrajectoryLedger = {
      version: TRAJECTORY_LEDGER_VERSION,
      updatedAt: Date.now(),
      trajectories: {},
    }
    expect(ledger.version).toBe(1)
    expect(typeof ledger.updatedAt).toBe("number")
    expect(typeof ledger.trajectories).toBe("object")
  })

  it("TrajectoryMutationInput requires projectRoot and trajectoryId", () => {
    const input: TrajectoryMutationInput = {
      projectRoot: "/tmp/test",
      trajectoryId: "traj-1",
    }
    expect(input.projectRoot).toBe("/tmp/test")
    expect(input.trajectoryId).toBe("traj-1")
    expect(input.rootSessionId).toBeUndefined()
    expect(input.sessionId).toBeUndefined()
    expect(input.evidenceRef).toBeUndefined()
  })
})
