import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  clearAuditLog,
  clearMutationQueue,
  flushMutations,
  flushTaskManifestMutations,
  getAuditLog,
  getAuditLogBySource,
  getAuditLogSummary,
  getPendingMutationCount,
  queueStateMutation,
  queueTaskManifestMutation,
} from "../../src/lib/state-mutation-queue.js";
import type { BrainState } from "../../src/schemas/brain-state.js";
import { createBrainState } from "../../src/schemas/brain-state.js";
import { createConfig } from "../../src/schemas/config.js";
import type { StateManager } from "../../src/lib/persistence.js";

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

function createTestState(): BrainState {
  return createBrainState("test-session-id", createConfig(), "plan_driven");
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("State Mutation Queue Audit Trail", () => {
  beforeEach(() => {
    clearMutationQueue();
    clearAuditLog();
  });

  afterEach(() => {
    clearMutationQueue();
    clearAuditLog();
  });

  it("audit log is empty initially", () => {
    assert.deepStrictEqual(getAuditLog(), []);
    assert.deepStrictEqual(getAuditLogSummary(), {
      totalApplied: 0,
      sources: {},
      oldestEntry: null,
      newestEntry: null,
    });
  });

  it("records audit entries with expected fields after flushMutations", async () => {
    const stateManager = createMockStateManager(createTestState());

    queueStateMutation({
      type: "UPDATE_METRICS",
      payload: { metrics: { turn_count: 3 } as BrainState["metrics"] },
      source: "hook.alpha",
      priority: 1,
    });
    queueStateMutation({
      type: "UPDATE_STATE",
      payload: { version: "2.9.0" },
      source: "hook.beta",
      priority: 2,
    });

    const applied = await flushMutations(stateManager);
    assert.strictEqual(applied, 2);

    const entries = getAuditLog();
    assert.strictEqual(entries.length, 2);

    for (const entry of entries) {
      assert.match(entry.id, UUID_REGEX);
      assert.ok(entry.type);
      assert.ok(entry.source.length > 0);
      assert.ok(Date.parse(entry.timestamp) > 0);
      assert.ok(Date.parse(entry.appliedAt) > 0);
      assert.ok(Array.isArray(entry.payloadKeys));
      assert.strictEqual(typeof entry.queueDepthAtApplication, "number");
    }
  });

  it("caps audit log at MAX_AUDIT_LOG entries", async () => {
    const stateManager = createMockStateManager(createTestState());

    for (let i = 0; i < 60; i += 1) {
      queueStateMutation({
        type: "UPDATE_STATE",
        payload: { version: `v${i}` },
        source: `source-${i}`,
      });
    }

    await flushMutations(stateManager);

    const entries = getAuditLog();
    assert.strictEqual(entries.length, 50);
    assert.strictEqual(entries[0].source, "source-10");
    assert.strictEqual(entries[49].source, "source-59");
  });

  it("filters audit entries by source", async () => {
    const stateManager = createMockStateManager(createTestState());

    queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "hook.a" });
    queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "hook.b" });
    queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "hook.a" });

    await flushMutations(stateManager);

    const filtered = getAuditLogBySource("hook.a");
    assert.strictEqual(filtered.length, 2);
    filtered.forEach((entry) => assert.strictEqual(entry.source, "hook.a"));
  });

  it("returns accurate summary stats", async () => {
    const stateManager = createMockStateManager(createTestState());

    queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "summary.a" });
    queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "summary.a" });
    queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "summary.b" });

    await flushMutations(stateManager);

    const entries = getAuditLog();
    const summary = getAuditLogSummary();

    assert.strictEqual(summary.totalApplied, 3);
    assert.deepStrictEqual(summary.sources, {
      "summary.a": 2,
      "summary.b": 1,
    });
    assert.strictEqual(summary.oldestEntry, entries[0].id);
    assert.strictEqual(summary.newestEntry, entries[entries.length - 1].id);
  });

  it("clearAuditLog empties entries", async () => {
    const stateManager = createMockStateManager(createTestState());

    queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "clear.me" });
    await flushMutations(stateManager);
    assert.strictEqual(getAuditLog().length, 1);

    clearAuditLog();
    assert.deepStrictEqual(getAuditLog(), []);
  });

  it("records audit entries for task manifest flushes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hivemind-audit-task-"));
    try {
      queueTaskManifestMutation({
        type: "UPSERT_TASKS_MANIFEST",
        directory,
        payload: {
          session_id: "sess-audit-1",
          updated_at: Date.now(),
          tasks: [{ id: "t1", text: "Task 1", status: "pending" }],
        },
        source: "task-manifest.test",
      });

      const flushed = await flushTaskManifestMutations();
      assert.strictEqual(flushed, 1);

      const entries = getAuditLog();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, "UPSERT_TASKS_MANIFEST");
      assert.strictEqual(entries[0].source, "task-manifest.test");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("captures only top-level payload keys", async () => {
    const stateManager = createMockStateManager(createTestState());

    queueStateMutation({
      type: "UPDATE_STATE",
      payload: {
        metrics: {
          turn_count: 12,
          context_updates: 4,
        } as BrainState["metrics"],
        hierarchy: {
          trajectory: "T",
          tactic: "Ta",
          action: "A",
        },
      },
      source: "payload-keys.test",
    });

    await flushMutations(stateManager);
    const entry = getAuditLog()[0];

    assert.deepStrictEqual(entry.payloadKeys.sort(), ["hierarchy", "metrics"]);
    assert.ok(!entry.payloadKeys.includes("turn_count"));
  });

  it("records accurate queueDepthAtApplication", async () => {
    const stateManager = createMockStateManager(createTestState());

    queueStateMutation({
      type: "UPDATE_STATE",
      payload: { version: "first" },
      source: "depth.test",
      priority: 1,
    });
    queueStateMutation({
      type: "UPDATE_STATE",
      payload: { version: "second" },
      source: "depth.test",
      priority: 2,
    });

    await flushMutations(stateManager);

    const entries = getAuditLog();
    assert.strictEqual(entries.length, 2);
    assert.deepStrictEqual(
      entries.map((entry) => entry.queueDepthAtApplication),
      [2, 1]
    );
  });

  it("generates valid UUID and ISO timestamps for audit entries", async () => {
    const stateManager = createMockStateManager(createTestState());

    queueStateMutation({ type: "UPDATE_STATE", payload: {}, source: "format.test" });
    await flushMutations(stateManager);

    const entry = getAuditLog()[0];
    assert.match(entry.id, UUID_REGEX);
    assert.ok(!Number.isNaN(Date.parse(entry.timestamp)));
    assert.ok(!Number.isNaN(Date.parse(entry.appliedAt)));
  });

  it("does not commit audit entries when flushMutations save fails", async () => {
    const failingStateManager: StateManager = {
      load: async () => createTestState(),
      save: async () => {
        throw new Error("Save failed");
      },
      withState: async () => null,
      initialize: async () => createTestState(),
      exists: () => true,
    };

    queueStateMutation({
      type: "UPDATE_STATE",
      payload: { version: "pending" },
      source: "failure-path.test",
    });

    await assert.rejects(async () => flushMutations(failingStateManager), /Save failed/);
    assert.strictEqual(getPendingMutationCount(), 1);
    assert.deepStrictEqual(getAuditLog(), []);

    const successStateManager = createMockStateManager(createTestState());
    const applied = await flushMutations(successStateManager);
    assert.strictEqual(applied, 1);
    assert.strictEqual(getAuditLog().length, 1);
  });
});
