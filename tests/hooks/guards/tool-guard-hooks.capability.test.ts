/**
 * Integration tests for tool-guard-hooks with ToolIntelligenceEngine wiring.
 *
 * Verifies that the tool.execute.before hook correctly:
 * - Delegates to ToolIntelligenceEngine for evaluation
 * - Throws on block/needs_jit_grant decisions with guidance
 * - Passes through on allow decisions
 * - Exposes toolIntelligence metadata in tool.execute.after
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createToolGuardHooks } from "../../../src/hooks/guards/tool-guard-hooks.ts";
import type { ToolGuardDependencies } from "../../../src/hooks/guards/tool-guard-hooks.ts";
import { TaskStateManager } from "../../../src/shared/state.ts";
import {
  setDelegationMeta,
  getDelegationMeta,
} from "../../../src/shared/state.js";

/** Create a minimal TaskStateManager with no delegation depth (root session). */
function makeRootDeps(): ToolGuardDependencies {
  const stateManager = new TaskStateManager();
  return { stateManager };
}

/** Create deps where the session is a child session at depth 1.
 *  Uses module-level setDelegationMeta so the hook reads the same state.
 */
function makeChildDeps(sessionID: string): ToolGuardDependencies {
  const stateManager = new TaskStateManager();
  setDelegationMeta(sessionID, {
    rootID: "ses_root",
    depth: 1,
    budgetUsed: 1,
    agent: "hm-l2-coder",
    model: "test-model",
    queueKey: "default",
  });
  return { stateManager };
}

function makeBeforeInput(sessionID: string, tool: string): Record<string, unknown> {
  return { sessionID, tool };
}

function makeBeforeOutput(args: Record<string, unknown> = {}): Record<string, unknown> {
  return { args };
}

describe("tool-guard-hooks + ToolIntelligenceEngine integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Root session: native task should be allowed
  // ---------------------------------------------------------------------------
  describe("root session task dispatch", () => {
    it("allows native task with subagent_type from root session", async () => {
      const deps = makeRootDeps();
      const hooks = createToolGuardHooks(deps);
      const input = makeBeforeInput("ses_root1", "task");
      const output = makeBeforeOutput({
        subagent_type: "hm-l2-researcher",
        prompt: "research this",
      });

      // Should not throw
      await hooks["tool.execute.before"](input, output);
    });

    it("blocks task without subagent_type from root session", async () => {
      const deps = makeRootDeps();
      const hooks = createToolGuardHooks(deps);
      const input = makeBeforeInput("ses_root1", "task");
      const output = makeBeforeOutput({ prompt: "do something" });

      await expect(
        hooks["tool.execute.before"](input, output),
      ).rejects.toThrow("Tool intelligence block");
    });
  });

  // ---------------------------------------------------------------------------
  // Child session: native task should be blocked without JIT
  // ---------------------------------------------------------------------------
  describe("child session task dispatch", () => {
    it("blocks native task in child session", async () => {
      const deps = makeChildDeps("ses_child1");
      const hooks = createToolGuardHooks(deps);
      const input = makeBeforeInput("ses_child1", "task");
      const output = makeBeforeOutput({
        subagent_type: "hm-l2-coder",
        prompt: "implement",
      });

      await expect(
        hooks["tool.execute.before"](input, output),
      ).rejects.toThrow("needs_jit_grant");
    });
  });

  // ---------------------------------------------------------------------------
  // delegate-task: blocked for code intent
  // ---------------------------------------------------------------------------
  describe("delegate-task code intent blocking", () => {
    it("blocks delegate-task with implement intent", async () => {
      const deps = makeRootDeps();
      const hooks = createToolGuardHooks(deps);
      const input = makeBeforeInput("ses_root1", "delegate-task");
      const output = makeBeforeOutput({
        prompt: "Implement the new auth feature",
      });

      await expect(
        hooks["tool.execute.before"](input, output),
      ).rejects.toThrow("delegate-task blocked");
    });
  });

  // ---------------------------------------------------------------------------
  // Default: non-matching tools pass through
  // ---------------------------------------------------------------------------
  describe("default allow passthrough", () => {
    it("allows read tool without intervention", async () => {
      const deps = makeRootDeps();
      const hooks = createToolGuardHooks(deps);
      const input = makeBeforeInput("ses_root1", "read");
      const output = makeBeforeOutput({ filePath: "/some/file.ts" });

      await hooks["tool.execute.before"](input, output);
    });
  });

  // ---------------------------------------------------------------------------
  // After-hook metadata
  // ---------------------------------------------------------------------------
  describe("after-hook toolIntelligence metadata", () => {
    it("exposes toolIntelligence decision in metadata", async () => {
      const deps = makeRootDeps();
      const hooks = createToolGuardHooks(deps);
      const afterInput = { sessionID: "ses_root1", tool: "read" };
      const afterOutput: Record<string, unknown> = {};

      await hooks["tool.execute.after"](afterInput, afterOutput);

      const metadata = afterOutput.metadata as Record<string, unknown>;
      expect(metadata._harness).toBeDefined();
      const harness = metadata._harness as Record<string, unknown>;
      expect(harness.toolIntelligence).toBeDefined();
      expect(harness.toolIntelligence).toHaveProperty("kind");
      expect(harness.toolIntelligence).toHaveProperty("reason");
      expect(harness.toolIntelligence).toHaveProperty("timestamp");
    });
  });
});
