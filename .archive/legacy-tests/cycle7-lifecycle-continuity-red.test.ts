import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { initProject } from "../src/cli/init.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"
import { createEventHandler } from "../src/hooks/event-handler.js"
import { createStateManager } from "../src/lib/persistence.js"
import { loadGraphTasks, loadTrajectory } from "../src/lib/graph-io.js"
import { flushTaskManifestMutations } from "../src/lib/state-mutation-queue.js"
import type { Logger } from "../src/lib/logging.js"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const noopLogger: Logger = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
  debug: async () => {},
}

describe("Cycle7 RED: stale-task closure determinism and session-token continuity", () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "hm-cycle7-red-"))
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("RED: forced action after legacy fanout keeps only one active task FK and invalidates older in_progress task", async () => {
    const sessionTool = createHivemindSessionTool(dir)

    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Cycle7 stale closure determinism" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "tactic", content: "Ensure tactic" },
      {} as any,
    )

    await sessionTool.execute(
      { action: "update", level: "action", content: "Action one" },
      {} as any,
    )
    await sessionTool.execute(
      { action: "update", level: "action", content: "Action two" },
      {} as any,
    )

    const beforeForced = await loadTrajectory(dir)
    const originalTaskId = beforeForced?.trajectory?.active_task_ids?.[0]
    assert.ok(originalTaskId, "precondition: existing active task id should exist")

    await sessionTool.execute(
      { action: "update", level: "action", content: "Force a fresh action", forceNewActionTask: true },
      {} as any,
    )

    const afterForced = await loadTrajectory(dir)
    const activeTaskIds = afterForced?.trajectory?.active_task_ids ?? []
    assert.equal(
      activeTaskIds.length,
      1,
      "RED expected: forced action should collapse active_task_ids to a single canonical active task",
    )
    assert.notEqual(
      activeTaskIds[0],
      originalTaskId,
      "RED expected: forced action should rotate to a newly created task id",
    )

    const rawTasks = await loadGraphTasks(dir, { enabled: false })
    const oldTask = rawTasks.tasks.find((task) => task.id === originalTaskId)
    assert.equal(
      oldTask?.status,
      "invalidated",
      "RED expected: previous in_progress task should be invalidated deterministically",
    )
  })

  it("RED: todo.updated canonicalizes task related session_id to runtime UUID continuity", async () => {
    const sessionTool = createHivemindSessionTool(dir)
    await sessionTool.execute(
      { action: "start", mode: "plan_driven", focus: "Cycle7 session continuity" },
      {} as any,
    )
    const initialGraphTasks = await loadGraphTasks(dir, { enabled: false })
    const initialTaskCount = initialGraphTasks.tasks.length

    const state = await createStateManager(dir).load()
    const runtimeSessionId = state?.session.id
    assert.ok(runtimeSessionId, "precondition: runtime session id should exist")

    const handler = createEventHandler(noopLogger, dir)
    await handler({
      event: {
        type: "todo.updated",
        properties: {
          sessionID: "ses_foreign_event_token",
          todos: [
            {
              id: "continuity-1",
              content: "Preserve canonical session continuity",
              related_entities: {
                session_id: "ses_foreign_todo_token",
              },
            },
          ],
        },
      } as any,
    })
    await flushTaskManifestMutations()

    const graphTasks = await loadGraphTasks(dir, { enabled: false })
    const task = graphTasks.tasks.find(
      (entry) => entry.title === "Preserve canonical session continuity",
    )

    assert.equal(
      graphTasks.tasks.length,
      initialTaskCount + 1,
      "RED expected: todo.updated should append exactly one canonicalized task",
    )
    assert.ok(task, "task should exist")
    assert.match(
      task.id,
      UUID_RE,
      "RED expected: task.id should be a valid UUID",
    )
    assert.match(
      task.parent_phase_id,
      UUID_RE,
      "RED expected: task.parent_phase_id should be a valid UUID",
    )
  })
})
