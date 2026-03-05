import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  DEFAULT_CONTEXT_BUDGET,
  computeSharedInjectionCapChars,
  estimateContextWindowChars,
  MIN_SHARED_INJECTION_CAP,
} from "../src/lib/budget.js"
import {
  clearTurnInjectionLedger,
  createTurnInjectionKey,
  createTurnInjectionLedger,
  detectInjectionPresence,
  getTurnInjectionLedger,
  reserveInjectionBudget,
} from "../src/lib/injection-orchestrator.js"

describe("injection dedupe contract", () => {
  it("normalizes context window chars from response token settings", () => {
    assert.equal(estimateContextWindowChars(undefined), 16384)
    assert.equal(estimateContextWindowChars(100), 8000)
    assert.equal(estimateContextWindowChars(12000), 48000)
  })

  it("applies a shared injection floor for small response-token budgets", () => {
    assert.equal(computeSharedInjectionCapChars(undefined), MIN_SHARED_INJECTION_CAP)
    assert.equal(computeSharedInjectionCapChars(4096), MIN_SHARED_INJECTION_CAP)
    assert.equal(computeSharedInjectionCapChars(100), MIN_SHARED_INJECTION_CAP)
  })

  it("scales shared injection cap upward and clamps it to the default ceiling", () => {
    assert.equal(computeSharedInjectionCapChars(12000), 7200)
    assert.equal(computeSharedInjectionCapChars(Number.MAX_SAFE_INTEGER), DEFAULT_CONTEXT_BUDGET)
  })

  it("detects first-turn empty prompt as no prior injection", () => {
    const presence = detectInjectionPresence({
      system: [],
      messages: [],
    })

    assert.equal(presence.core_system, false)
    assert.equal(presence.core_message, false)
    assert.equal(presence.plugin_message, false)
  })

  it("detects core and plugin channels from shared markers", () => {
    const presence = detectInjectionPresence({
      system: ["<hivemind>\nstatus\n</hivemind>"],
      messages: [
        {
          role: "user",
          content: "[SYSTEM ANCHOR: Trajectory | Active Task: A | Hierarchy: Active]",
        },
        {
          role: "system",
          content: "## GX-Pack Governance Context (Auto-Injected)",
        },
      ],
    })

    assert.equal(presence.core_system, true)
    assert.equal(presence.core_message, true)
    assert.equal(presence.plugin_message, true)
  })

  it("enforces deterministic budget priority under low remaining capacity", () => {
    clearTurnInjectionLedger()
    const turnKey = createTurnInjectionKey("session-a", 1)
    createTurnInjectionLedger({
      sessionId: "session-a",
      turnCount: 1,
      contextWindowChars: 10000,
    })

    const pluginGrant = reserveInjectionBudget({
      turnKey,
      channel: "plugin-message",
      requestedChars: 600,
    })
    const coreMessageGrant = reserveInjectionBudget({
      turnKey,
      channel: "core-message",
      requestedChars: 600,
    })
    const coreSystemGrant = reserveInjectionBudget({
      turnKey,
      channel: "core-system",
      requestedChars: 900,
    })

    assert.equal(pluginGrant, 150)
    assert.equal(coreMessageGrant, 525)
    assert.equal(coreSystemGrant, 825)
    assert.equal(
      reserveInjectionBudget({ turnKey, channel: "core-system", requestedChars: 20 }),
      0,
    )

    clearTurnInjectionLedger()
  })

  it("applies mid-session baseline distribution after bootstrap turns", () => {
    clearTurnInjectionLedger()
    const turnKey = createTurnInjectionKey("session-mid", 6)
    createTurnInjectionLedger({
      sessionId: "session-mid",
      turnCount: 6,
      contextWindowChars: 10000,
    })

    const pluginGrant = reserveInjectionBudget({
      turnKey,
      channel: "plugin-message",
      requestedChars: 300,
    })
    const coreMessageGrant = reserveInjectionBudget({
      turnKey,
      channel: "core-message",
      requestedChars: 900,
    })
    const coreSystemGrant = reserveInjectionBudget({
      turnKey,
      channel: "core-system",
      requestedChars: 900,
    })

    assert.equal(pluginGrant, 150)
    assert.equal(coreMessageGrant, 675)
    assert.equal(coreSystemGrant, 675)
    clearTurnInjectionLedger()
  })

  it("keeps compaction turn budget isolated from previous turn usage", () => {
    clearTurnInjectionLedger()
    const preCompactionKey = createTurnInjectionKey("session-compact", 12)
    createTurnInjectionLedger({
      sessionId: "session-compact",
      turnCount: 12,
      contextWindowChars: 10000,
    })
    reserveInjectionBudget({
      turnKey: preCompactionKey,
      channel: "core-message",
      requestedChars: 400,
    })

    const postCompactionKey = createTurnInjectionKey("session-compact", 0)
    createTurnInjectionLedger({
      sessionId: "session-compact",
      turnCount: 0,
      contextWindowChars: 10000,
    })

    const pluginGrant = reserveInjectionBudget({
      turnKey: postCompactionKey,
      channel: "plugin-message",
      requestedChars: 500,
    })
    const ledgerBefore = getTurnInjectionLedger(preCompactionKey)
    const ledgerAfter = getTurnInjectionLedger(postCompactionKey)

    assert.equal(pluginGrant, 150)
    assert.equal(ledgerBefore?.turn_count, 12)
    assert.equal(ledgerAfter?.turn_count, 0)
    assert.equal(ledgerBefore?.used_chars, 400)
    assert.equal(ledgerAfter?.used_chars, 150)
    clearTurnInjectionLedger()
  })

  it("honors explicit cap overrides without collapsing back to the legacy formula", () => {
    clearTurnInjectionLedger()
    const turnKey = createTurnInjectionKey("session-override", 2)

    createTurnInjectionLedger({
      sessionId: "session-override",
      turnCount: 2,
      contextWindowChars: 10000,
      capCharsOverride: MIN_SHARED_INJECTION_CAP,
    })

    const refreshed = createTurnInjectionLedger({
      sessionId: "session-override",
      turnCount: 2,
      contextWindowChars: 12000,
      capCharsOverride: MIN_SHARED_INJECTION_CAP,
    })

    assert.equal(refreshed.turn_key, turnKey)
    assert.equal(refreshed.cap_chars, MIN_SHARED_INJECTION_CAP)
    assert.equal(refreshed.context_window_chars, 12000)
    clearTurnInjectionLedger()
  })
})
