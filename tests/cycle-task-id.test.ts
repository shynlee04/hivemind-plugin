import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import test from "node:test"

import { createSoftGovernanceHook } from "../src/hooks/soft-governance.js"
import { noopLogger } from "../src/lib/logging.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { createHivemindCycleTool } from "../src/tools/hivemind-cycle.js"
import {
  addCycleLogEntry,
  createBrainState,
  generateSessionId,
  unlockSession,
} from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

test("addCycleLogEntry stores optional task_id for delegation continuity", () => {
  const config = createConfig({ governance_mode: "assisted" })
  const state = createBrainState(generateSessionId(), config)
  const taskId = randomUUID()

  const updated = addCycleLogEntry(state, "task", "Delegation completed successfully.", { taskId })

  assert.equal(updated.cycle_log.length, 1)
  assert.equal(updated.cycle_log[0].tool, "task")
  assert.equal(updated.cycle_log[0].task_id, taskId)
})

test("soft-governance captures task_id from task metadata and export preserves it", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hm-cycle-task-id-"))

  try {
    await initializePlanningDirectory(dir)

    const config = createConfig({ governance_mode: "assisted" })
    await saveConfig(dir, config)

    const stateManager = createStateManager(dir)
    const state = unlockSession(createBrainState(generateSessionId(), config))
    await stateManager.save(state)

    const hook = createSoftGovernanceHook(noopLogger, dir, config)
    const taskId = randomUUID()

    await hook(
      { tool: "task", sessionID: state.session.id, callID: "call-1" },
      {
        title: "Task",
        output: "Subagent completed handoff.",
        metadata: { task_id: taskId },
      },
    )

    const updated = await stateManager.load()
    assert.ok(updated)
    assert.equal(updated.cycle_log.length, 1)
    assert.equal(updated.cycle_log[0].task_id, taskId)

    const cycleTool = createHivemindCycleTool(dir)
    const exportResult = JSON.parse(await cycleTool.execute({ action: "export" }, {} as never))

    assert.equal(exportResult.status, "success")
    assert.equal(exportResult.metadata.cycleLog[0].task_id, taskId)

    const exportPath = exportResult.metadata.exportPath as string
    const exportedState = JSON.parse(await readFile(exportPath, "utf-8")) as {
      cycle_log?: Array<{ task_id?: string }>
    }

    assert.equal(exportedState.cycle_log?.[0]?.task_id, taskId)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
