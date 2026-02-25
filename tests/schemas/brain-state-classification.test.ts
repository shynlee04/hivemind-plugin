import { describe, it } from "node:test";
import assert from "node:assert";

import type { BrainState, FieldLifecycle } from "../../src/schemas/brain-state.js";
import {
  BRAIN_STATE_FIELD_CLASSIFICATION,
  carryForwardHybridFields,
  createBrainState,
  getFieldsByLifecycle,
  getHybridFields,
  getPersistentFields,
  getRuntimeFields,
} from "../../src/schemas/brain-state.js";
import { createConfig } from "../../src/schemas/config.js";

function createTestState(sessionId: string): BrainState {
  return createBrainState(sessionId, createConfig(), "plan_driven");
}

describe("brain-state field classification", () => {
  it("classification map covers all BrainState keys", () => {
    const state = createTestState("classification-coverage");
    const stateKeys = Object.keys(state).sort();
    const classificationKeys = Object.keys(BRAIN_STATE_FIELD_CLASSIFICATION).sort();

    assert.deepStrictEqual(classificationKeys, stateKeys);
  });

  it("getFieldsByLifecycle('runtime') returns expected runtime fields", () => {
    assert.deepStrictEqual(getFieldsByLifecycle("runtime"), [
      "session",
      "hierarchy",
      "metrics",
      "first_turn_context_injected",
      "complexity_nudge_shown",
      "last_commit_suggestion_turn",
      "cycle_log",
      "pending_failure_ack",
      "compaction_limit_reached",
      "recent_messages",
    ]);
  });

  it("getFieldsByLifecycle('persistent') returns expected persistent fields", () => {
    assert.deepStrictEqual(getFieldsByLifecycle("persistent"), ["version"]);
  });

  it("getFieldsByLifecycle('hybrid') returns expected hybrid fields", () => {
    assert.deepStrictEqual(getFieldsByLifecycle("hybrid"), [
      "compaction_count",
      "last_compaction_time",
      "next_compaction_report",
      "framework_selection",
    ]);
  });

  it("getHybridFields matches getFieldsByLifecycle('hybrid')", () => {
    assert.deepStrictEqual(getHybridFields(), getFieldsByLifecycle("hybrid"));
  });

  it("carryForwardHybridFields copies hybrid values from old state", () => {
    const oldState = createTestState("old-state");
    const newState = createTestState("new-state");

    oldState.compaction_count = 77;
    oldState.last_compaction_time = 1700000000000;
    oldState.next_compaction_report = "carry this report";
    oldState.framework_selection = {
      choice: "gsd",
      active_phase: "phase-b",
      active_spec_path: "docs/spec.md",
      acceptance_note: "accepted",
      updated_at: 1700000000100,
    };

    const carried = carryForwardHybridFields(oldState, newState);

    assert.strictEqual(carried.compaction_count, oldState.compaction_count);
    assert.strictEqual(carried.last_compaction_time, oldState.last_compaction_time);
    assert.strictEqual(carried.next_compaction_report, oldState.next_compaction_report);
    assert.deepStrictEqual(carried.framework_selection, oldState.framework_selection);
  });

  it("carryForwardHybridFields does not copy runtime fields", () => {
    const oldState = createTestState("old-runtime");
    const newState = createTestState("new-runtime");

    oldState.session.id = "old-session";
    oldState.metrics.turn_count = 999;
    oldState.pending_failure_ack = true;

    newState.session.id = "new-session";
    newState.metrics.turn_count = 2;
    newState.pending_failure_ack = false;

    const carried = carryForwardHybridFields(oldState, newState);

    assert.strictEqual(carried.session.id, "new-session");
    assert.strictEqual(carried.metrics.turn_count, 2);
    assert.strictEqual(carried.pending_failure_ack, false);
  });

  it("carryForwardHybridFields preserves new state's runtime values", () => {
    const oldState = createTestState("old-values");
    const newState = createTestState("new-values");

    oldState.first_turn_context_injected = false;
    oldState.cycle_log = [{
      timestamp: 1700000000200,
      tool: "task",
      output_excerpt: "old",
      failure_detected: true,
      failure_keywords: ["failed"],
    }];

    newState.first_turn_context_injected = true;
    newState.cycle_log = [{
      timestamp: 1700000000300,
      tool: "task",
      output_excerpt: "new",
      failure_detected: false,
      failure_keywords: [],
    }];

    const carried = carryForwardHybridFields(oldState, newState);

    assert.strictEqual(carried.first_turn_context_injected, true);
    assert.deepStrictEqual(carried.cycle_log, newState.cycle_log);
  });

  it("classification map has no unknown lifecycle values", () => {
    const allowed: FieldLifecycle[] = ["runtime", "persistent", "hybrid"];
    for (const lifecycle of Object.values(BRAIN_STATE_FIELD_CLASSIFICATION)) {
      assert.ok(allowed.includes(lifecycle));
    }
  });

  it("every BrainState field is classified (compile-time exhaustive check)", () => {
    const exhaustiveCheck: Record<keyof BrainState, FieldLifecycle> = BRAIN_STATE_FIELD_CLASSIFICATION;
    assert.ok(exhaustiveCheck);
  });
});
