/**
 * CP-ST-03-01: Event-Tracker Excision — Excision verification
 *
 * RED phase: These tests MUST FAIL because event-tracker files and references
 * currently exist. GREEN phase: After deletion, these tests MUST PASS.
 *
 * @tests verify zero event-tracker source files, test files, and code references
 */
import { describe, it, expect } from "vitest"
import { existsSync } from "node:fs"
import { join } from "node:path"

const PROJECT_ROOT = join(import.meta.dirname, "..")

describe("CP-ST-03-01: Event-Tracker Excision (RED — MUST FAIL)", () => {
  it("AC-01: src/task-management/journal/event-tracker/ directory does not exist", () => {
    const path = join(PROJECT_ROOT, "src", "task-management", "journal", "event-tracker")
    expect(existsSync(path)).toBe(false)
  })

  it("AC-09: tests/lib/event-tracker/ directory does not exist", () => {
    const path = join(PROJECT_ROOT, "tests", "lib", "event-tracker")
    expect(existsSync(path)).toBe(false)
  })

  it("AC-02: src/index.ts has no event-tracker export", () => {
    // This imports and checks — if the import still exists, the test fails
    // because the module being exported still exists
    const indexPath = join(PROJECT_ROOT, "src", "index.ts")
    const { readFileSync } = require("node:fs")
    const content = readFileSync(indexPath, "utf-8")
    expect(content).not.toMatch(/event-tracker/)
  })

  it("AC-04: event-observers.ts has no SessionJourneyEventFact or createSessionJourneyEventObserver", () => {
    const { readFileSync } = require("node:fs")
    const content = readFileSync(
      join(PROJECT_ROOT, "src", "hooks", "observers", "event-observers.ts"),
      "utf-8"
    )
    expect(content).not.toMatch(/createSessionJourneyEventObserver|SessionJourneyEventFact/)
  })

  it("AC-06: readonly-state.ts CANONICAL_PREFIXES has no event-tracker", () => {
    const { readFileSync } = require("node:fs")
    const content = readFileSync(
      join(PROJECT_ROOT, "src", "sidecar", "readonly-state.ts"),
      "utf-8"
    )
    expect(content).not.toMatch(/event-tracker/)
  })

  it("AC-07: structure.ts TIER_1_DIRECTORIES has no event-tracker", () => {
    const { readFileSync } = require("node:fs")
    const content = readFileSync(
      join(PROJECT_ROOT, "src", "features", "bootstrap", "structure.ts"),
      "utf-8"
    )
    expect(content).not.toMatch(/"event-tracker"/)
  })

  it("AC-05: session-tracker/index.ts has no removeLegacyStateFiles", () => {
    const { readFileSync } = require("node:fs")
    const content = readFileSync(
      join(PROJECT_ROOT, "src", "features", "session-tracker", "index.ts"),
      "utf-8"
    )
    expect(content).not.toMatch(/removeLegacyStateFiles/)
  })

  it("AC-03/AC-13: plugin.ts has no event-tracker/dead code references", () => {
    const { readFileSync } = require("node:fs")
    const content = readFileSync(
      join(PROJECT_ROOT, "src", "plugin.ts"),
      "utf-8"
    )
    expect(content).not.toMatch(
      /event-tracker|consumeJourneyFact|sessionJourneyEventObserver|createEventTrackerArtifactsFromHook|shouldTrackEventTrackerEvent/
    )
  })
})
