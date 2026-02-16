/**
 * Tests for US-018: Graph Migration
 * 
 * @module tests/graph-migrate.test.ts
 */

import { randomUUID } from "crypto"
import { existsSync } from "fs"
import { mkdir, readFile, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { describe, it, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"

import {
  migrateToGraph,
  isGraphMigrationNeeded,
  _internal,
} from "../src/lib/graph-migrate.js"
import { getHivemindPaths, getLegacyPaths } from "../src/lib/paths.js"

const {
  LEGACY_PHASE_ID,
  LEGACY_PLAN_ID,
  LEGACY_TRAJECTORY_ID,
  createLegacyPhase,
  createLegacyPlan,
  migrateBrainToTrajectory,
  migrateTasks,
  migrateMems,
  mapTaskStatus,
} = _internal

describe("Graph Migration (US-018)", () => {
  let tempDir: string
  let projectRoot: string

  beforeEach(async () => {
    // Create unique temp directory for each test
    tempDir = join(tmpdir(), `graph-migrate-test-${Date.now()}-${randomUUID().slice(0, 8)}`)
    projectRoot = tempDir
    await mkdir(tempDir, { recursive: true })
  })

  after(async () => {
    // Cleanup is handled by OS temp cleanup
  })

  describe("Constants", () => {
    it("LEGACY_PHASE_ID is valid UUID format", () => {
      assert.match(LEGACY_PHASE_ID, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it("LEGACY_PLAN_ID is valid UUID format", () => {
      assert.match(LEGACY_PLAN_ID, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it("LEGACY_TRAJECTORY_ID is valid UUID format", () => {
      assert.match(LEGACY_TRAJECTORY_ID, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })
  })

  describe("createLegacyPhase", () => {
    it("creates a valid PhaseNode", () => {
      const phase = createLegacyPhase()
      assert.equal(phase.id, LEGACY_PHASE_ID)
      assert.equal(phase.plan_id, LEGACY_PLAN_ID)
      assert.equal(phase.title, "Legacy Context")
      assert.equal(phase.status, "complete")
      assert.equal(phase.order, 0)
    })
  })

  describe("createLegacyPlan", () => {
    it("creates a valid plan object", () => {
      const plan = createLegacyPlan()
      assert.equal(plan.id, LEGACY_PLAN_ID)
      assert.equal(plan.trajectory_id, LEGACY_TRAJECTORY_ID)
      assert.equal(plan.title, "Migrated Context")
      assert.equal(plan.status, "complete")
    })
  })

  describe("mapTaskStatus", () => {
    it("maps 'complete' to 'complete'", () => {
      assert.equal(mapTaskStatus("complete"), "complete")
    })

    it("maps 'completed' to 'complete'", () => {
      assert.equal(mapTaskStatus("completed"), "complete")
    })

    it("maps 'in_progress' to 'in_progress'", () => {
      assert.equal(mapTaskStatus("in_progress"), "in_progress")
    })

    it("maps 'in-progress' to 'in_progress'", () => {
      assert.equal(mapTaskStatus("in-progress"), "in_progress")
    })

    it("maps 'invalidated' to 'invalidated'", () => {
      assert.equal(mapTaskStatus("invalidated"), "invalidated")
    })

    it("maps undefined to 'pending'", () => {
      assert.equal(mapTaskStatus(undefined), "pending")
    })

    it("maps unknown status to 'pending'", () => {
      assert.equal(mapTaskStatus("unknown"), "pending")
    })
  })

  describe("migrateTasks", () => {
    it("creates empty array from empty input", () => {
      const tasks = migrateTasks([])
      assert.equal(tasks.length, 0)
    })

    it("migrates task with valid UUID", () => {
      const uuid = randomUUID()
      const tasks = migrateTasks([{ id: uuid, text: "Test task" }])
      assert.equal(tasks.length, 1)
      assert.equal(tasks[0].id, uuid)
      assert.equal(tasks[0].parent_phase_id, LEGACY_PHASE_ID)
    })

    it("generates UUID for task without id", () => {
      const tasks = migrateTasks([{ text: "Test task" }])
      assert.equal(tasks.length, 1)
      assert.match(tasks[0].id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it("sets parent_phase_id to LEGACY_PHASE_ID", () => {
      const tasks = migrateTasks([{ text: "Test task" }])
      assert.equal(tasks[0].parent_phase_id, LEGACY_PHASE_ID)
    })

    it("uses text as title", () => {
      const tasks = migrateTasks([{ text: "My Task Title" }])
      assert.equal(tasks[0].title, "My Task Title")
    })

    it("provides default title when text missing", () => {
      const tasks = migrateTasks([{}])
      assert.match(tasks[0].title, /^Migrated task \d+$/)
    })
  })

  describe("migrateMems", () => {
    it("creates empty array from empty input", () => {
      const mems = migrateMems([])
      assert.equal(mems.length, 0)
    })

    it("sets type to 'insight'", () => {
      const mems = migrateMems([{ content: "Test memory" }])
      assert.equal(mems[0].type, "insight")
    })

    it("sets origin_task_id to null", () => {
      const mems = migrateMems([{ content: "Test memory" }])
      assert.equal(mems[0].origin_task_id, null)
    })

    it("sets relevance_score to 0.5", () => {
      const mems = migrateMems([{ content: "Test memory" }])
      assert.equal(mems[0].relevance_score, 0.5)
    })

    it("sets staleness_stamp to current time", () => {
      const mems = migrateMems([{ content: "Test memory" }])
      const now = new Date().getTime()
      const stamp = new Date(mems[0].staleness_stamp).getTime()
      assert.ok(Math.abs(now - stamp) < 5000, "staleness_stamp should be recent")
    })

    it("preserves valid UUID", () => {
      const uuid = randomUUID()
      const mems = migrateMems([{ id: uuid, content: "Test" }])
      assert.equal(mems[0].id, uuid)
    })

    it("generates UUID for mem without id", () => {
      const mems = migrateMems([{ content: "Test" }])
      assert.match(mems[0].id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })
  })

  describe("migrateBrainToTrajectory", () => {
    it("creates TrajectoryNode with session ID", () => {
      const sessionId = randomUUID()
      const trajectory = migrateBrainToTrajectory({}, sessionId)
      assert.equal(trajectory.session_id, sessionId)
    })

    it("extracts intent from brain.hierarchy.trajectory", () => {
      const brain = { hierarchy: { trajectory: "My Intent" } }
      const trajectory = migrateBrainToTrajectory(brain, randomUUID())
      assert.equal(trajectory.intent, "My Intent")
    })

    it("defaults intent to 'Migrated session'", () => {
      const trajectory = migrateBrainToTrajectory({}, randomUUID())
      assert.equal(trajectory.intent, "Migrated session")
    })

    it("sets active_plan_id to LEGACY_PLAN_ID", () => {
      const trajectory = migrateBrainToTrajectory({}, randomUUID())
      assert.equal(trajectory.active_plan_id, LEGACY_PLAN_ID)
    })

    it("sets active_phase_id to LEGACY_PHASE_ID", () => {
      const trajectory = migrateBrainToTrajectory({}, randomUUID())
      assert.equal(trajectory.active_phase_id, LEGACY_PHASE_ID)
    })

    it("initializes active_task_ids as empty array", () => {
      const trajectory = migrateBrainToTrajectory({}, randomUUID())
      assert.deepEqual(trajectory.active_task_ids, [])
    })
  })

  describe("isGraphMigrationNeeded", () => {
    it("returns true when .hivemind does not exist", () => {
      assert.equal(isGraphMigrationNeeded(projectRoot), true)
    })

    it("returns true when graph directory missing", async () => {
      const paths = getHivemindPaths(projectRoot)
      await mkdir(paths.root, { recursive: true })
      assert.equal(isGraphMigrationNeeded(projectRoot), true)
    })

    it("returns true when trajectory.json missing", async () => {
      const paths = getHivemindPaths(projectRoot)
      await mkdir(paths.graphDir, { recursive: true })
      assert.equal(isGraphMigrationNeeded(projectRoot), true)
    })

    it("returns false when trajectory.json exists", async () => {
      const paths = getHivemindPaths(projectRoot)
      await mkdir(paths.graphDir, { recursive: true })
      await writeFile(paths.graphTrajectory, JSON.stringify({ version: "1.0.0", trajectory: null }))
      assert.equal(isGraphMigrationNeeded(projectRoot), false)
    })
  })

  describe("migrateToGraph integration", () => {
    it("creates graph files when no legacy data exists", async () => {
      const result = await migrateToGraph(projectRoot)
      assert.ok(result.success, `migration should succeed, errors: ${result.errors.join(", ")}`)
      assert.ok(result.migrated.trajectory, "trajectory should be migrated")
      assert.ok(result.migrated.plans, "plans should be migrated")
      
      const paths = getHivemindPaths(projectRoot)
      assert.ok(existsSync(paths.graphDir), "graph directory should exist")
      assert.ok(existsSync(paths.graphTrajectory), "trajectory.json should exist")
      assert.ok(existsSync(paths.graphPlans), "plans.json should exist")
      assert.ok(existsSync(paths.graphTasks), "tasks.json should exist")
      assert.ok(existsSync(paths.graphMems), "mems.json should exist")
    })

    it("migrates legacy tasks with parent_phase_id FK", async () => {
      const paths = getHivemindPaths(projectRoot)
      
      // Create state directory and tasks.json
      await mkdir(paths.stateDir, { recursive: true })
      await writeFile(
        paths.tasks,
        JSON.stringify({
          tasks: [
            { id: randomUUID(), text: "Task 1", status: "pending" },
            { id: randomUUID(), text: "Task 2", status: "complete" },
          ],
        })
      )

      const result = await migrateToGraph(projectRoot)
      assert.ok(result.success, `migration should succeed, errors: ${result.errors.join(", ")}`)
      assert.equal(result.migrated.tasks, 2, "should have 2 migrated tasks")
      
      const tasksData = JSON.parse(await readFile(paths.graphTasks, "utf-8"))
      assert.equal(tasksData.tasks.length, 2, "should have 2 tasks in file")
      assert.equal(tasksData.tasks[0].parent_phase_id, LEGACY_PHASE_ID)
      assert.equal(tasksData.tasks[1].parent_phase_id, LEGACY_PHASE_ID)
    })

    it("is idempotent - returns success if already migrated", async () => {
      // First migration
      const result1 = await migrateToGraph(projectRoot)
      assert.ok(result1.success, "first migration should succeed")
      
      // Second migration should detect already completed
      const result2 = await migrateToGraph(projectRoot)
      assert.ok(result2.success, "second migration should succeed")
      assert.ok(result2.errors.some((e) => e.includes("already")), "should have already completed message")
    })
  })
})
