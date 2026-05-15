/**
 * Session classification hook tests (CP-ST-05-01, Task 1).
 *
 * Validates that a PreToolUse hook intercepts Task tool calls and records
 * classification intent in the PendingDispatchRegistry BEFORE the task tool
 * dispatches, enabling BEFORE-THE-FACT child session classification.
 *
 * @module tests/features/session-tracker/hooks/session-classification-hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createSessionClassificationHook,
  type SessionClassificationHookDeps,
} from "../../../../src/features/session-tracker/hooks/session-classification-hook.js"
import { PendingDispatchRegistry } from "../../../../src/features/session-tracker/persistence/pending-dispatch-registry.js"

describe("SessionClassificationHook (CP-ST-05-01 Task 1)", () => {
  let registry: PendingDispatchRegistry
  let deps: SessionClassificationHookDeps
  let hook: ReturnType<typeof createSessionClassificationHook>

  beforeEach(() => {
    vi.clearAllMocks()
    registry = new PendingDispatchRegistry()
    deps = {
      pendingRegistry: registry,
      parentSessionID: "ses_parent123456789ab",
      logWarn: vi.fn(),
    }
    hook = createSessionClassificationHook(deps)
  })

  describe("onPreToolUse", () => {
    it("records child classification before task tool dispatch", async () => {
      await hook.onPreToolUse({
        toolName: "Task",
        sessionId: "ses_parent123456789ab",
        input: {
          subagentType: "general",
          prompt: "do work",
          description: "test task",
        },
      })

      expect(registry.size).toBeGreaterThan(0)
    })

    it("does not record for non-task tools", async () => {
      await hook.onPreToolUse({
        toolName: "read",
        sessionId: "ses_parent123456789ab",
        input: { path: "some/file.ts" },
      })

      expect(registry.size).toBe(0)
    })

    it("records delegationDepth from input", async () => {
      await hook.onPreToolUse({
        toolName: "Task",
        sessionId: "ses_parent123456789ab",
        input: {
          subagentType: "hm-l2-researcher",
          prompt: "research something",
          description: "research task",
          delegationDepth: 2,
        },
      })

      // The entry should have been recorded with delegationDepth: 2
      const entries = registry.getAll()
      expect(entries.length).toBe(1)
      expect(entries[0].delegationDepth).toBe(2)
    })

    it("defaults delegationDepth to 1 when not specified", async () => {
      await hook.onPreToolUse({
        toolName: "Task",
        sessionId: "ses_parent123456789ab",
        input: {
          subagentType: "general",
          prompt: "do work",
          description: "test task",
        },
      })

      const entries = registry.getAll()
      expect(entries.length).toBe(1)
      expect(entries[0].delegationDepth).toBe(1)
    })

    it("is best-effort — never throws on registry failure", async () => {
      // Simulate a broken registry
      deps.pendingRegistry = {
        add: () => {
          throw new Error("registry broken")
        },
      } as unknown as PendingDispatchRegistry

      await expect(
        hook.onPreToolUse({
          toolName: "Task",
          sessionId: "ses_parent123456789ab",
          input: {
            subagentType: "general",
            prompt: "do work",
            description: "test task",
          },
        }),
      ).resolves.not.toThrow()
    })
  })
})
