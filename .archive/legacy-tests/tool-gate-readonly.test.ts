import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createToolGateHookInternal } from "../src/hooks/tool-gate.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { clearMutationQueue, getPendingMutationCount } from "../src/lib/state-mutation-queue.js"
import { noopLogger } from "../src/lib/logging.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

describe("tool-gate readonly contract", () => {
  it("does not queue persisted mutations for write-tool advisories", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-tool-gate-readonly-"))
    clearMutationQueue()

    try {
      await initializePlanningDirectory(dir)
      const config = createConfig({ governance_mode: "assisted" })
      await saveConfig(dir, config)

      const stateManager = createStateManager(dir)
      const state = unlockSession(createBrainState(generateSessionId(), config))
      state.first_turn_confirmation = { ...state.first_turn_confirmation, required: false, confirmed: true }
      await stateManager.save(state)

      const hook = createToolGateHookInternal(noopLogger, dir, config)
      const result = await hook({ sessionID: "test-session", tool: "write" })

      assert.equal(result.allowed, true)
      assert.equal(getPendingMutationCount(), 0)
    } finally {
      clearMutationQueue()
      await rm(dir, { recursive: true, force: true })
    }
  })
})
