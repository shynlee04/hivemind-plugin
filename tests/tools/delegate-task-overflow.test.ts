/**
 * GAP G-1: JSON serialization overflow for long prompts
 *
 * Task ID: 08-01-02
 * Requirement: delegate-task must handle oversized/long prompts gracefully without crashing.
 *
 * Observed failure: Background agent (MiniMax-M2.7) calling delegate-task with long prompts
 * got repeated `JSON Parse error: Unexpected EOF`, crashing the TUI.
 *
 * Root cause hypothesis: OpenCode platform truncates JSON tool input at serialization layer
 * when prompt exceeds internal limits. The tool does not bound/truncate prompts before
 * passing to SDK, so a >100KB prompt flows through unbounded.
 *
 * These tests verify behavioral resilience:
 * - The tool does not crash on oversized input
 * - buildPromptText handles arbitrarily large strings
 * - The lifecycle manager receives bounded prompt text or an error is thrown
 */
import { describe, it, expect, beforeEach, vi } from "vitest"

import { buildPromptText } from "../../src/lib/helpers.js"
import { taskState } from "../../src/lib/state.js"
import type { HarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import type { OpenCodeClient } from "../../src/lib/session-api.js"
import { createDelegateTaskTool } from "../../src/tools/delegate-task.js"

// ---------------------------------------------------------------------------
// Helpers (mirroring delegate-task.test.ts patterns)
// ---------------------------------------------------------------------------

const mockCtx = {
  messageID: "message-overflow-1",
  sessionID: "parent-session",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => {},
}

function createClient(sessionMap: Record<string, Record<string, unknown>>): OpenCodeClient {
  return {
    session: {
      get: vi.fn(async ({ path }: { path: { id: string } }) => ({ data: sessionMap[path.id] })),
    },
  } as unknown as OpenCodeClient
}

function createLifecycleManagerMock() {
  const launchDelegatedSession = vi.fn(async (_args: unknown) => "delegated-session")

  return {
    lifecycleManager: {
      launchDelegatedSession,
    } as unknown as HarnessLifecycleManager,
    launchDelegatedSession,
  }
}

/**
 * Generate a string of approximately `sizeBytes` bytes.
 * Uses a repeating pattern to avoid excessive memory overhead.
 */
function generateLargeString(sizeBytes: number): string {
  const chunk = "A".repeat(1024) // 1KB chunk
  const repetitions = Math.ceil(sizeBytes / chunk.length)
  return chunk.repeat(repetitions).slice(0, sizeBytes)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("delegate-task overflow: oversized prompt handling", () => {
  beforeEach(() => {
    taskState.clear()
  })

  it("does not crash when executing with a 150KB prompt", async () => {
    const oversizedPrompt = generateLargeString(150 * 1024) // 150KB

    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    // The tool should either succeed or throw a meaningful error — never crash silently
    let result: string | undefined
    let threw = false
    let thrownMessage = ""

    try {
      result = await tool.execute(
        {
          description: "Large prompt overflow test",
          prompt: oversizedPrompt,
          run_in_background: true,
        },
        mockCtx,
      )
    } catch (err) {
      threw = true
      thrownMessage = err instanceof Error ? err.message : String(err)
    }

    // Either the tool succeeds (passes the prompt through) or throws a meaningful error
    // In both cases, the process should not crash
    if (threw) {
      // If it throws, the error should be a meaningful Harness error, not a cryptic JSON parse error
      expect(thrownMessage).not.toContain("Unexpected EOF")
      expect(thrownMessage).not.toContain("JSON Parse error")
    } else {
      // If it succeeds, the lifecycle manager should have been called
      expect(result).toBeDefined()
      expect(launchDelegatedSession).toHaveBeenCalledTimes(1)
    }
  })

  it("launchDelegatedSession receives the full promptText for oversized prompts", async () => {
    const oversizedPrompt = generateLargeString(100 * 1024) // 100KB

    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Large prompt passthrough",
        prompt: oversizedPrompt,
        run_in_background: true,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      promptText: string
    }

    // The promptText should contain the original prompt content
    // (buildPromptText concatenates description + prompt + other sections)
    expect(launchArgs.promptText).toContain(oversizedPrompt)
    expect(launchArgs.promptText.length).toBeGreaterThan(100 * 1024)
  })

  it("buildPromptText handles 200KB prompt without error", () => {
    const oversizedPrompt = generateLargeString(200 * 1024) // 200KB

    // buildPromptText is a pure function — verify it doesn't crash
    const result = buildPromptText({
      description: "Massive prompt test",
      prompt: oversizedPrompt,
      agent: "researcher",
      category: "research",
      scope: "overflow-test",
      constraints: ["Do not crash", "Handle gracefully"],
      requiredTools: ["read", "grep"],
      mustNotDo: ["edit", "write"],
    })

    expect(result).toBeDefined()
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(200 * 1024)
    expect(result).toContain("Massive prompt test")
    expect(result).toContain(oversizedPrompt)
  })

  it("buildPromptText handles 1MB prompt without error", () => {
    // Extreme edge case — verify no OOM or string overflow
    const hugePrompt = generateLargeString(1024 * 1024) // 1MB

    const result = buildPromptText({
      description: "Extreme prompt test",
      prompt: hugePrompt,
    })

    expect(result).toBeDefined()
    expect(typeof result).toBe("string")
    expect(result).toContain("Extreme prompt test")
  })

  it("handles oversized prompt combined with many constraints", async () => {
    const oversizedPrompt = generateLargeString(50 * 1024) // 50KB
    const manyConstraints = Array.from({ length: 100 }, (_, i) => `Constraint ${i}: ${"x".repeat(500)}`)

    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Large prompt + many constraints",
        prompt: oversizedPrompt,
        constraints: manyConstraints,
        run_in_background: true,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      promptText: string
      constraints: string[]
    }

    // All constraints should be passed through
    expect(launchArgs.constraints).toHaveLength(100)
    expect(launchArgs.promptText.length).toBeGreaterThan(50 * 1024)
  })

  it("handles empty string prompt gracefully", async () => {
    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Empty prompt test",
        prompt: "",
        run_in_background: false,
      },
      mockCtx,
    )

    // Should still launch — empty prompt is not a crash condition
    expect(launchDelegatedSession).toHaveBeenCalledTimes(1)

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      promptText: string
    }

    // buildPromptText with empty prompt still produces sections
    expect(launchArgs.promptText).toContain("TASK: Empty prompt test")
  })
})
