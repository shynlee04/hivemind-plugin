import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createMessagesTransformHook, type MessageV2 } from "../src/hooks/messages-transform.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { clearTurnInjectionLedger, createTurnInjectionKey, getTurnInjectionLedger } from "../src/lib/injection-orchestrator.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { MIN_SHARED_INJECTION_CAP } from "../src/lib/budget.js"
import { createBrainState, unlockSession } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

function createUserMessage(text: string, sessionID: string): MessageV2 {
  return {
    info: {
      id: "msg_user_1",
      sessionID,
      role: "user",
      time: { created: Date.now() },
      agent: "test",
      model: { providerID: "test", modelID: "test" },
    } as any,
    parts: [
      {
        id: "msg_user_1_part_1",
        sessionID,
        messageID: "msg_user_1",
        type: "text",
        text,
      },
    ],
  }
}

describe("budget hook cap integration", () => {
  it("applies the same shared turn cap in session lifecycle and messages transform hooks", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-budget-hooks-"))
    clearTurnInjectionLedger()

    try {
      await initializePlanningDirectory(dir)

      const config = createConfig({
        governance_mode: "assisted",
        agent_behavior: {
          constraints: {
            max_response_tokens: 4096,
          },
        },
      })
      await saveConfig(dir, config)

      const stateManager = createStateManager(dir)
      const state = unlockSession(createBrainState("budget-session", config, "plan_driven"))
      state.metrics.turn_count = 1
      await stateManager.save(state)

      const logger = {
        debug: async (_message: string) => {},
        info: async (_message: string) => {},
        warn: async (_message: string) => {},
        error: async (_message: string) => {},
      }

      const lifecycleHook = createSessionLifecycleHook(logger, dir, config)
      const lifecycleOutput = { system: [] as string[], messages: [createUserMessage("hello", "budget-session")] }
      await lifecycleHook({ sessionID: "budget-session" }, lifecycleOutput)

      const turnKey = createTurnInjectionKey("budget-session", 1)
      assert.equal(getTurnInjectionLedger(turnKey)?.cap_chars, MIN_SHARED_INJECTION_CAP)
      assert.doesNotMatch(
        lifecycleOutput.system.join("\n"),
        /Session: .* \| Mode: .* \| Governance: assisted/,
      )

      const messagesHook = createMessagesTransformHook({ warn: async () => {} }, dir)
      const messageOutput = { messages: [createUserMessage("hello again", "budget-session")] }
      await messagesHook({}, messageOutput)

      const ledger = getTurnInjectionLedger(turnKey)
      assert.equal(ledger?.cap_chars, MIN_SHARED_INJECTION_CAP)
      assert(ledger !== undefined)
      assert(ledger.used_chars > 0)
      assert(ledger.used_chars <= ledger.cap_chars)
      assert.equal(messageOutput.messages.length, 1)
    } finally {
      clearTurnInjectionLedger()
      await rm(dir, { recursive: true, force: true })
    }
  })
})
