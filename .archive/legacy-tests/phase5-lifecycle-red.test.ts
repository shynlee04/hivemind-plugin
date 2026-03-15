import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { initProject } from "../src/cli/init.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"
import { addGraphTask, loadTrajectory, loadGraphMems, loadGraphTasks } from "../src/lib/graph-io.js"
import { loadTree } from "../src/lib/hierarchy-tree.js"
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
    const trajectorySessionId = trajectory?.trajectory?.session_id
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
    assert.equal(forcedTaskIds.length, 1, "forced action update should rotate to a single active task FK")
    assert.notEqual(forcedTaskIds[0], firstTaskIds[0], "forced action update should create a distinct task")

    const rawGraphTasks = await loadGraphTasks(dir, { enabled: false })
    const oldTask = rawGraphTasks.tasks.find((task) => task.id === firstTaskIds[0])
    assert.equal(oldTask?.status, "invalidated", "previous in_progress task should be invalidated")
  })

  it("RED: repeated action updates preserve a single active action under the current tactic", async () => {
    const sessionTool = createHivemindSessionTool(dir)

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Single active action invariant" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "tactic", content: "Operate within one tactic" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "action", content: "First action" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "action", content: "Second action" },
      {} as any,
    )

    const tree = await loadTree(dir)
    assert.ok(tree.root, "tree root should exist")

    const tactic = tree.root?.children.filter((node) => node.level === "tactic").at(-1)
    assert.ok(tactic, "expected at least one tactic node")

    const activeActions = (tactic?.children ?? []).filter(
      (node) => node.level === "action" && node.status === "active",
    )

    assert.equal(
      activeActions.length,
      1,
      "RED expected: only one action should remain active under tactic after repeated action updates",
    )
  })

  it("RED: update_action keeps a single active task FK (no append fanout)", async () => {
    const sessionTool = createHivemindSessionTool(dir)

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Single active task invariant" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "tactic", content: "Ensure tactic context" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "action", content: "First task binding" },
      {} as any,
    )

    const afterFirst = await loadTrajectory(dir)
    const firstTaskIds = afterFirst?.trajectory?.active_task_ids ?? []
    assert.equal(firstTaskIds.length, 1, "precondition: first action update should create one active task FK")

    await sessionTool.execute(
      { action: "update", level: "action", content: "Force replacement", forceNewActionTask: true },
      {} as any,
    )

    const afterForced = await loadTrajectory(dir)
    const forcedTaskIds = afterForced?.trajectory?.active_task_ids ?? []

    assert.equal(
      forcedTaskIds.length,
      1,
      "RED expected: forceNewActionTask should rotate to a single active task FK, not append fanout",
    )
  })

  it("RED: action update runtime flow reconciles stale in_progress tasks", async () => {
    const sessionTool = createHivemindSessionTool(dir)

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Reconcile stale tasks via runtime action update" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "tactic", content: "Ensure active phase" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "action", content: "Seed active task" },
      {} as any,
    )

    const trajectoryBefore = await loadTrajectory(dir)
    const phaseId = trajectoryBefore?.trajectory?.active_phase_id
    const activeTaskIds = trajectoryBefore?.trajectory?.active_task_ids ?? []
    assert.ok(phaseId, "precondition: active_phase_id should exist")
    assert.equal(activeTaskIds.length, 1, "precondition: one active task should exist")

    const staleTaskId = crypto.randomUUID()
    const now = new Date().toISOString()
    await addGraphTask(dir, {
      id: staleTaskId,
      parent_phase_id: phaseId as string,
      title: "stale in-progress task",
      status: "in_progress",
      file_locks: [],
      created_at: now,
      updated_at: now,
    })

    await sessionTool.execute(
      { action: "update", level: "action", content: "Trigger runtime action reconciliation" },
      {} as any,
    )

    const graphAfter = await loadGraphTasks(dir, { enabled: false })
    const staleTask = graphAfter.tasks.find((task) => task.id === staleTaskId)
    assert.equal(
      staleTask?.status,
      "invalidated",
      "RED expected: stale in_progress task should be invalidated by runtime action update reconciliation",
    )
  })

  it("RED: start keeps trajectory.session_id aligned with active runtime session", async () => {
    const sessionTool = createHivemindSessionTool(dir)
    const stateManager = createStateManager(dir)

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Session parity baseline" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "close", summary: "close baseline session" },
      {} as any,
    )

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Session parity second start" },
      {} as any,
    )

    const state = await stateManager.load()
    const trajectory = await loadTrajectory(dir)
    const trajectorySessionId = trajectory?.trajectory?.session_id

    assert.ok(state?.session.id, "runtime session id should exist after second start")
    assert.ok(trajectorySessionId, "trajectory session_id should exist after second start")
    assert.equal(
      trajectorySessionId,
      state?.session.id,
      "RED expected: trajectory.session_id must match runtime state.session.id on each start",
    )
  })
})
