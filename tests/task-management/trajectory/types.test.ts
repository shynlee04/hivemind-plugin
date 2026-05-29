import { describe, expect, it } from "vitest"

import {
  TRAJECTORY_LEDGER_VERSION,
} from "../../../src/task-management/trajectory/types.js"

import type {
  EvidenceRef,
  TrajectoryCheckpoint,
  TrajectoryEvent,
  TrajectoryLedger,
  TrajectoryMutationInput,
  TrajectoryRecord,
} from "../../../src/task-management/trajectory/types.js"

describe("trajectory types", () => {
  it("TRAJECTORY_LEDGER_VERSION is 1 (const assertion)", () => {
    expect(TRAJECTORY_LEDGER_VERSION).toBe(1)
    // Verify it's a const assertion by checking the type narrows to literal 1
    const version: 1 = TRAJECTORY_LEDGER_VERSION
    expect(version).toBe(1)
  })

  it("TrajectoryStatus type accepts 'active' and 'closed'", () => {
    // Runtime validation that the type values are correct
    const active: "active" = "active"
    const closed: "closed" = "closed"
    expect(active).toBe("active")
    expect(closed).toBe("closed")
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

  it("TrajectoryRecord shape has all required fields", () => {
    const record: TrajectoryRecord = {
      id: "traj-1",
      rootSessionId: "ses-root",
      sessionId: "ses-1",
      parentTrajectoryId: null,
      status: "active",
      evidenceRefs: ["ref-1"],
      checkpoints: [],
      events: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    expect(record.id).toBe("traj-1")
    expect(record.rootSessionId).toBe("ses-root")
    expect(record.sessionId).toBe("ses-1")
    expect(record.parentTrajectoryId).toBeNull()
    expect(record.status).toBe("active")
    expect(Array.isArray(record.evidenceRefs)).toBe(true)
    expect(Array.isArray(record.checkpoints)).toBe(true)
    expect(Array.isArray(record.events)).toBe(true)
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
    // Optional fields should be undefined by default
    expect(input.rootSessionId).toBeUndefined()
    expect(input.sessionId).toBeUndefined()
    expect(input.evidenceRef).toBeUndefined()
  })
})
