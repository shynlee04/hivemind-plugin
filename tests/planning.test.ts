import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  PlanningManifestSchema,
  PlanningStateSchema,
  PhaseSchema,
  RequirementSchema,
} from "../src/schemas/planning.js"

describe("planning schemas", () => {
  it("validates a correct planning manifest", () => {
    const parsed = PlanningManifestSchema.parse({
      version: "1.0.0",
      project_name: "HiveMind Plugin",
      requirements: [
        {
          id: "REQ-001",
          description: "Add planning bootstrap",
        },
      ],
      phases: [
        {
          number: 1,
          name: "Foundation",
          status: "in_progress",
          progress: 30,
        },
      ],
      state: {},
      milestones: [
        {
          name: "Wave 1",
          completed_date: "2026-02-27",
        },
      ],
    })

    assert.equal(parsed.version, "1.0.0")
    assert.equal(parsed.requirements[0]?.status, "pending")
    assert.equal(parsed.phases[0]?.progress, 30)
    assert.deepEqual(parsed.state.active_blockers, [])
  })

  it("rejects invalid requirement ids", () => {
    assert.throws(
      () =>
        PlanningManifestSchema.parse({
          version: "1.0.0",
          requirements: [
            {
              id: "REQ-1",
              description: "Invalid format",
            },
          ],
          phases: [],
          state: {},
          milestones: [],
        }),
      /REQ-NNN format/,
    )
  })

  it("validates all requirement status values", () => {
    const statuses = ["pending", "in_progress", "completed", "deferred", "cancelled"] as const
    for (const status of statuses) {
      const parsed = RequirementSchema.parse({
        id: "REQ-123",
        description: `Requirement with ${status} status`,
        status,
      })
      assert.equal(parsed.status, status)
    }
  })

  it("validates phase progress range 0-100", () => {
    const low = PhaseSchema.parse({
      number: 1,
      name: "Start",
      progress: 0,
    })
    assert.equal(low.progress, 0)

    const high = PhaseSchema.parse({
      number: 2,
      name: "Finish",
      progress: 100,
    })
    assert.equal(high.progress, 100)

    assert.throws(
      () =>
        PhaseSchema.parse({
          number: 3,
          name: "Too low",
          progress: -1,
        }),
    )

    assert.throws(
      () =>
        PhaseSchema.parse({
          number: 4,
          name: "Too high",
          progress: 101,
        }),
    )
  })

  it("accepts default empty planning state", () => {
    const parsed = PlanningStateSchema.parse({})
    assert.equal(parsed.current_position, "")
    assert.deepEqual(parsed.active_blockers, [])
    assert.deepEqual(parsed.recent_decisions, [])
    assert.deepEqual(parsed.session_history, [])
  })
})
