/**
 * Tests for State Mutation Queue
 *
 * US-053: CQRS-compliant state mutation mechanism
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  queueStateMutation,
  queueTaskManifestMutation,
  flushMutations,
  flushTaskManifestMutations,
  getPendingMutationCount,
  getPendingTaskManifestMutationCount,
  getPendingMutations,
  clearMutationQueue,
  hasPendingMutationsFrom,
  getMutationsBySource,
} from "../../src/lib/state-mutation-queue.js";
import type { BrainState } from "../../src/schemas/brain-state.js";
import { createBrainState } from "../../src/schemas/brain-state.js";
import { createConfig } from "../../src/schemas/config.js";
import type { StateManager } from "../../src/lib/persistence.js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getEffectivePaths } from "../../src/lib/paths.js";

// Mock state manager for testing
function createMockStateManager(initialState: BrainState | null): StateManager {
  let state = initialState;
  return {
    load: async () => state,
    save: async (newState: BrainState) => {
      state = newState;
    },
    withState: async (fn) => {
      if (!state) return null;
      state = await fn(state);
      return state;
    },
    initialize: async (sessionId, config) => {
      state = createBrainState(sessionId, config);
      return state;
    },
    exists: () => state !== null,
  };
}

// Helper to create test brain state
function createTestState(): BrainState {
  return createBrainState("test-session-id", createConfig(), "plan_driven");
}

describe("State Mutation Queue", () => {
  beforeEach(() => {
    clearMutationQueue();
  });

  afterEach(() => {
    clearMutationQueue();
  });

  describe("queueStateMutation", () => {
    it("adds mutation to queue", () => {
      queueStateMutation({
        type: "UPDATE_METRICS",
        payload: { metrics: { turn_count: 5 } as BrainState["metrics"] },
        source: "test-hook",
      });

      assert.strictEqual(getPendingMutationCount(), 1);
    });

    it("auto-generates timestamp", () => {
      queueStateMutation({
        type: "UPDATE_STATE",
        payload: {},
        source: "test-hook",
      });

      const mutations = getPendingMutations();
      assert.ok(mutations[0].timestamp);
      assert.ok(new Date(mutations[0].timestamp).getTime() > 0);
    });

    it("supports priority ordering", () => {
      queueStateMutation({
        type: "UPDATE_STATE",
        payload: { version: "1" },
        source: "low-priority",
        priority: 1,
      });

      queueStateMutation({
        type: "UPDATE_STATE",
        payload: { version: "2" },
        source: "high-priority",
        priority: 10,
      });

      const mutations = getPendingMutations();
      assert.strictEqual(mutations[0].priority, 1);
      assert.strictEqual(mutations[1].priority, 10);
    });
  });

  describe("getPendingMutationCount", () => {
    it("returns 0 for empty queue", () => {
      assert.strictEqual(getPendingMutationCount(), 0);
    });

    it("returns correct count after mutations queued", () => {
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "a" });
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "b" });
      assert.strictEqual(getPendingMutationCount(), 2);
    });
  });

  describe("getPendingMutations", () => {
    it("returns copy of mutations", () => {
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "test" });

      const copy1 = getPendingMutations();
      const copy2 = getPendingMutations();

      assert.notStrictEqual(copy1, copy2);
      assert.deepStrictEqual(copy1, copy2);
    });

    it("returns empty array when queue is empty", () => {
      const mutations = getPendingMutations();
      assert.deepStrictEqual(mutations, []);
    });
  });

  describe("clearMutationQueue", () => {
    it("clears all mutations", () => {
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "a" });
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "b" });

      clearMutationQueue();

      assert.strictEqual(getPendingMutationCount(), 0);
    });
  });

  describe("hasPendingMutationsFrom", () => {
    it("returns true when source has mutations", () => {
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "hook-a" });
      assert.ok(hasPendingMutationsFrom("hook-a"));
    });

    it("returns false when source has no mutations", () => {
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "hook-a" });
      assert.ok(!hasPendingMutationsFrom("hook-b"));
    });
  });

  describe("getMutationsBySource", () => {
    it("filters mutations by source", () => {
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "hook-a" });
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "hook-b" });
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "hook-a" });

      const mutations = getMutationsBySource("hook-a");
      assert.strictEqual(mutations.length, 2);
      mutations.forEach((m) => assert.strictEqual(m.source, "hook-a"));
    });
  });

  describe("flushMutations", () => {
    it("returns 0 for empty queue", async () => {
      const stateManager = createMockStateManager(createTestState());
      const count = await flushMutations(stateManager);
      assert.strictEqual(count, 0);
    });

    it("returns 0 when state is null", async () => {
      const stateManager = createMockStateManager(null);
      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "test" });

      const count = await flushMutations(stateManager);
      assert.strictEqual(count, 0);
      // Mutations should remain in queue
      assert.strictEqual(getPendingMutationCount(), 1);
    });

    it("applies mutations and clears queue", async () => {
      const initialState = createTestState();
      const stateManager = createMockStateManager(initialState);

      queueStateMutation({
        type: "UPDATE_METRICS",
        payload: {
          metrics: { ...initialState.metrics, turn_count: 5 },
        },
        source: "test-hook",
      });

      const count = await flushMutations(stateManager);
      assert.strictEqual(count, 1);
      assert.strictEqual(getPendingMutationCount(), 0);

      const savedState = await stateManager.load();
      assert.ok(savedState);
      assert.strictEqual(savedState.metrics.turn_count, 5);
    });

    it("applies mutations in priority order", async () => {
      const initialState = createTestState();
      const stateManager = createMockStateManager(initialState);

      // Low priority first, but high priority should be applied last (wins)
      queueStateMutation({
        type: "UPDATE_STATE",
        payload: { version: "low" },
        source: "low",
        priority: 1,
      });

      queueStateMutation({
        type: "UPDATE_STATE",
        payload: { version: "high" },
        source: "high",
        priority: 10,
      });

      await flushMutations(stateManager);

      const savedState = await stateManager.load();
      assert.ok(savedState);
      // High priority applied last, so its version wins
      assert.strictEqual(savedState.version, "high");
    });

    it("merges nested objects deeply", async () => {
      const initialState = createTestState();
      const stateManager = createMockStateManager(initialState);

      queueStateMutation({
        type: "UPDATE_HIERARCHY",
        payload: {
          hierarchy: {
            trajectory: "New Trajectory",
            tactic: "",
            action: "",
          },
        },
        source: "test",
      });

      await flushMutations(stateManager);

      const savedState = await stateManager.load();
      assert.ok(savedState);
      assert.strictEqual(savedState.hierarchy.trajectory, "New Trajectory");
      // Other hierarchy fields should be preserved (deep merge)
      assert.strictEqual(savedState.hierarchy.tactic, "");
      assert.strictEqual(savedState.hierarchy.action, "");
    });

    it("leaves mutations in queue on error", async () => {
      const stateManager: StateManager = {
        load: async () => createTestState(),
        save: async () => {
          throw new Error("Save failed");
        },
        withState: async () => null,
        initialize: async () => createTestState(),
        exists: () => true,
      };

      queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "test" });

      await assert.rejects(
        async () => flushMutations(stateManager),
        /Save failed/
      );

      // Mutations should remain in queue
      assert.strictEqual(getPendingMutationCount(), 1);
    });
  });

  describe("task manifest mutation queue", () => {
    it("queues and flushes todo manifest mutations", async () => {
      const directory = await mkdtemp(join(tmpdir(), "hivemind-task-queue-"));
      try {
        queueTaskManifestMutation({
          type: "UPSERT_TASKS_MANIFEST",
          directory,
          payload: {
            session_id: "sess-queue-1",
            updated_at: Date.now(),
            tasks: [{ id: "t1", text: "Task 1", status: "pending" }],
          },
          source: "test.queue",
        });

        assert.strictEqual(getPendingTaskManifestMutationCount(), 1);

        const flushed = await flushTaskManifestMutations();
        assert.strictEqual(flushed, 1);
        assert.strictEqual(getPendingTaskManifestMutationCount(), 0);

        const content = await readFile(getEffectivePaths(directory).tasks, "utf-8");
        const parsed = JSON.parse(content);
        assert.strictEqual(parsed.session_id, "sess-queue-1");
        assert.strictEqual(parsed.tasks.length, 1);
        assert.strictEqual(parsed.tasks[0].id, "t1");
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });
  });

  describe("Queue Overflow", () => {
    it("drops oldest mutation on overflow", () => {
      // Fill queue to max (100 items)
      for (let i = 0; i < 100; i++) {
        queueStateMutation({
          type: "UPDATE_STATE",
          payload: { version: `v${i}` },
          source: `source-${i}`,
        });
      }

      // Add one more - should trigger overflow
      queueStateMutation({
        type: "UPDATE_STATE",
        payload: { version: "overflow" },
        source: "overflow-source",
      });

      // Queue should still be at max size
      assert.strictEqual(getPendingMutationCount(), 100);

      // First mutation should be from source-1 (source-0 was dropped)
      const mutations = getPendingMutations();
      assert.strictEqual(mutations[0].source, "source-1");

      // Last mutation should be overflow-source
      assert.strictEqual(mutations[99].source, "overflow-source");
    });
  });
});
