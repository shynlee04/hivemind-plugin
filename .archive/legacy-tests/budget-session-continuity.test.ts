import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  clearTurnInjectionLedger,
  createTurnInjectionKey,
  createTurnInjectionLedger,
  getTurnInjectionLedger,
} from "../src/lib/injection-orchestrator.js"
import {
  clearMutationQueue,
  getPendingMutationCount,
  queueStateMutation,
} from "../src/lib/state-mutation-queue.js"
import { inferSessionKindFromRole, resolveSessionRoleContext } from "../src/lib/session-role.js"
import { createBrainState } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

describe("budget session continuity", () => {
  it("keeps mutation queues partitioned by session id", () => {
    clearMutationQueue()

    queueStateMutation(
      { type: "UPDATE_STATE", payload: { version: "main" }, source: "main-test" },
      "main-session",
    )
    queueStateMutation(
      { type: "UPDATE_STATE", payload: { version: "sub" }, source: "sub-test" },
      "sub-session",
    )

    assert.equal(getPendingMutationCount("main-session"), 1)
    assert.equal(getPendingMutationCount("sub-session"), 1)
    assert.equal(getPendingMutationCount(), 0)

    clearMutationQueue()
  })

  it("keeps turn ledgers isolated for main and sub sessions on the same turn number", () => {
    clearTurnInjectionLedger()

    const mainKey = createTurnInjectionKey("main-session", 4)
    const subKey = createTurnInjectionKey("sub-session", 4)

    createTurnInjectionLedger({
      sessionId: "main-session",
      turnCount: 4,
      contextWindowChars: 20000,
      capCharsOverride: 6000,
    })
    createTurnInjectionLedger({
      sessionId: "sub-session",
      turnCount: 4,
      contextWindowChars: 20000,
      capCharsOverride: 6000,
    })

    assert.notEqual(mainKey, subKey)
    assert.equal(getTurnInjectionLedger(mainKey)?.session_id, "main-session")
    assert.equal(getTurnInjectionLedger(subKey)?.session_id, "sub-session")

    clearTurnInjectionLedger()
  })

  it("continues to resolve main and sub session roles independently of budget changes", () => {
    const config = createConfig()
    const mainState = createBrainState("main-session", config, "plan_driven")
    mainState.session.role = "hivefiver"

    const subState = createBrainState("sub-session", config, "plan_driven")
    subState.session.role = "hivemaker"

    assert.equal(inferSessionKindFromRole("hivefiver"), "main")
    assert.equal(inferSessionKindFromRole("hivemaker"), "sub")
    assert.equal(resolveSessionRoleContext(mainState).kind, "main")
    assert.equal(resolveSessionRoleContext(subState).kind, "sub")
  })
})
