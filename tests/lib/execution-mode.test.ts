/**
 * Unit tests for the execution-mode classifier.
 *
 * Covers execution-family selection and the single built-in subsession lane.
 *
 * Behaviours tested:
 *  1. Parallel-independent tasks prefer visible-worker family when tmux is available.
 *  2. If tmux is unavailable, the classifier records the fallback and still returns
 *     a built-in family decision.
 *  3. Built-in family resolves to `builtin-subsession` for current delegated work.
 */
import { describe, it, expect } from "vitest"
import {
  classifyExecutionMode,
  resolveBuiltInMode,
  type TaskCharacteristics,
  type RuntimeCapabilities,
  DEFAULT_ALLOWED_COMMANDS,
} from "../../src/lib/execution-mode.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChars(overrides: Partial<TaskCharacteristics> = {}): TaskCharacteristics {
  return {
    isParallel: false,
    isInteractive: false,
    isResearch: false,
    isHeadless: false,
    runInBackground: false,
    ...overrides,
  }
}

function makeCapabilities(overrides: Partial<RuntimeCapabilities> = {}): RuntimeCapabilities {
  return {
    hasTmux: false,
    projectRoot: "/fake/project",
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Test 1: Parallel-independent tasks prefer visible-worker family when tmux
//         is available.
// ---------------------------------------------------------------------------

describe("classifyExecutionMode — visible-worker family", () => {
  it("prefers visible-worker family when tmux is available and task is parallel without background delegation", () => {
    const result = classifyExecutionMode(
      makeChars({ isParallel: true, runInBackground: false }),
      makeCapabilities({ hasTmux: true }),
    )
    expect(result.family).toBe("visible-worker")
    expect(result.submode).toBe("tmux-pane")
    expect(result.rationale).toContain("tmux")
  })

  it("visible-worker result includes tmux capability evidence", () => {
    const result = classifyExecutionMode(
      makeChars({ isParallel: true, runInBackground: false }),
      makeCapabilities({ hasTmux: true }),
    )
    expect(result.capabilityEvidence.hasTmux).toBe(true)
  })

  it("tmux-pane submode is distinct from builtin-subsession", () => {
    const tmuxResult = classifyExecutionMode(
      makeChars({ isParallel: true, runInBackground: false }),
      makeCapabilities({ hasTmux: true }),
    )
    const subsessionResult = classifyExecutionMode(
      makeChars({ isInteractive: true }),
      makeCapabilities({ hasTmux: true }),
    )
    expect(tmuxResult.submode).toBe("tmux-pane")
    expect(subsessionResult.submode).toBe("builtin-subsession")
    expect(tmuxResult.submode).not.toBe(subsessionResult.submode)
  })
})

// ---------------------------------------------------------------------------
// Test 2: If tmux is unavailable, the classifier records the fallback and
//         still returns a built-in family decision.
// ---------------------------------------------------------------------------

describe("classifyExecutionMode — fallback when no tmux", () => {
  it("falls back to built-in family when tmux is unavailable for visible-worker task", () => {
    const result = classifyExecutionMode(
      makeChars({ isParallel: true, runInBackground: false }),
      makeCapabilities({ hasTmux: false }),
    )
    expect(result.family).toBe("built-in")
    expect(result.rationale).toContain("fallback")
    expect(result.rationale).toContain("tmux")
  })

  it("uses a non-background fallback rationale when tmux is unavailable", () => {
    const result = classifyExecutionMode(
      makeChars({ isParallel: true, runInBackground: false }),
      makeCapabilities({ hasTmux: false }),
    )

    expect(result.rationale.toLowerCase()).toContain("parallel task")
    expect(result.rationale.toLowerCase()).not.toContain("parallel background task")
  })

  it("keeps background delegate-task work on builtin-subsession even when tmux is available", () => {
    const result = classifyExecutionMode(
      makeChars({ isParallel: true, isInteractive: true, isHeadless: true, runInBackground: true }),
      makeCapabilities({ hasTmux: true }),
    )

    expect(result.family).toBe("built-in")
    expect(result.submode).toBe("builtin-subsession")
    expect(result.rationale.toLowerCase()).not.toContain("tmux-pane")
    expect(result.rationale.toLowerCase()).not.toContain("builtin-process")
  })

  it("keeps background delegate-task research work on builtin-subsession without process fallback", () => {
    const result = classifyExecutionMode(
      makeChars({ isParallel: true, isResearch: true, isHeadless: true, runInBackground: true }),
      makeCapabilities({ hasTmux: false }),
    )

    expect(result.family).toBe("built-in")
    expect(result.submode).toBe("builtin-subsession")
    expect(result.rationale.toLowerCase()).not.toContain("builtin-process")
  })

  it("returns built-in for non-parallel tasks regardless of tmux", () => {
    const result = classifyExecutionMode(
      makeChars({ isParallel: false, runInBackground: false }),
      makeCapabilities({ hasTmux: true }),
    )
    expect(result.family).toBe("built-in")
  })
})

// ---------------------------------------------------------------------------
// Test 3: Simplified built-in family resolves to `builtin-subsession`
//         for all current tasks while builtin-process is detached.
// ---------------------------------------------------------------------------

describe("resolveBuiltInMode", () => {
  it("resolves to builtin-subsession for interactive tasks", () => {
    const result = resolveBuiltInMode(makeChars({ isInteractive: true }))
    expect(result.submode).toBe("builtin-subsession")
    expect(result.rationale.toLowerCase()).toContain("interactive")
  })

  it("resolves to builtin-subsession for research tasks", () => {
    const result = resolveBuiltInMode(makeChars({ isResearch: true }))
    expect(result.submode).toBe("builtin-subsession")
    expect(result.rationale.toLowerCase()).toContain("subsession")
  })

  it("resolves to builtin-subsession for headless tasks", () => {
    const result = resolveBuiltInMode(makeChars({ isHeadless: true }))
    expect(result.submode).toBe("builtin-subsession")
    expect(result.rationale.toLowerCase()).toContain("subsession")
  })

  it("defaults to builtin-subsession when no special flags are set", () => {
    const result = resolveBuiltInMode(makeChars())
    expect(result.submode).toBe("builtin-subsession")
  })
})

// ---------------------------------------------------------------------------
// Classifier rationale / auditing
// ---------------------------------------------------------------------------

describe("classifyExecutionMode — rationale and auditing", () => {
  it("includes the task characteristics that drove the decision", () => {
    const result = classifyExecutionMode(
      makeChars({ isParallel: true, isResearch: false, runInBackground: true }),
      makeCapabilities({ hasTmux: false }),
    )
    expect(result.rationale).toBeTruthy()
    expect(result.characteristics).toBeDefined()
    expect(result.characteristics.isParallel).toBe(true)
  })

  it("includes capability snapshot for parent verification", () => {
    const result = classifyExecutionMode(
      makeChars(),
      makeCapabilities({ hasTmux: false, projectRoot: "/work" }),
    )
    expect(result.capabilityEvidence).toBeDefined()
    expect(result.capabilityEvidence.hasTmux).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// DEFAULT_ALLOWED_COMMANDS
// ---------------------------------------------------------------------------

describe("DEFAULT_ALLOWED_COMMANDS", () => {
  it("contains the commands from the schema draft", () => {
    expect(DEFAULT_ALLOWED_COMMANDS).toContain("node")
    expect(DEFAULT_ALLOWED_COMMANDS).toContain("npm")
    expect(DEFAULT_ALLOWED_COMMANDS).toContain("npx")
    expect(DEFAULT_ALLOWED_COMMANDS).toContain("pnpm")
    expect(DEFAULT_ALLOWED_COMMANDS).toContain("vitest")
  })

  it("is a readonly array (not mutable at runtime)", () => {
    expect(Array.isArray(DEFAULT_ALLOWED_COMMANDS)).toBe(true)
  })
})
