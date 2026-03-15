/**
 * Tests for Auto-Context State
 *
 * US-051: Automatic FK wiring to prevent "Hallucinated FK Risk"
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  trackFocusState,
  getCurrentFocus,
  autoWireMemFK,
  autoWireTaskFK,
  detectFocusDrift,
  resetFocusState,
  resetDriftScore,
  decayDriftScore,
  getActiveSessions,
  type FocusState,
} from "../../src/lib/auto-context.js";

describe("Auto-Context State", () => {
  beforeEach(() => {
    resetFocusState();
  });

  describe("getCurrentFocus", () => {
    it("returns null initially", () => {
      assert.strictEqual(getCurrentFocus("session-123"), null);
    });

    it("returns focus state after tracking", () => {
      const focus = trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/test.ts" },
      });

      const current = getCurrentFocus("session-123");
      assert.ok(current);
      assert.strictEqual(current?.sessionId, "session-123");
    });
  });

  describe("trackFocusState", () => {
    it("tracks file_modified action", () => {
      const focus = trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/test.ts" },
      });

      assert.strictEqual(focus.sessionId, "session-123");
      assert.strictEqual(focus.lastModifiedFile, "src/lib/test.ts");
      assert.strictEqual(focus.focusDriftScore, 0);
    });

    it("tracks task_created action", () => {
      const focus = trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-uuid-123" },
      });

      assert.strictEqual(focus.activeTaskId, "task-uuid-123");
    });

    it("tracks mem_created action", () => {
      trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-uuid-123" },
      });

      trackFocusState("session-123", {
        type: "mem_created",
        payload: { memId: "mem-uuid-456" },
      });

      // activeTaskId should persist
      assert.strictEqual(getCurrentFocus("session-123")?.activeTaskId, "task-uuid-123");
    });

    it("tracks context_mapped action with drift decay", () => {
      // First create some drift
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/file1.ts" },
      });
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/tools/file2.ts" },
      });

      const beforeDrift = getCurrentFocus("session-123")?.focusDriftScore;
      assert.ok(beforeDrift && beforeDrift > 0);

      const focus = trackFocusState("session-123", {
        type: "context_mapped",
        payload: {
          level: "tactic",
          content: "Implement auto-context",
        },
      });

      // Context mapping should decay drift
      assert.ok(focus.focusDriftScore < beforeDrift!);
    });

    it("tracks command_executed action", () => {
      const focus = trackFocusState("session-123", {
        type: "command_executed",
        payload: { command: "/test" },
      });

      assert.ok(focus.recentCommands.includes("/test"));
    });

    it("limits recentCommands to 10", () => {
      for (let i = 0; i < 15; i++) {
        trackFocusState("session-123", {
          type: "command_executed",
          payload: { command: `/cmd-${i}` },
        });
      }

      const focus = getCurrentFocus("session-123");
      assert.ok(focus);
      assert.strictEqual(focus.recentCommands.length, 10);
      // Most recent should be last
      assert.strictEqual(focus.recentCommands[9], "/cmd-14");
    });

    it("updates lastFocusUpdate timestamp", () => {
      const before = Date.now();
      const focus = trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "test.ts" },
      });
      const after = Date.now();

      const updateTime = new Date(focus.lastFocusUpdate).getTime();
      assert.ok(updateTime >= before && updateTime <= after);
    });

    it("tracks phase and plan IDs", () => {
      const focus = trackFocusState("session-123", {
        type: "context_mapped",
        payload: {
          phaseId: "phase-uuid-789",
          planId: "plan-uuid-abc",
        },
      });

      assert.strictEqual(focus.activePhaseId, "phase-uuid-789");
      assert.strictEqual(focus.activePlanId, "plan-uuid-abc");
    });
  });

  describe("autoWireMemFK", () => {
    it("returns null when no focus", () => {
      assert.strictEqual(autoWireMemFK("session-123"), null);
    });

    it("returns null when no active task", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "test.ts" },
      });

      assert.strictEqual(autoWireMemFK("session-123"), null);
    });

    it("returns activeTaskId for mem FK", () => {
      trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-uuid-123" },
      });

      assert.strictEqual(autoWireMemFK("session-123"), "task-uuid-123");
    });
  });

  describe("autoWireTaskFK", () => {
    it("returns null when no focus", () => {
      assert.strictEqual(autoWireTaskFK("session-123"), null);
    });

    it("returns null when no active phase", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "test.ts" },
      });

      assert.strictEqual(autoWireTaskFK("session-123"), null);
    });

    it("returns activePhaseId for task FK", () => {
      trackFocusState("session-123", {
        type: "context_mapped",
        payload: { phaseId: "phase-uuid-789" },
      });

      assert.strictEqual(autoWireTaskFK("session-123"), "phase-uuid-789");
    });
  });

  describe("detectFocusDrift", () => {
    it("returns null when no focus", () => {
      const result = detectFocusDrift("some-file.ts", "session-123");
      assert.strictEqual(result, null);
    });

    it("returns null when no last modified file", () => {
      trackFocusState("session-123", {
        type: "context_mapped",
        payload: { level: "tactic" },
      });

      const result = detectFocusDrift("some-file.ts", "session-123");
      assert.strictEqual(result, null);
    });

    it("returns null when same file modified", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/auto-context.ts" },
      });

      const result = detectFocusDrift("src/lib/auto-context.ts", "session-123");
      assert.strictEqual(result, null);
    });

    it("returns null when same directory different file", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/auto-context.ts" },
      });

      // Modify a different file in SAME directory
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/other-file.ts" },
      });

      // Same directory = no drift (working in same area)
      const result = detectFocusDrift("src/lib/auto-context.ts", "session-123");
      assert.strictEqual(result, null);
    });

    it("returns null when within same directory", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/auto-context.ts" },
      });

      // Same directory should not trigger drift
      const result = detectFocusDrift("src/lib/other-file.ts", "session-123");
      assert.strictEqual(result, null);
    });

    it("detects drift across different directories", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/auto-context.ts" },
      });

      // Track a file in different directory
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/tools/hivemind-session.ts" },
      });

      // Check drift against original lib file
      const result = detectFocusDrift("src/lib/auto-context.ts", "session-123");
      assert.ok(result);
      assert.strictEqual(result.drifted, true);
    });
  });

  describe("resetFocusState", () => {
    it("clears specific session focus state", () => {
      trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-uuid-123" },
      });

      trackFocusState("session-456", {
        type: "task_created",
        payload: { taskId: "task-uuid-456" },
      });

      resetFocusState("session-123");

      assert.strictEqual(getCurrentFocus("session-123"), null);
      assert.ok(getCurrentFocus("session-456"));
    });

    it("clears all focus state when no sessionId provided", () => {
      trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-uuid-123" },
      });

      resetFocusState();

      assert.strictEqual(getCurrentFocus("session-123"), null);
    });

    it("allows fresh start after reset", () => {
      trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-uuid-123" },
      });

      resetFocusState("session-123");

      const focus = trackFocusState("session-456", {
        type: "file_modified",
        payload: { file: "new-file.ts" },
      });

      assert.strictEqual(focus.sessionId, "session-456");
      assert.strictEqual(focus.activeTaskId, null);
    });
  });

  describe("Focus Drift Score", () => {
    it("starts at 0", () => {
      const focus = trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "test.ts" },
      });

      assert.strictEqual(focus.focusDriftScore, 0);
    });

    it("increases on directory switches", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/file1.ts" },
      });

      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/tools/file2.ts" },
      });

      const focus = getCurrentFocus("session-123");
      assert.ok(focus);
      assert.ok(focus.focusDriftScore > 0, "Drift score should increase on directory switch");
    });

    it("does not increase on same directory", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/file1.ts" },
      });

      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/file2.ts" },
      });

      const focus = getCurrentFocus("session-123");
      assert.ok(focus);
      assert.strictEqual(focus.focusDriftScore, 0, "Drift score should not increase in same directory");
    });

    it("decreases on context_mapped", () => {
      // Create some drift
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/file1.ts" },
      });
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/tools/file2.ts" },
      });

      const beforeDrift = getCurrentFocus("session-123")?.focusDriftScore;
      assert.ok(beforeDrift && beforeDrift > 0);

      trackFocusState("session-123", {
        type: "context_mapped",
        payload: { level: "tactic" },
      });

      const afterDrift = getCurrentFocus("session-123")?.focusDriftScore;
      assert.ok(afterDrift && afterDrift < beforeDrift);
    });
  });

  describe("resetDriftScore", () => {
    it("resets drift score to 0", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/file1.ts" },
      });
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/tools/file2.ts" },
      });

      const beforeDrift = getCurrentFocus("session-123")?.focusDriftScore;
      assert.ok(beforeDrift && beforeDrift > 0);

      resetDriftScore("session-123");

      const afterDrift = getCurrentFocus("session-123")?.focusDriftScore;
      assert.strictEqual(afterDrift, 0);
    });
  });

  describe("decayDriftScore", () => {
    it("decays drift by specified amount", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/file1.ts" },
      });
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/tools/file2.ts" },
      });
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/hooks/file3.ts" },
      });

      const beforeDrift = getCurrentFocus("session-123")?.focusDriftScore;
      assert.ok(beforeDrift && beforeDrift >= 20);

      decayDriftScore("session-123", 10);

      const afterDrift = getCurrentFocus("session-123")?.focusDriftScore;
      assert.strictEqual(afterDrift, beforeDrift! - 10);
    });

    it("does not go below 0", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "test.ts" },
      });

      decayDriftScore("session-123", 100);

      const drift = getCurrentFocus("session-123")?.focusDriftScore;
      assert.strictEqual(drift, 0);
    });
  });

  describe("Multi-Session Support", () => {
    it("isolates focus state between sessions", () => {
      trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-123" },
      });

      trackFocusState("session-456", {
        type: "task_created",
        payload: { taskId: "task-456" },
      });

      assert.strictEqual(autoWireMemFK("session-123"), "task-123");
      assert.strictEqual(autoWireMemFK("session-456"), "task-456");
    });

    it("getActiveSessions returns all session IDs", () => {
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "test.ts" },
      });

      trackFocusState("session-456", {
        type: "file_modified",
        payload: { file: "test2.ts" },
      });

      const sessions = getActiveSessions();
      assert.strictEqual(sessions.length, 2);
      assert.ok(sessions.includes("session-123"));
      assert.ok(sessions.includes("session-456"));
    });

    it("resetFocusState with sessionId only clears that session", () => {
      trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-123" },
      });

      trackFocusState("session-456", {
        type: "task_created",
        payload: { taskId: "task-456" },
      });

      resetFocusState("session-123");

      assert.strictEqual(getCurrentFocus("session-123"), null);
      assert.strictEqual(autoWireMemFK("session-456"), "task-456");
    });
  });

  describe("Integration scenarios", () => {
    it("tracks typical workflow: task -> file -> mem", () => {
      // 1. Create task
      trackFocusState("session-123", {
        type: "task_created",
        payload: { taskId: "task-abc" },
      });

      // 2. Work on file
      trackFocusState("session-123", {
        type: "file_modified",
        payload: { file: "src/lib/feature.ts" },
      });

      // 3. Create mem - should auto-wire to task
      const fk = autoWireMemFK("session-123");
      assert.strictEqual(fk, "task-abc");
    });

    it("tracks phase -> task workflow", () => {
      // 1. Map context with phase
      trackFocusState("session-123", {
        type: "context_mapped",
        payload: { phaseId: "phase-xyz" },
      });

      // 2. Create task - should auto-wire to phase
      const fk = autoWireTaskFK("session-123");
      assert.strictEqual(fk, "phase-xyz");
    });
  });
});
