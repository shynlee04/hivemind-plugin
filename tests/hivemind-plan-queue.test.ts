import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { createStateManager } from "../src/lib/persistence.js"
import { queueStateMutation } from "../src/lib/state-mutation-queue.js"
import { createConfig } from "../src/schemas/config.js"
import { generateSessionId } from "../src/schemas/brain-state.js"
import { createHivemindPlanTool } from "../src/tools/hivemind-plan.js"

describe("hivemind_plan queue discipline", () => {
  it("flushes queued state mutations before stamping active plan context", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-plan-queue-"))

    try {
      const stateManager = createStateManager(dir)
      await stateManager.initialize(generateSessionId(), createConfig())

      queueStateMutation({
        type: "UPDATE_STATE",
        payload: {
          first_turn_context_injected: true,
        },
        source: "test:hivemind-plan-queue",
      })

      const planTool = createHivemindPlanTool(dir)
      const raw = await planTool.execute(
        {
          action: "create",
          prefix: "META01",
          title: "Reduce hot-path surface",
          type: "root",
        },
        {} as any,
      )
      const parsed = JSON.parse(raw as string)

      assert.equal(parsed.status, "success")

      const state = await stateManager.load()
      assert(state)
      assert.equal(state.first_turn_context_injected, true)
      assert.equal(state.trajectory_context.active_plan_prefix, "META01")
      assert.equal(typeof state.trajectory_context.active_plan_id, "string")
      assert.equal(state.trajectory_context.active_plan_id!.length > 0, true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
