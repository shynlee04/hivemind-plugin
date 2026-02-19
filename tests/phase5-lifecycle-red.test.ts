import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { initProject } from "../src/cli/init.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"
import { loadTrajectory, loadGraphMems, loadGraphTasks } from "../src/lib/graph-io.js"
import { createStateManager } from "../src/lib/persistence.js"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe("Phase 5.2 RED: lifecycle continuity and FK chain", () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "hm-phase5-red-"))
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("declare_intent -> map_context(tactic/action) keeps trajectory FK pointers populated", async () => {
    const sessionTool = createHivemindSessionTool(dir)

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Phase 5 lifecycle FK continuity" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "tactic", content: "Integrate lifecycle with phases" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "action", content: "Link active task into graph chain" },
      {} as any,
    )

    const trajectory = await loadTrajectory(dir)
    assert.ok(trajectory?.trajectory, "trajectory graph node exists after lifecycle updates")

    assert.ok(
      trajectory?.trajectory.active_phase_id,
      "expected active_phase_id to be populated after tactic update",
    )
    assert.match(
      trajectory?.trajectory.active_phase_id ?? "",
      UUID_RE,
      "active_phase_id should be a UUID FK",
    )

    assert.ok(
      (trajectory?.trajectory.active_task_ids.length ?? 0) > 0,
      "expected active_task_ids to contain at least one FK after action update",
    )
    for (const taskId of trajectory?.trajectory.active_task_ids ?? []) {
      assert.match(taskId, UUID_RE, "active task FK should be UUID")
    }

    const graphTasks = await loadGraphTasks(dir)
    const graphTaskIds = new Set(graphTasks.tasks.map((task) => task.id))
    for (const taskId of trajectory?.trajectory.active_task_ids ?? []) {
      assert.ok(
        graphTaskIds.has(taskId),
        "active_task_ids should reference tasks that survive enabled FK validation",
      )
    }
  })

  it("compact_session persists FK-linked lifecycle mem in graph mem store", async () => {
    const sessionTool = createHivemindSessionTool(dir)
    const stateManager = createStateManager(dir)

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Phase 5 close lifecycle trace" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "tactic", content: "Lifecycle handoff into graph" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "action", content: "Create FK-linked lifecycle trace mem" },
      {} as any,
    )

    const stateBeforeClose = await stateManager.load()
    const activeSessionId = stateBeforeClose?.session.id

    await sessionTool.execute(
      { action: "close", summary: "Close and persist lifecycle FK trace" },
      {} as any,
    )

    const graphMems = await loadGraphMems(dir, { enabled: false })
    const hasLifecycleTraceMem = graphMems.mems.some((mem) => {
      return mem.session_id === activeSessionId && mem.origin_task_id !== null
    })

    assert.ok(
      hasLifecycleTraceMem,
      "expected compact_session to write at least one FK-linked lifecycle mem into graph mems",
    )
  })

  it("reuses active graph task on repeated action updates unless override is requested", async () => {
    const sessionTool = createHivemindSessionTool(dir)

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Action idempotency" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "tactic", content: "Ensure phase exists" },
      {} as any,
    )

    await sessionTool.execute(
      { action: "update", level: "action", content: "First action update" },
      {} as any,
    )
    const afterFirst = await loadTrajectory(dir)
    assert.ok(afterFirst?.trajectory, "trajectory should exist after first action update")
    const firstTaskIds = afterFirst?.trajectory?.active_task_ids ?? []
    assert.equal(firstTaskIds.length, 1, "first action update should create a single task")

    await sessionTool.execute(
      { action: "update", level: "action", content: "Repeat action update" },
      {} as any,
    )
    const afterSecond = await loadTrajectory(dir)
    assert.ok(afterSecond?.trajectory, "trajectory should exist after second action update")
    const secondTaskIds = afterSecond?.trajectory?.active_task_ids ?? []
    assert.deepEqual(secondTaskIds, firstTaskIds, "repeated action update should reuse active task")

    await sessionTool.execute(
      { action: "update", level: "action", content: "Forced new task", forceNewActionTask: true },
      {} as any,
    )
    const afterForced = await loadTrajectory(dir)
    assert.ok(afterForced?.trajectory, "trajectory should exist after forced action update")
    const forcedTaskIds = afterForced?.trajectory?.active_task_ids ?? []
    assert.equal(forcedTaskIds.length, 2, "forced action update should append a new task FK")
    assert.notEqual(forcedTaskIds[1], forcedTaskIds[0], "forced action update should create a distinct task")

    const graphTasks = await loadGraphTasks(dir)
    const graphTaskIds = new Set(graphTasks.tasks.map((task) => task.id))
    for (const taskId of forcedTaskIds) {
      assert.ok(graphTaskIds.has(taskId), "all active task IDs should reference existing graph tasks")
    }
  })
})
