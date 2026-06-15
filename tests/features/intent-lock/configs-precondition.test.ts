/**
 * T1 — Configs.json precondition regression test.
 *
 * Per P27.2-SPEC §"Config State Violation" (line 76-78) and
 * P27.2-CONTEXT.md D-02 + D-06, `workflow.intent_lock.enabled` MUST be
 * `false` throughout P27.2 implementation. This test is a permanent
 * regression guard: any future toggle of the flag back to `true` fails
 * the suite, surfacing the violation before it can fire the gate in a
 * real session.
 *
 * The test loads the canonical `.hivemind/configs.json` from disk so it
 * cannot drift from the live config that the runtime reads.
 *
 * Evidence label: runtime-truthful (reads the actual config file the
 * gate will consume at startup).
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const CONFIGS_PATH = resolve(process.cwd(), ".hivemind/configs.json")

function readConfigs(): {
  workflow?: { intent_lock?: { enabled?: unknown } }
} {
  const raw = readFileSync(CONFIGS_PATH, "utf-8")
  return JSON.parse(raw) as {
    workflow?: { intent_lock?: { enabled?: unknown } }
  }
}

describe("configs.json — intent_lock precondition (P27.2 T1)", () => {
  it("the config file is parseable JSON", () => {
    expect(() => readConfigs()).not.toThrow()
  })

  it("workflow.intent_lock.enabled is a boolean", () => {
    const cfg = readConfigs()
    const enabled = cfg.workflow?.intent_lock?.enabled
    expect(typeof enabled).toBe("boolean")
  })

  it("workflow.intent_lock.enabled is false (P27.2-SPEC precondition, D-02, D-06)", () => {
    const cfg = readConfigs()
    const enabled = cfg.workflow?.intent_lock?.enabled
    // Hard assertion: any drift to `true` is a P27.2 precondition
    // violation that MUST fail this suite before reaching runtime.
    expect(enabled).toBe(false)
  })
})
