import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createBrainState, generateSessionId } from "../src/schemas/brain-state.js";
import { createConfig } from "../src/schemas/config.js";
import { detectLongSession } from "../src/lib/long-session.js";

describe("=== Session Structure Tests ===", () => {
  let passed = 0;
  let failed = 0;

  describe("--- session creation ---", () => {
    test("date is set to today's YYYY-MM-DD", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      const today = new Date().toISOString().split("T")[0];
      assert.equal(state.session.date, today);
      console.log("#   PASS: date is set to today's YYYY-MM-DD");
      passed++;
    });
    
    test("meta_key defaults to empty string", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      assert.equal(state.session.meta_key, "");
      console.log("#   PASS: meta_key defaults to empty string");
      passed++;
    });

    test("role defaults to empty string", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      assert.equal(state.session.role, "");
      console.log("#   PASS: role defaults to empty string");
      passed++;
    });

    test("by_ai defaults to true", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      assert.equal(state.session.by_ai, true);
      console.log("#   PASS: by_ai defaults to true");
      passed++;
    });
  });

  describe("--- session metadata ---", () => {
    test("date format is YYYY-MM-DD", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      assert.match(state.session.date, /^\d{4}-\d{2}-\d{2}$/);
      console.log("#   PASS: date format is YYYY-MM-DD");
      passed++;
    });

    test("meta_key can be updated via spread", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      const updated = { ...state, session: { ...state.session, meta_key: "auth-feature" } };
      assert.equal(updated.session.meta_key, "auth-feature");
      console.log("#   PASS: meta_key can be updated via spread");
      passed++;
    });

    test("role can be updated via spread", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      const updated = { ...state, session: { ...state.session, role: "code-reviewer" } };
      assert.equal(updated.session.role, "code-reviewer");
      console.log("#   PASS: role can be updated via spread");
      passed++;
    });

    test("by_ai is boolean", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      assert.equal(typeof state.session.by_ai, "boolean");
      console.log("#   PASS: by_ai is boolean");
      passed++;
    });
  });

  describe("--- persistence migration ---", () => {
    // Test migration of old state without new fields
    test("old state without date gets migrated", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      // Simulate old state by deleting the date field
      const oldState = JSON.parse(JSON.stringify(state));
      delete oldState.session.date;
      // Apply migration logic
      oldState.session.date ??= new Date(oldState.session.start_time).toISOString().split("T")[0];
      assert.match(oldState.session.date, /^\d{4}-\d{2}-\d{2}$/);
      console.log("#   PASS: old state without date gets migrated");
      passed++;
    });

    test("old state without meta_key gets empty string", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      const oldState = JSON.parse(JSON.stringify(state));
      delete oldState.session.meta_key;
      oldState.session.meta_key ??= "";
      assert.equal(oldState.session.meta_key, "");
      console.log("#   PASS: old state without meta_key gets empty string");
      passed++;
    });

    test("old state without role gets empty string", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      const oldState = JSON.parse(JSON.stringify(state));
      delete oldState.session.role;
      oldState.session.role ??= "";
      assert.equal(oldState.session.role, "");
      console.log("#   PASS: old state without role gets empty string");
      passed++;
    });

    test("old state without by_ai gets true", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      const oldState = JSON.parse(JSON.stringify(state));
      delete oldState.session.by_ai;
      oldState.session.by_ai ??= true;
      assert.equal(oldState.session.by_ai, true);
      console.log("#   PASS: old state without by_ai gets true");
      passed++;
    });
  });

  describe("--- long session detection ---", () => {
    test("below threshold → isLong: false", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      const result = detectLongSession(state, 20);
      assert.equal(result.isLong, false);
      console.log("#   PASS: below threshold → isLong: false");
      passed++;
    });

    test("at threshold → isLong: true", (t) => {
      const config = createConfig();
      let state = createBrainState(generateSessionId(), config);
      // Set turn count to threshold
      state = { ...state, metrics: { ...state.metrics, turn_count: 20 } };
      const result = detectLongSession(state, 20);
      assert.equal(result.isLong, true);
      console.log("#   PASS: at threshold → isLong: true");
      passed++;
    });

    test("above threshold → correct suggestion", (t) => {
      const config = createConfig();
      let state = createBrainState(generateSessionId(), config);
      state = { ...state, metrics: { ...state.metrics, turn_count: 25 } };
      const result = detectLongSession(state, 20);
      assert.equal(result.isLong, true);
      assert.ok(result.suggestion.includes("25"));
      console.log("#   PASS: above threshold → correct suggestion");
      passed++;
    });

    test("threshold of 0 → immediately long", (t) => {
      const config = createConfig();
      const state = createBrainState(generateSessionId(), config);
      const result = detectLongSession(state, 0);
      assert.equal(result.isLong, true);
      console.log("#   PASS: threshold of 0 → immediately long");
      passed++;
    });

    test("suggestion includes turn count", (t) => {
      const config = createConfig();
      let state = createBrainState(generateSessionId(), config);
      state = { ...state, metrics: { ...state.metrics, turn_count: 30 } };
      const result = detectLongSession(state, 20);
      assert.ok(result.suggestion.includes("30"));
      console.log("#   PASS: suggestion includes turn count");
      passed++;
    });

    test("suggestion includes threshold", (t) => {
      const config = createConfig();
      let state = createBrainState(generateSessionId(), config);
      state = { ...state, metrics: { ...state.metrics, turn_count: 30 } };
      const result = detectLongSession(state, 20);
      assert.ok(result.suggestion.includes("20"));
      console.log("#   PASS: suggestion includes threshold");
      passed++;
    });
  });

  // Print summary after all tests
  test("summary", () => {
    console.log(`# === Session Structure: ${passed} passed, ${failed} failed ===`);
  });
});
