import { describe, it, before, after } from "node:test"
import assert from "node:assert"
import { mkdtemp, rm, writeFile, mkdir, readFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

import { getEffectivePaths, getHivemindPaths } from "../src/lib/paths.js"
import {
  loadGraphTasks,
  loadGraphMems,
  validateTasksWithFKValidation,
  validateMemsWithFKValidation,
  type OrphanRecord,
} from "../src/lib/graph-io.js"
import { quarantineOrphan } from "../src/lib/orphan-quarantine.js"

describe("Orphan Quarantine (P0-3)", () => {
  let testDir: string

  before(async () => {
    testDir = await mkdtemp(join(tmpdir(), "orphan-test-"))
    const graphDir = join(testDir, ".hivemind", "graph")
    await mkdir(graphDir, { recursive: true })
  })

  after(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe("graphOrphans path", () => {
    it("includes graphOrphans in HivemindPaths", () => {
      const paths = getHivemindPaths(testDir)
      assert.ok(paths.graphOrphans, "graphOrphans should exist")
      assert.ok(
        paths.graphOrphans.endsWith("orphans.json"),
        "graphOrphans should end with orphans.json",
      )
    })

    it("graphOrphans is under graph directory", () => {
      const paths = getHivemindPaths(testDir)
      assert.ok(
        paths.graphOrphans.includes("/graph/"),
        "graphOrphans should be under graph/ directory",
      )
    })
  })

  describe("safeParse behavior", () => {
    it("returns empty state on missing file", async () => {
      const result = await loadGraphTasks(testDir)
      assert.deepEqual(result, { version: "1.0.0", tasks: [] })
    })

    it("returns empty state on invalid JSON", async () => {
      const tasksPath = join(testDir, ".hivemind", "graph", "tasks.json")
      await writeFile(tasksPath, "not valid json")

      const result = await loadGraphTasks(testDir)
      assert.deepEqual(result, { version: "1.0.0", tasks: [] })
    })

    it("returns empty state on schema validation failure", async () => {
      const tasksPath = join(testDir, ".hivemind", "graph", "tasks.json")
      await writeFile(
        tasksPath,
        JSON.stringify({
          version: "1.0.0",
          tasks: [{ id: "not-a-uuid" }],
        }),
      )

      const result = await loadGraphTasks(testDir)
      assert.deepEqual(result, { version: "1.0.0", tasks: [] })
    })
  })

  describe("FK validation - tasks", () => {
    it("RED: quarantineOrphan is idempotent for duplicate task IDs", async () => {
      const orphanPath = getEffectivePaths(testDir).graphOrphans
      await writeFile(orphanPath, JSON.stringify({ version: "1.0.0", orphans: [] }, null, 2))

      const duplicateTask: OrphanRecord = {
        id: "f1000000-0000-4000-8000-000000000001",
        type: "task",
        reason: "missing parent phase",
        original_data: { id: "f1000000-0000-4000-8000-000000000001" },
        quarantined_at: new Date().toISOString(),
      }

      await quarantineOrphan(orphanPath, duplicateTask)
      await quarantineOrphan(orphanPath, duplicateTask)

      const raw = await readFile(orphanPath, "utf-8")
      const parsed = JSON.parse(raw) as { orphans: OrphanRecord[] }
      const duplicateEntries = parsed.orphans.filter(
        (record) => record.id === duplicateTask.id && record.type === "task",
      )

      assert.equal(
        duplicateEntries.length,
        1,
        "RED expected: repeated quarantine for same task id should not create duplicate orphan entries",
      )
    })

    it("quarantines tasks with missing parent_phase_id", async () => {
      const tasksPath = join(testDir, ".hivemind", "graph", "tasks.json")
      const orphanPath = getEffectivePaths(testDir).graphOrphans

      await writeFile(
        tasksPath,
        JSON.stringify({
          version: "1.0.0",
          tasks: [
            {
              id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
              parent_phase_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
              title: "Orphan Task",
              status: "pending",
              file_locks: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      )

      const validPhaseIds = new Set<string>()
      const result = await validateTasksWithFKValidation(
        tasksPath,
        validPhaseIds,
        orphanPath,
      )

      assert.deepEqual(result?.tasks, [], "Task should be quarantined")
      assert.ok(existsSync(orphanPath), "Orphans file should exist")
    })

    it("RED: repeated loadGraphTasks must not re-quarantine same invalid task endlessly", async () => {
      const tasksPath = join(testDir, ".hivemind", "graph", "tasks.json")
      const orphanPath = getEffectivePaths(testDir).graphOrphans
      await writeFile(orphanPath, JSON.stringify({ version: "1.0.0", orphans: [] }, null, 2))

      await writeFile(
        tasksPath,
        JSON.stringify({
          version: "1.0.0",
          tasks: [
            {
              id: "f2000000-0000-4000-8000-000000000002",
              parent_phase_id: "f3000000-0000-4000-8000-000000000003",
              title: "Invalid task for repeated load",
              status: "pending",
              file_locks: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      )

      const firstLoad = await loadGraphTasks(testDir, { enabled: true })
      const secondLoad = await loadGraphTasks(testDir, { enabled: true })

      assert.equal(firstLoad.tasks.length, 0, "first load should quarantine invalid task")
      assert.equal(secondLoad.tasks.length, 0, "second load should still return no valid tasks")

      const raw = await readFile(orphanPath, "utf-8")
      const parsed = JSON.parse(raw) as { orphans: OrphanRecord[] }
      const duplicateEntries = parsed.orphans.filter(
        (record) => record.id === "f2000000-0000-4000-8000-000000000002" && record.type === "task",
      )

      assert.equal(
        duplicateEntries.length,
        1,
        "RED expected: repeated FK validation should not append duplicate quarantine entries for same invalid task",
      )
    })
  })

  describe("FK validation - mems", () => {
    it("quarantines mems with missing origin_task_id", async () => {
      const memsPath = join(testDir, ".hivemind", "graph", "mems.json")
      const orphanPath = getEffectivePaths(testDir).graphOrphans
      const validSessionId = "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16"

      await writeFile(
        memsPath,
        JSON.stringify({
          version: "1.0.0",
          mems: [
            {
              id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13",
              session_id: validSessionId,
              origin_task_id: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
              shelf: "test",
              type: "insight",
              content: "Test mem",
              relevance_score: 0.5,
              staleness_stamp: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      )

      const validTaskIds = new Set<string>([validSessionId])
      const result = await validateMemsWithFKValidation(
        memsPath,
        validTaskIds,
        orphanPath,
      )

      assert.deepEqual(result?.mems, [], "Mem should be quarantined")
    })

    it("keeps mems with null origin_task_id (valid)", async () => {
      const memsPath = join(testDir, ".hivemind", "graph", "mems.json")
      const orphanPath = getEffectivePaths(testDir).graphOrphans
      const validSessionId = "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a17"

      await writeFile(
        memsPath,
        JSON.stringify({
          version: "1.0.0",
          mems: [
            {
              id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15",
              session_id: validSessionId,
              origin_task_id: null,
              shelf: "test",
              type: "insight",
              content: "Standalone mem",
              relevance_score: 0.5,
              staleness_stamp: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      )

      const validTaskIds = new Set<string>([validSessionId])
      const result = await validateMemsWithFKValidation(
        memsPath,
        validTaskIds,
        orphanPath,
      )

      assert.equal(result?.mems.length, 1, "Mem with null origin_task_id should be kept")
    })

    it("quarantines mems with missing session_id FK", async () => {
      const memsPath = join(testDir, ".hivemind", "graph", "mems.json")
      const orphanPath = getEffectivePaths(testDir).graphOrphans

      await writeFile(
        memsPath,
        JSON.stringify({
          version: "1.0.0",
          mems: [
            {
              id: "22eebc99-9c0b-4ef8-bb6d-6bb9bd380a18",
              session_id: "33eebc99-9c0b-4ef8-bb6d-6bb9bd380a19",
              origin_task_id: null,
              shelf: "test",
              type: "insight",
              content: "Invalid session FK",
              relevance_score: 0.5,
              staleness_stamp: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      )

      const validTaskIds = new Set<string>()
      const result = await validateMemsWithFKValidation(
        memsPath,
        validTaskIds,
        orphanPath,
      )

      assert.deepEqual(result?.mems, [], "Mem with unresolved session_id should be quarantined")
    })
  })
})
