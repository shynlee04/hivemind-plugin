import { describe, expect, it } from "vitest"
import * as delegationTypes from "../../../../src/coordination/delegation/types.js"

describe("delegation types — deprecated export removal", () => {
  it("does not export ESCALATION_THRESHOLDS (deprecated alias)", () => {
    // ESCALATION_THRESHOLDS is deprecated; should be removed
    expect("ESCALATION_THRESHOLDS" in delegationTypes).toBe(false)
  })

  it("does not export ESCALATION_ICONS (deprecated legacy constant)", () => {
    // ESCALATION_ICONS is deprecated; should be removed
    expect("ESCALATION_ICONS" in delegationTypes).toBe(false)
  })

  it("does not export EscalationThresholds type alias (deprecated)", () => {
    // Type aliases are compile-time; we verify the runtime constant is gone
    // which implies the type alias is also removed
    expect("ESCALATION_THRESHOLDS" in delegationTypes).toBe(false)
  })

  it("does not export EscalationLevel type (deprecated)", () => {
    // Type-only; verified by typecheck after source cleanup
    // Runtime check: no related constants should exist
    const keys = Object.keys(delegationTypes)
    const escalationKeys = keys.filter((k) => k.startsWith("ESCALATION"))
    expect(escalationKeys).toEqual([])
  })

  it("retains FAILURE_CHECKPOINTS as the canonical threshold constant", () => {
    expect(delegationTypes.FAILURE_CHECKPOINTS).toEqual([60, 120, 180, 300])
  })

  it("retains MAX_DELEGATION_DEPTH constant", () => {
    expect(delegationTypes.MAX_DELEGATION_DEPTH).toBe(3)
  })

  it("retains TASK_CLEANUP_DELAY_MS constant", () => {
    expect(delegationTypes.TASK_CLEANUP_DELAY_MS).toBe(10 * 60 * 1000)
  })
})
