/**
 * Cycle4 Path-1 TDD - Blocker 2: Stale Graph-Task Reconciliation
 * 
 * Problem: graph/tasks.json has old in_progress tasks not linked to current state/tasks.json
 * Fix: Add deterministic reconciliation guard when reusing active task
 * 
 * RED: These tests should FAIL until fix is implemented
 */

import { randomUUID } from "crypto"
import { existsSync } from "fs"
import { mkdir, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"

import { getEffectivePaths } from "../src/lib/paths.js"
import { addGraphTask, loadGraphTasks } from "../src/lib/graph-io.js"
import type { TaskNode } from "../src/schemas/graph-nodes.js"

// Import functions that will be implemented
import {
  reconcileStaleTasks,
  invalidateOrphanedActiveTasks,
} from "../src/lib/graph-io.js"

describe("Cycle4 Blocker 2: Stale Graph-Task Reconciliation", () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `hivemind-test-${randomUUID()}`)
    await mkdir(testDir, { recursive: true })
    const paths = getEffectivePaths(testDir)
    await mkdir(paths.root, { recursive: true })
    await mkdir(paths.graphDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe("invalidateOrphanedActiveTasks", () => {
    it("should invalidate in_progress tasks not in active_task_ids", async () => {
      const phaseId = randomUUID()
      const staleTaskId = randomUUID()
      const activeTaskId = randomUUID()

      // Create stale in_progress task
      const staleTask: TaskNode = {
        id: staleTaskId,
        parent_phase_id: phaseId,
        title: "Stale task",
        status: "in_progress",
        file_locks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await addGraphTask(testDir, staleTask)

      // Create active task
      const activeTask: TaskNode = {
        id: activeTaskId,
        parent_phase_id: phaseId,
        title: "Active task",
        status: "in_progress",
        file_locks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await addGraphTask(testDir, activeTask)

      // Reconcile with only activeTaskId in active list
      const result = await invalidateOrphanedActiveTasks(testDir, [activeTaskId])

      assert.ok(result.invalidated.includes(staleTaskId))
      assert.ok(!result.invalidated.includes(activeTaskId))

      // Verify the stale task is now invalidated
      const tasks = await loadGraphTasks(testDir, { enabled: false })
      const stale = tasks.tasks.find(t => t.id === staleTaskId)
      assert.strictEqual(stale?.status, "invalidated")
      
      const active = tasks.tasks.find(t => t.id === activeTaskId)
      assert.strictEqual(active?.status, "in_progress")
    })

    it("should not invalidate complete tasks", async () => {
      const phaseId = randomUUID()
      const completeTaskId = randomUUID()

      const completeTask: TaskNode = {
        id: completeTaskId,
        parent_phase_id: phaseId,
        title: "Complete task",
        status: "complete",
        file_locks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await addGraphTask(testDir, completeTask)

      // Reconcile with empty active list
      const result = await invalidateOrphanedActiveTasks(testDir, [])

      // Complete task should NOT be invalidated
      assert.ok(!result.invalidated.includes(completeTaskId))
    })

    it("should return empty array if no stale tasks", async () => {
      const phaseId = randomUUID()
      const activeTaskId = randomUUID()

      const activeTask: TaskNode = {
        id: activeTaskId,
        parent_phase_id: phaseId,
        title: "Active task",
        status: "in_progress",
        file_locks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await addGraphTask(testDir, activeTask)

      const result = await invalidateOrphanedActiveTasks(testDir, [activeTaskId])
      assert.strictEqual(result.invalidated.length, 0)
    })
  })

  describe("reconcileStaleTasks", () => {
    it("should reconcile stale tasks against trajectory active_task_ids", async () => {
      const paths = getEffectivePaths(testDir)
      const phaseId = randomUUID()
      const staleTaskId = randomUUID()
      const activeTaskId = randomUUID()
      const sessionId = randomUUID()

      // Create trajectory.json with active_task_ids
      await writeFile(
        paths.graphTrajectory,
        JSON.stringify({
          version: "1.0.0",
          trajectory: {
            id: sessionId,
            session_id: sessionId,
            active_plan_id: null,
            active_phase_id: phaseId,
            active_task_ids: [activeTaskId],
            intent: "test",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }, null, 2)
      )

      // Create stale task
      await addGraphTask(testDir, {
        id: staleTaskId,
        parent_phase_id: phaseId,
        title: "Stale task",
        status: "in_progress",
        file_locks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Create active task
      await addGraphTask(testDir, {
        id: activeTaskId,
        parent_phase_id: phaseId,
        title: "Active task",
        status: "in_progress",
        file_locks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Run reconciliation
      const result = await reconcileStaleTasks(testDir)

      assert.strictEqual(result.invalidatedCount, 1)
      assert.ok(result.invalidatedIds.includes(staleTaskId))
      assert.ok(!result.invalidatedIds.includes(activeTaskId))
    })

    it("should return zero count if trajectory has no active_task_ids", async () => {
      const paths = getEffectivePaths(testDir)
      const phaseId = randomUUID()
      const sessionId = randomUUID()

      // Create trajectory.json with empty active_task_ids
      await writeFile(
        paths.graphTrajectory,
        JSON.stringify({
          version: "1.0.0",
          trajectory: {
            id: sessionId,
            session_id: sessionId,
            active_plan_id: null,
            active_phase_id: phaseId,
            active_task_ids: [],
            intent: "test",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }, null, 2)
      )

      // Create task but with empty active list, nothing should happen
      await addGraphTask(testDir, {
        id: randomUUID(),
        parent_phase_id: phaseId,
        title: "Task",
        status: "in_progress",
        file_locks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const result = await reconcileStaleTasks(testDir)
      // Empty active_task_ids = no reconciliation action
      assert.strictEqual(result.invalidatedCount, 0)
    })

    it("should handle missing trajectory gracefully", async () => {
      // No trajectory.json created
      const result = await reconcileStaleTasks(testDir)
      assert.strictEqual(result.invalidatedCount, 0)
      assert.strictEqual(result.error, undefined)
    })
  })
})
